const { verify } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!verify(token)) return res.status(401).json({ ok: false, error: 'auth' });

  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ ok: false, error: 'bad request' });
  }

  try {
    const r = await fetch(process.env.AZAT_OS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SK_AZAT_OS
      },
      body: JSON.stringify({ model: process.env.OTANSYSTEMS_AZAT_A1, messages })
    });
    const text = await r.text();
    if (!r.ok) return res.status(200).json({ ok: false, error: 'HTTP ' + r.status + ': ' + text });
    const data = JSON.parse(text);
    return res.status(200).json({ ok: true, content: data.choices?.[0]?.message?.content ?? '' });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
};