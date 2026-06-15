import { kv } from '@vercel/kv';

const KEY = 'joelle:recipes';

function requireAdmin(req, res) {
  const required = process.env.ADMIN_TOKEN;
  if (!required) {
    res.status(500).json({
      error: 'ADMIN_TOKEN env var is not set in this Vercel project. Add it under Settings → Environment Variables, then redeploy.',
    });
    return false;
  }
  if (req.headers['x-admin-token'] !== required) {
    res.status(401).json({ error: 'Unauthorized — admin code missing or invalid.' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const recipes = (await kv.get(KEY)) || [];
      return res.status(200).json({ recipes });
    }

    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return;
      const { recipe } = req.body || {};
      if (!recipe || typeof recipe !== 'object' || !recipe.slug) {
        return res.status(400).json({ error: 'POST body must be { recipe: { slug, ... } }' });
      }
      const existing = (await kv.get(KEY)) || [];
      const next = existing.filter((r) => r.slug !== recipe.slug);
      next.push(recipe);
      await kv.set(KEY, next);
      return res.status(200).json({ ok: true, slug: recipe.slug, count: next.length });
    }

    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      const slug = (req.query && req.query.slug) || (req.body && req.body.slug);
      if (!slug) return res.status(400).json({ error: 'Provide ?slug=' });
      const existing = (await kv.get(KEY)) || [];
      const next = existing.filter((r) => r.slug !== slug);
      await kv.set(KEY, next);
      return res.status(200).json({ ok: true, removed: slug, count: next.length });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'KV error: ' + (err.message || 'unknown') +
             '. Has Vercel KV been provisioned and connected to this project?',
    });
  }
}
