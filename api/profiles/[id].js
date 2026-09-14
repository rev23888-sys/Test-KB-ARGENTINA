const { put, del, get } = require('@vercel/blob');

function pathFor(id) {
  return 'staff-register/profiles/' + id + '.json';
}

// A small separate file mapping each employee code -> profile id, so a code
// lookup never has to scan every profile. It stays tiny (a few dozen bytes
// per profile) even once the register itself has thousands of entries.
const INDEX_PATH = 'staff-register/code-index.json';

var CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L — easy to read and type

function generateCode() {
  var code = '';
  for (var i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function readCodeIndex() {
  try {
    var result = await get(INDEX_PATH, { access: 'private', useCache: false });
    if (!result || !result.stream) return {};
    var text = await new Response(result.stream).text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
}

async function writeCodeIndex(index) {
  await put(INDEX_PATH, JSON.stringify(index), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function ensureUniqueCode(index) {
  var code, attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (index[code] && attempts < 25);
  return code;
}

module.exports = async function handler(req, res) {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Missing profile id.' });
    }

    if (req.method === 'PUT') {
      const profile = req.body;
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return res.status(400).json({ error: 'Expected a single profile object.' });
      }

      const index = await readCodeIndex();

      // Keep this profile's existing code if it has one; otherwise this is
      // effectively a first save, so mint a fresh one now.
      if (!profile.code || index[profile.code] === undefined) {
        profile.code = await ensureUniqueCode(index);
      }
      index[profile.code] = id;

      await put(pathFor(id), JSON.stringify(profile), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true
      });
      await writeCodeIndex(index);

      return res.status(200).json({ ok: true, code: profile.code });
    }

    if (req.method === 'DELETE') {
      // Best-effort: also remove this profile's code from the index so an
      // old code can never resolve to a deleted profile.
      try {
        const existing = await get(pathFor(id), { access: 'private', useCache: false });
        if (existing && existing.stream) {
          const text = await new Response(existing.stream).text();
          const profile = text ? JSON.parse(text) : null;
          if (profile && profile.code) {
            const index = await readCodeIndex();
            delete index[profile.code];
            await writeCodeIndex(index);
          }
        }
      } catch (e) {
        // Non-fatal — the profile blob itself is still removed below.
      }

      await del(pathFor(id)).catch(function () {
        // Already gone (or never existed) — treat as success either way.
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('profile save/delete error:', err);
    return res.status(500).json({
      error: 'Could not save this profile. Make sure Blob storage is connected, then try again.'
    });
  }
};
