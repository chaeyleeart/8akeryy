/* ============================================================
   8akeryy AI Photobooth — 서버 전용 고정 상수 (실제 프롬프트 v1)
   프롬프트를 다듬을 때는 이 파일만 수정하면 됨. 클라이언트 노출 금지.
   ============================================================ */

/** 사용할 모델 — Google Nano Banana 2 */
export const MODEL_ID = 'gemini-3.1-flash-image';

/** 고정 의상 */
export const FIXED_OUTFIT = 'a cozy cream-colored knit sweater';

/** 캐릭터 기본 포즈 */
export const FIXED_POSE = 'sitting snugly, front-facing, relaxed, only visible from the chest up';

/**
 * 단일 호출 합성 프롬프트.
 * 이미지 순서: [1] 관람객 사진 [2] 배경 프리셋(강아지만) [3] 최종 목표 예시
 */
export const PROMPT_COMPOSITE = `
You are compositing a character into a fixed scene for a photo booth.

IMAGE 1 is a photo of a real visitor.
IMAGE 2 is the fixed background scene: four fluffy puppies on grass. This scene must stay EXACTLY as it is — same puppies, same positions, same lighting, same grass.
IMAGE 3 is a finished example showing how the final result should look: a small chibi-style human character nestled snugly between the puppies.

TASK: Recreate IMAGE 2 with a chibi character of the visitor placed in the same spot and scale as the character in IMAGE 3.

THE CHARACTER:
- A cute chibi HUMAN character (never turn them into a dog or animal).
- Capture ONLY these identity features from IMAGE 1: face shape, hairstyle (length, color, bangs), skin tone, and accessories such as glasses, hats or earrings if present.
- Soft 3D rendered look with large glossy eyes, small nose and mouth, rosy cheeks — exactly matching the art style of the character in IMAGE 3.
- Outfit is FIXED: a cozy cream-colored knit sweater.
- Pose is FIXED: sitting snugly, front-facing, relaxed, only visible from the chest up.
- Do NOT copy the visitor's pose, background, clothing or body from IMAGE 1.

LAYERING (critical): the character sits BETWEEN the puppies — the brown and cream puppies behind them, and the white fluffy puppy in front overlapping the character's lower body, so the character looks cozily buried in the pile of puppies, just like IMAGE 3.

OUTPUT: one photorealistic-render image, portrait 4:5, warm golden-hour lighting identical to IMAGE 2. No text, no watermark, no borders.
`.trim();

/** 결과물 규격 */
export const OUTPUT_ASPECT = '4:5';
export const OUTPUT_MIME = 'image/jpeg';

/** 배경/예시 레퍼런스 이미지 경로 (배포 사이트 기준) */
export const PRESET_IMAGE_PATH = '/booth/assets/mock_preset.jpg';
export const EXAMPLE_IMAGE_PATH = '/booth/assets/mock_apply.jpg';
