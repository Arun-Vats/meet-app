/**
 * VoiceLink — Netlify Function
 * Fetches short-lived Cloudflare TURN credentials (valid 24h).
 *
 * Set in Netlify → Site Settings → Environment Variables:
 *   CF_TURN_TOKEN_ID  — Cloudflare TURN key ID
 *   CF_API_TOKEN      — Cloudflare API token (with TURN write permission)
 */
exports.handler = async () => {
  const { CF_TURN_TOKEN_ID, CF_API_TOKEN } = process.env;
  if (!CF_TURN_TOKEN_ID || !CF_API_TOKEN) {
    return respond(500, { error: 'TURN env vars not set.' });
  }
  try {
    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${CF_TURN_TOKEN_ID}/credentials/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 86400 }),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      console.error('[TURN]', res.status, txt);
      return respond(502, { error: 'Cloudflare TURN request failed.' });
    }
    return respond(200, await res.json());
  } catch (e) {
    console.error('[TURN] Exception:', e.message);
    return respond(500, { error: e.message });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}
