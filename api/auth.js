// POST /api/auth — verify an admin token against the server-side ADMIN_TOKEN
// env var. Returns 200 on match, 401 on mismatch.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const required = process.env.ADMIN_TOKEN;
  if (!required) {
    return res.status(500).json({
      error:
        'ADMIN_TOKEN env var is not set in this Vercel project. ' +
        'Add it under Settings → Environment Variables (any string you choose, ≥6 chars), then redeploy.',
    });
  }

  const sent = (req.body && req.body.token) || req.headers['x-admin-token'];
  if (!sent) return res.status(400).json({ error: 'Missing token' });
  if (String(sent) !== String(required)) {
    return res.status(401).json({ error: 'Wrong code' });
  }

  return res.status(200).json({ ok: true });
}
