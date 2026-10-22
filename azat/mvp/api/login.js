const crypto = require('crypto');
const { sign } = require('./_auth');

const norm = (s) => String(s || '').trim().toUpperCase();
const hash = (s) => crypto.createHash('sha256').update(s).digest();

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

  const want = norm(process.env.MEMBERSHIP_ID);
  if (!want || !process.env.SESSION_SECRET) {
    return res.status(500).json({ ok: false, error: 'config' });
  }

  const got = norm(req.body && req.body.id);
  if (!crypto.timingSafeEqual(hash(want), hash(got))) {
    return res.status(401).json({ ok: false, error: 'invalid' });
  }

  const ttlHours = Number(process.env.MEMBERSHIP_TTL_HOURS) || 96;
  const expiresAt = Date.now() + ttlHours * 3600 * 1000;
  return res.status(200).json({ ok: true, token: sign({ exp: expiresAt }), expiresAt });
};