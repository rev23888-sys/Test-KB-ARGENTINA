const { get } = require('@vercel/blob');

const INDEX_PATH = 'staff-register/code-index.json';

function pathFor(id) {
  return 'staff-register/profiles/' + id + '.json';
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const code = (req.query.code || '').toString().trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Missing code.' });
    }

    var index = {};
    try {
      const idxResult = await get(INDEX_PATH, { access: 'private', useCache: false });
      if (idxResult && idxResult.stream) {
        const text = await new Response(idxResult.stream).text();
        index = text ? JSON.parse(text) : {};
      }
    } catch (e) {
      // No index yet (no profiles saved at all) — falls through to 404 below.
    }

    const id = index[code];
    if (!id) {
      return res.status(404).json({ error: "That code doesn't match any profile." });
    }

    const result = await get(pathFor(id), { access: 'private', useCache: false });
    if (!result || !result.stream) {
      return res.status(404).json({ error: "That code doesn't match any profile." });
    }

    const text = await new Response(result.stream).text();
    const profile = text ? JSON.parse(text) : null;
    if (!profile) {
      return res.status(404).json({ error: "That code doesn't match any profile." });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error('code lookup error:', err);
    return res.status(500).json({ error: 'Something went wrong looking up that code. Please try again.' });
  }
};
