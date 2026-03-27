// Cloudflare Pages Function — handles form submissions
// POST /api/submit → sends Telegram + Smartlead email to Peter + auto-reply to firm

const TG_BOT = '8771962060:AAEOqu8fgefwveeLyFBptaZsw1CR87snhhM';
const TG_CHAT = '1477480207';
const SMARTLEAD_API = '99dc26d2-254b-482f-976b-7cd5f6dd7f50_iyf5a6w';
const SMARTLEAD_MAILBOX_ID = 693481; // peter@fromthelawyers.com
const PETER_EMAIL = 'peter.lewinski.work@gmail.com';

export async function onRequestPost(context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const data = await context.request.json();
    const { name, email, firm, state, leads, source_url } = data;

    // 1. Telegram notification
    const tgMsg = `🔥 NEW DBR LEAD!\n\nName: ${name}\nEmail: ${email}\nFirm: ${firm}\nState: ${state}\nEst. Leads: ${leads || 'not specified'}\nSource: ${source_url || 'direct'}`;

    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: tgMsg })
    });

    // 2. Email notification to Peter via Smartlead
    await fetch(`https://server.smartlead.ai/api/v1/send-email/initiate?api_key=${SMARTLEAD_API}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: PETER_EMAIL,
        subject: `DBR Lead: ${firm} (${state})`,
        body: `<div><h2>New DBR Lead from Landing Page</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Firm:</b> ${firm}</p><p><b>State:</b> ${state}</p><p><b>Est. Leads:</b> ${leads || 'not specified'}</p><p><b>Source:</b> ${source_url || 'direct'}</p></div>`,
        fromEmailId: SMARTLEAD_MAILBOX_ID
      })
    });

    // 3. Auto-reply to the firm
    if (email && email.includes('@')) {
      await fetch(`https://server.smartlead.ai/api/v1/send-email/initiate?api_key=${SMARTLEAD_API}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `${name} — your free test campaign request`,
          body: `<div><p>Hi ${name},</p><p>Thanks for your interest in a free database reactivation test for ${firm}.</p><p>We've received your request and will reach out within 24 hours to discuss next steps.</p><p>In the meantime, you can learn more about how we work with PI firms at <a href="https://leadsfor.lawyer/">leadsfor.lawyer</a>.</p><p>Best,<br>Peter Lewinski<br>Founder, LeadsForLawyer</p></div>`,
          fromEmailId: SMARTLEAD_MAILBOX_ID
        })
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
