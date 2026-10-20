import { readFile } from 'node:fs/promises';
import { MODEL_ID, PROMPT_COMPOSITE, OUTPUT_ASPECT } from './_showcase-photo.js';

// Existing archive API and its public store stay independent of this exhibition.
const recent = new Map();
const photoReady = () => process.env.SHOWCASE_PHOTO_ENABLED === 'true' && !!process.env.GEMINI_API_KEY;
const lettersReady = () => !!process.env.SHOWCASE_LETTERS_BLOB_READ_WRITE_TOKEN;
const fail = (res, status, message) => res.status(status).json({ message });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ photo: photoReady(), letters: lettersReady() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return fail(res, 405, '지원하지 않는 요청이에요.'); }
  const origin = req.headers.origin;
  if (origin && !['https://www.8akeryy.com', 'https://8akeryy.com', 'https://8akeryy.vercel.app'].includes(origin)) {
    return fail(res, 403, '전시 페이지에서 다시 시도해주세요.');
  }
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return fail(res, 415, '요청 형식을 확인해주세요.');
  if (Number(req.headers['content-length'] || 0) > 3500000) return fail(res, 413, '사진 용량이 너무 커요. 다른 사진을 선택해주세요.');
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return fail(res, 400, '요청을 읽지 못했어요.'); }
  if (!body || typeof body !== 'object') return fail(res, 400, '요청을 확인해주세요.');
  if (body.consent !== true) return fail(res, 400, '전송 동의를 확인해주세요.');

  if (body.action === 'letter') {
    if (!lettersReady()) return fail(res, 503, '편지함을 준비하고 있어요. 내 기기에 먼저 간직해주세요.');
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.id || '') ||
        !['dal', 'kong', 'byul'].includes(body.dog) || typeof body.message !== 'string' ||
        !body.message.trim() || body.message.length > 500 || (body.from !== undefined && (typeof body.from !== 'string' || body.from.length > 20))) {
      return fail(res, 400, '편지 내용을 확인해주세요.');
    }
    try {
      const { put } = await import('@vercel/blob');
      await put(`showcase/2026/letters/${body.id}.json`, JSON.stringify({
        id: body.id, dog: body.dog, message: body.message.trim(),
        consent: { teamDelivery: true, publish: false, version: '2026-10-20' }, receivedAt: new Date().toISOString(),
      }), {
        token: process.env.SHOWCASE_LETTERS_BLOB_READ_WRITE_TOKEN, access: 'private',
        contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      });
      return res.status(200).json({ receipt: body.id });
    } catch { return fail(res, 503, '편지를 보관하지 못했어요. 글을 유지한 채 다시 시도해주세요.'); }
  }
  if (body.action !== 'photo') return fail(res, 400, '지원하지 않는 체험이에요.');
  if (!photoReady()) return fail(res, 503, 'AI 포토부스를 준비하고 있어요.');
  if (typeof body.photo !== 'string' || body.photo.length > 3300000) return fail(res, 413, '사진 용량을 확인해주세요.');
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.photo);
  if (!match || match[2].length < 100) return fail(res, 400, '사진을 다시 선택해주세요.');
  // Best-effort instance throttling; deploy with Vercel rate limits for event traffic.
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const now = Date.now();
  for (const [address, at] of recent) if (now - at > 300000) recent.delete(address);
  if (now - (recent.get(ip) || 0) < 30000 || recent.size > 10000) return fail(res, 429, '잠시 후 다시 시도해주세요.');
  recent.set(ip, now);
  try {
    const [preset, example] = await Promise.all([
      readFile(new URL('../booth/assets/mock_preset.jpg', import.meta.url)),
      readFile(new URL('../booth/assets/mock_apply.jpg', import.meta.url)),
    ]);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(230000),
      body: JSON.stringify({
        contents: [{ parts: [
          { text: PROMPT_COMPOSITE }, { inlineData: { mimeType: match[1], data: match[2] } },
          { inlineData: { mimeType: 'image/jpeg', data: preset.toString('base64') } },
          { inlineData: { mimeType: 'image/jpeg', data: example.toString('base64') } },
        ] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: OUTPUT_ASPECT, imageSize: '1K' } },
      }),
    });
    if (!response.ok) return fail(res, response.status === 429 ? 429 : 502, '지금은 사진을 만들기 어려워요. 잠시 후 다시 시도해주세요.');
    const data = await response.json();
    const result = data.candidates?.flatMap(c => c.content?.parts || []).map(p => p.inlineData || p.inline_data)
      .find(p => p?.data && ['image/png', 'image/jpeg', 'image/webp'].includes(p.mimeType || p.mime_type));
    if (!result) return fail(res, 502, '사진을 완성하지 못했어요. 다른 사진으로 다시 시도해주세요.');
    // No persistent photo storage or public gallery upload in this flow.
    return res.status(200).json({ imageUrl: `data:${result.mimeType || result.mime_type};base64,${result.data}` });
  } catch { return fail(res, 504, '사진 생성 연결이 끊겼어요. 잠시 후 다시 시도해주세요.'); }
}
