/* ============================================================
   POST /api/transform — 실제 AI 변환 (Vercel 서버리스, Node 런타임)
   ------------------------------------------------------------
   입력(JSON): { photo: "data:image/jpeg;base64,....", consent?: {...} }
   출력(JSON): { imageUrl, shareUrl }
     - imageUrl : 결과 화면 <img>용 (data URL — 항상 반환)
     - shareUrl : QR로 인코딩할 공개 URL (Vercel Blob)
   저장 정책:
     - SNS/웹 게시 동의(consent.snsPublish=true) → booth/results/archive/
     - 미동의                                → booth/results/private/
     → Vercel 대시보드 Manage Blobs에서 archive/ 폴더만 보면
       홈페이지 아카이빙 후보를 바로 골라낼 수 있음
   환경변수: GEMINI_API_KEY (필수), BLOB_READ_WRITE_TOKEN (QR용)
   ============================================================ */
import {
  MODEL_ID, PROMPT_COMPOSITE, OUTPUT_ASPECT, OUTPUT_MIME,
  PRESET_IMAGE_PATH, EXAMPLE_IMAGE_PATH,
} from './_constants.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const body = await readJson(req);
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(body.photo || '');
    if (!m) return res.status(400).json({ error: 'photo must be an image data URL' });
    const [, photoMime, photoB64] = m;

    const origin = `https://${req.headers.host}`;
    const [presetB64, exampleB64] = await Promise.all([
      fetchAsBase64(origin + PRESET_IMAGE_PATH),
      fetchAsBase64(origin + EXAMPLE_IMAGE_PATH),
    ]);

    const resultB64 = await generateImage({
      prompt: PROMPT_COMPOSITE,
      images: [
        { mime_type: photoMime, data: photoB64 },
        { mime_type: 'image/jpeg', data: presetB64 },
        { mime_type: 'image/jpeg', data: exampleB64 },
      ],
    });
    if (!resultB64) return res.status(502).json({ error: 'model returned no image' });

    const dataUrl = `data:${OUTPUT_MIME};base64,${resultB64}`;

    // ── Blob 업로드: 게시 동의 여부에 따라 폴더 분리 ──────────
    let shareUrl = '';
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const consent = body.consent || {};
      const folder = consent.snsPublish === true ? 'booth/results/archive' : 'booth/results/private';
      try { shareUrl = await uploadToBlob(Buffer.from(resultB64, 'base64'), folder); }
      catch (e) { console.error('[blob]', e.message); }
    }

    return res.status(200).json({ imageUrl: dataUrl, shareUrl });
  } catch (err) {
    console.error('[api/transform]', err);
    return res.status(500).json({ error: String(err.message || err).slice(0, 300) });
  }
}

/* ---------------- Gemini 호출 ---------------- */
async function generateImage({ prompt, images }) {
  const key = process.env.GEMINI_API_KEY;

  // 1차: Interactions API (현행)
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_ID,
        input: [
          { type: 'text', text: prompt },
          ...images.map(im => ({ type: 'image', mime_type: im.mime_type, data: im.data })),
        ],
        response_format: { type: 'image', mime_type: OUTPUT_MIME, aspect_ratio: OUTPUT_ASPECT },
      }),
    });
    if (r.ok) {
      const j = await r.json();
      const img = findImageB64(j);
      if (img) return img;
      console.error('[gemini:interactions] no image in response', JSON.stringify(j).slice(0, 500));
    } else {
      console.error('[gemini:interactions]', r.status, (await r.text()).slice(0, 500));
      if (r.status === 401 || r.status === 403 || r.status === 429) {
        throw new Error(`Gemini API ${r.status} — API 키/할당량/결제 상태를 확인하세요`);
      }
    }
  } catch (e) {
    if (String(e.message).startsWith('Gemini API')) throw e;
    console.error('[gemini:interactions] fetch failed, falling back', e.message);
  }

  // 2차: generateContent (레거시 호환)
  const r2 = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...images.map(im => ({ inline_data: { mime_type: im.mime_type, data: im.data } })),
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    }
  );
  if (!r2.ok) throw new Error(`Gemini API ${r2.status} — ${(await r2.text()).slice(0, 200)}`);
  const j2 = await r2.json();
  return findImageB64(j2);
}

/** 응답 JSON 어디에 있든 base64 이미지 데이터를 찾아냄 */
function findImageB64(obj) {
  let found = null;
  (function walk(o) {
    if (found || !o || typeof o !== 'object') return;
    if (typeof o.data === 'string' && o.data.length > 5000 &&
        (o.type === 'image' || o.mime_type || o.mimeType || o === obj.output_image)) {
      found = o.data; return;
    }
    if (o.inlineData && typeof o.inlineData.data === 'string') { found = o.inlineData.data; return; }
    if (o.inline_data && typeof o.inline_data.data === 'string') { found = o.inline_data.data; return; }
    for (const k of Object.keys(o)) walk(o[k]);
  })(obj);
  return found;
}

/* ---------------- Vercel Blob 업로드 ---------------- */
async function uploadToBlob(buffer, folder) {
  const name = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const r = await fetch(`https://blob.vercel-storage.com/${name}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      'x-api-version': '7',
      'x-content-type': 'image/jpeg',
      'x-add-random-suffix': '1',
      'cache-control': 'public, max-age=31536000',
    },
    body: buffer,
  });
  if (!r.ok) throw new Error(`blob upload ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.url || j.downloadUrl || '';
}

/* ---------------- 유틸 ---------------- */
async function readJson(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function fetchAsBase64(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}
