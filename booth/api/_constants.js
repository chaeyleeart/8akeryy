/* ============================================================
   8akeryy AI Photobooth — 서버 전용 고정 상수
   ------------------------------------------------------------
   프롬프트·의상·포즈 등 "고정 요소"는 전부 여기서만 관리한다.
   클라이언트에는 절대 노출되지 않음 (Vercel 서버리스 전용).
   실제 프롬프트 전문이 확정되면 아래 PLACEHOLDER를 교체할 것.
   ============================================================ */

/** 1단계 — 인물 특징 추출 지시문 (포즈 제어 없음, ControlNet 미사용) */
export const PROMPT_FEATURE_EXTRACT = `
[PLACEHOLDER — 확정 프롬프트로 교체]
Analyze the visitor photo and extract ONLY identity features:
face shape, hair length/color/style, glasses, hat, notable accessories.
Do NOT capture pose, background, or clothing.
`.trim();

/** 2단계 — 고정 스타일 치비 캐릭터화 (사람 형태 유지, 강아지로 변환 금지) */
export const PROMPT_CHIBI_STYLE = `
[PLACEHOLDER — 확정 프롬프트로 교체]
Render the person as a chibi character in the 8akeryy art style
(soft 3D, warm pastel, fluffy). Keep them HUMAN — never a dog.
Fixed outfit: cream knit sweater. Fixed base pose (standing, front).
`.trim();

/** 3단계 — 배경 프리셋 인페인팅 합성 지시문 */
export const PROMPT_COMPOSITE = `
[PLACEHOLDER — 확정 프롬프트로 교체]
Inpaint the chibi character into the fixed dog-preset background.
Layering: back dogs → character slot → front dog overlapping,
so the character looks cozily buried among the puppies.
`.trim();

/** 고정 의상 */
export const FIXED_OUTFIT = 'cream knit sweater';

/** 캐릭터 기본 포즈 */
export const FIXED_POSE = 'standing, front-facing, arms relaxed';

/** 배경 프리셋 이미지 — 배포 시 aiphoto/preset.png 를 스토리지에 올려두고 URL 참조 */
export const PRESET_IMAGE_URL = process.env.PRESET_IMAGE_URL || '';

/** 사용할 모델 (확정 전) */
export const MODEL_ID = 'gemini-3.1-flash-image'; // Google Nano Banana 2

/** 결과물 규격 */
export const OUTPUT = { width: 1856, height: 2320, format: 'png' };
