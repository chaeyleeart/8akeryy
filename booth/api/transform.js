/* ============================================================
   POST /api/transform — Vercel 서버리스 함수 (골격)
   ------------------------------------------------------------
   입력  : multipart/form-data { photo: JPEG, consent?: JSON }
   출력  : { imageUrl: string, shareUrl: string }
   흐름  :
     1) 사진 수신
     2) NB2(Gemini 3.1 Flash Image) 호출
        — 특징 추출 → 치비화 → preset 인페인팅 합성 (프롬프트는 _constants.js)
     3) 결과 PNG를 R2/S3에 업로드 → 공개 URL
     4) { imageUrl, shareUrl } 반환 (클라이언트가 QR로 인코딩)

   ⚠️ API 키는 Vercel 환경변수로만:
      GEMINI_API_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
   ============================================================ */
import {
  PROMPT_FEATURE_EXTRACT,
  PROMPT_CHIBI_STYLE,
  PROMPT_COMPOSITE,
  PRESET_IMAGE_URL,
  MODEL_ID,
} from './_constants.js';

export const config = {
  api: { bodyParser: false }, // multipart 직접 파싱
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    // ── 1) 사진 수신 ─────────────────────────────────────────
    // TODO: multipart 파싱 (busboy 또는 formidable)
    // const { photoBuffer, consent } = await parseMultipart(req);

    // ── 2) NB2 호출 (확정 전 — STUB) ────────────────────────
    // TODO(NB2 확정 후):
    //   const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    //   Step A. 특징 추출     : PROMPT_FEATURE_EXTRACT + photoBuffer
    //   Step B. 치비 캐릭터화 : PROMPT_CHIBI_STYLE + 특징 텍스트
    //   Step C. 합성          : PROMPT_COMPOSITE + PRESET_IMAGE_URL + 치비 이미지
    //   → resultPngBuffer
    // const resultPngBuffer = await runNb2Pipeline(photoBuffer);

    // ── 3) 스토리지 업로드 (확정 전 — STUB) ─────────────────
    // TODO(R2 연동 후):
    //   const key = `results/${crypto.randomUUID()}.png`;
    //   await uploadToR2(key, resultPngBuffer);          // @aws-sdk/client-s3 (R2 호환)
    //   const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
    // const publicUrl = await uploadResult(resultPngBuffer);

    // ── 현재: 목업 응답 ──────────────────────────────────────
    const origin = `https://${req.headers.host}`;
    const mockUrl = `${origin}/assets/mock_apply.jpg`;
    return res.status(200).json({
      imageUrl: mockUrl,
      shareUrl: mockUrl,
      _stub: true,
      _model: MODEL_ID,
    });
  } catch (err) {
    console.error('[api/transform]', err);
    return res.status(500).json({ error: 'transform failed' });
  }
}

/* ------------------------------------------------------------
   아래 함수들은 연동 확정 후 구현
   ------------------------------------------------------------ */
// async function parseMultipart(req) { ... }
// async function runNb2Pipeline(photoBuffer) { ... }
// async function uploadToR2(key, buffer) { ... }
