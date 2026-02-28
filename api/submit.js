// api/submit.js (Vercel Serverless Function)
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Используем вебхук Leadteh напрямую
    const WEBHOOK_URL = 'https://rb257034.leadteh.ru/inner_webhook/4889c51b-0bd8-42bd-979e-3bf67dbcece5';

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const telegram_id = body.telegram_id ?? null;

    const firstName = String(body.firstName || '').trim();
    const lastName  = String(body.lastName  || '').trim();
    const phone     = String(body.phone     || '').trim();

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }
    if (!/^\+7\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone format. Expected +7XXXXXXXXXX' });
    }

    // Подготовка данных в формате, требуемом LEADTEX
    const payloadToLeadteh = {
      contact_by: 'telegram_id',
      search: String(telegram_id),
      variables: {
        // Основная информация о пользователе
        customer_name: `${firstName} ${lastName}`,
        customer_phone: phone,

        // Информация из Telegram
        telegram_user_name: firstName + ' ' + lastName,
        telegram_id: telegram_id,

        // Дополнительная информация
        source: 'telegram-webapp-registration',
        ts: new Date().toISOString(),

        // Поля, которые могут использоваться в сценариях LEADTEX
        first_name: firstName,
        last_name: lastName,

        // Поля для возможного расширения функционала
        registration_date: new Date().toISOString().split('T')[0],
        registration_source: 'telegram_mini_app'
      }
    };

    const r = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadToLeadteh),
    });

    const text = await r.text().catch(() => '');
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!r.ok) {
      return res.status(502).json({
        error: 'Leadteh webhook error',
        status: r.status,
        body: json || text || null,
      });
    }

    return res.status(200).json({ ok: true, leadteh: json || null });
  } catch (e) {
    return res.status(500).json({
      error: 'Unhandled server error',
      message: e && e.message ? e.message : 'unknown',
    });
  }
};
