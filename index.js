const { list, get } = require('@vercel/blob');

// Each profile is its own small file under this prefix, e.g.
// staff-register/profiles/abc123.json — instead of one giant shared file.
// This means saving one profile never touches (or risks) any other profile,
// and there's no single request that grows as the register grows.
const PREFIX = 'staff-register/profiles/';

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: PREFIX });

      const profiles = await Promise.all(
        blobs.map(async function (b) {
          try {
            const result = await get(b.pathname, { access: 'private', useCache: false });
            if (!result || !result.stream) return null;
            const text = await new Response(result.stream).text();
            return text ? JSON.parse(text) : null;
          } catch (e) {
            return null;
          }
        })
      );

      return res.status(200).json(profiles.filter(Boolean));
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('profiles list error:', err);
    return res.status(500).json({
      error: 'Storage is not connected yet. In your Vercel project, go to Storage → Create Database → Blob, connect it to this project, then redeploy.'
    });
  }
};
