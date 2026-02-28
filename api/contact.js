// api/contact.js — Предзаполнение формы по telegram_id из Leadteh API
module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const telegram_id = req.query.telegram_id;
    if (!telegram_id) {
      return res.status(200).json({ found: false });
    }

    const apiToken = process.env.LEADTEH_API_TOKEN;
    if (!apiToken) {
      return res.status(200).json({ found: false });
    }

    const url = `https://app.leadteh.ru/api/v1/getContacts?bot_id=257034&count=500&with=variables&api_token=${encodeURIComponent(apiToken)}`;

    const r = await fetch(url, {
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    if (!r.ok) {
      return res.status(200).json({ found: false });
    }

    const data = await r.json();
    const contacts = data.data || data.contacts || data || [];

    if (!Array.isArray(contacts)) {
      return res.status(200).json({ found: false });
    }

    const contact = contacts.find(
      (c) => String(c.telegram_id) === String(telegram_id)
    );

    if (!contact) {
      return res.status(200).json({ found: false });
    }

    const name = (contact.name || '').trim();
    const phone = (contact.phone || '').trim();
    const parts = name.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    return res.status(200).json({
      found: true,
      name,
      phone,
      firstName,
      lastName,
    });
  } catch (e) {
    return res.status(200).json({ found: false });
  }
};
