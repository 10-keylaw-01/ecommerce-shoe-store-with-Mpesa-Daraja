// Safaricom Daraja client (STK push). Secrets stay on the server.
const env = process.env
const BASE = env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'

let cached = { token: null, exp: 0 }

async function http(path, { method = 'GET', headers = {}, body, timeout = 20000 } = {}) {
  let lastErr
  // The sandbox occasionally resets connections; retry transient network failures once.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout),
      })
      const text = await res.text()
      let json = null
      try { json = JSON.parse(text) } catch { /* non-JSON error page */ }
      return { status: res.status, json, text }
    } catch (e) { lastErr = e }
  }
  throw new Error(`Daraja unreachable: ${lastErr?.cause?.code || lastErr?.message}`)
}

async function token() {
  if (cached.token && Date.now() < cached.exp) return cached.token
  const basic = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString('base64')
  const r = await http('/oauth/v1/generate?grant_type=client_credentials', { headers: { Authorization: `Basic ${basic}` } })
  if (!r.json?.access_token) throw new Error(`Daraja auth failed (${r.status})`)
  cached = { token: r.json.access_token, exp: Date.now() + (Number(r.json.expires_in || 3500) - 60) * 1000 }
  return cached.token
}

// Daraja timestamps are YYYYMMDDHHmmss in East Africa Time.
function timestamp() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date()).reduce((a, x) => ({ ...a, [x.type]: x.value }), {})
  return `${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}`
}

const password = (ts) => Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${ts}`).toString('base64')

export function callbackUrl() {
  return `${env.MPESA_CALLBACK_BASE}/api/mpesa/callback/${env.MPESA_CALLBACK_SECRET}`
}

export async function stkPush({ phone, amount, reference, description }) {
  const ts = timestamp()
  const r = await http('/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: {
      BusinessShortCode: env.MPESA_SHORTCODE, Password: password(ts), Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline', Amount: amount, PartyA: phone, PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: phone, CallBackURL: callbackUrl(),
      AccountReference: reference.slice(0, 12), TransactionDesc: description.slice(0, 20),
    },
  })
  if (r.json?.ResponseCode !== '0') {
    throw new Error(r.json?.errorMessage || r.json?.ResponseDescription || `STK push rejected (${r.status})`)
  }
  return { merchantRequestId: r.json.MerchantRequestID, checkoutRequestId: r.json.CheckoutRequestID }
}

// Returns { state: 'pending' | 'success' | 'failed' | 'cancelled', code, desc }.
export async function stkQuery(checkoutRequestId) {
  const ts = timestamp()
  const r = await http('/mpesa/stkpushquery/v1/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: { BusinessShortCode: env.MPESA_SHORTCODE, Password: password(ts), Timestamp: ts, CheckoutRequestID: checkoutRequestId },
    timeout: 10000,
  })
  // While the customer is still deciding Daraja answers with an error (500.001.1001) - that means "not done yet".
  if (r.json?.ResultCode === undefined) return { state: 'pending' }
  const code = Number(r.json.ResultCode)
  const desc = r.json.ResultDesc || ''
  if (code === 0) return { state: 'success', code, desc }
  if (code === 1032) return { state: 'cancelled', code, desc }
  // Only codes that definitively end the attempt count as failures (1 insufficient funds, 1037 no PIN entered,
  // 2001 wrong PIN, ...). Anything else - notably 4999 "still under processing" - means "not finished yet".
  if (FINAL_FAILURES.has(code)) return { state: 'failed', code, desc }
  return { state: 'pending', code, desc }
}

const FINAL_FAILURES = new Set([1, 1019, 1025, 1026, 1037, 2001])
