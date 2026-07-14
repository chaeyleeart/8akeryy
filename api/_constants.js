/* ============================================================
   8akeryy AI Photobooth — 서버 전용 고정 상수 (프롬프트 v2)
   ------------------------------------------------------------
   v2 개선: 성별 반영 강화 / 의상 = 방문자 옷색 반영 니트 /
           IMAGE 1 배경 무시(팔 왜곡 방지) / 강아지 가림 금지
   프롬프트를 다듬을 때는 이 파일만 수정하면 됨. 클라이언트 노출 금지.
   ============================================================ */

/** 사용할 모델 — Google Nano Banana 2 Lite (장당 ~$0.034)
 *  품질 우선 시 'gemini-3.1-flash-image' (장당 ~$0.067)로 교체 */
export const MODEL_ID = 'gemini-3.1-flash-lite-image';

/** 의상 규칙 (v2: 방문자 옷 반영) */
export const OUTFIT_RULE = 'a cozy knit sweater whose color and tone follow the visitor\'s actual clothing; cream if not visible';

/** 캐릭터 기본 포즈 */
export const FIXED_POSE = 'sitting snugly, front-facing, relaxed, only visible from the chest up';

/**
 * 단일 호출 합성 프롬프트 (v2).
 * 이미지 순서: [1] 관람객 사진 [2] 배경 프리셋(강아지만) [3] 구도/화풍 예시
 */
export const PROMPT_COMPOSITE = `
You are compositing a character into a fixed scene for a photo booth.

IMAGE 1 is a photo of a real visitor. Use it ONLY as the identity reference for the character's face, hair and clothing color. Completely IGNORE the background, furniture, walls, sofas and the visitor's pose in IMAGE 1 — none of it may appear in the result or influence the character's body.
IMAGE 2 is the fixed background scene: four fluffy puppies on grass. This scene must stay EXACTLY as it is — same puppies, same positions, same lighting, same grass.
IMAGE 3 shows ONLY the composition, placement, scale and art style of the final result. Do NOT copy the example character's face, hairstyle or gender from IMAGE 3 — that character is just a placeholder.

TASK: Recreate IMAGE 2 with a chibi character of the visitor placed in the same spot and scale as the character in IMAGE 3.

THE CHARACTER:
- A cute chibi HUMAN character (never a dog or animal).
- MATCH THE VISITOR'S GENDER: look carefully at IMAGE 1 — if the visitor appears male, render a clearly MALE chibi character (masculine face, no feminine styling); if female, render female. Never default to female.
- Copy from IMAGE 1 exactly: face shape, hairstyle as photographed (short hair stays short, long hair stays long), hair color, skin tone, facial hair if any, and accessories (glasses, hat, earrings).
- If several people appear in IMAGE 1, use only the largest, most central person.
- Soft 3D rendered look with large glossy eyes, small nose and mouth, rosy cheeks — same art style as the character in IMAGE 3.
- OUTFIT: a cozy knit sweater whose color and tone follow the visitor's actual clothing in IMAGE 1 (e.g. dark clothes → dark knit, blue → blue knit). If clothing is not visible, use cream.
- POSE (fixed): sitting snugly, front-facing, relaxed, visible only from the chest up.
- STRICT ANATOMY: exactly one head and exactly two arms with one hand each. No extra limbs, no duplicated or merged arms, even if the arms blend with the background.

LAYERING (critical):
- The character sits BETWEEN the puppies: the brown and cream puppies BEHIND the character, and the white fluffy puppy IN FRONT overlapping the character's lower body.
- The character must NOT cover or overlap any puppy's face or body. All four puppies' faces must stay fully visible, exactly as in IMAGE 2.
- The character must be the same size or smaller than the placeholder character in IMAGE 3 — small and cozily buried in the pile of puppies.

OUTPUT: one photorealistic-render image, portrait 4:5, warm golden-hour lighting identical to IMAGE 2. No text, no watermark, no borders.
`.trim();

/** 결과물 규격 */
export const OUTPUT_ASPECT = '4:5';
export const OUTPUT_MIME = 'image/jpeg';

/** 배경/예시 레퍼런스 이미지 경로 (배포 사이트 기준) */
export const PRESET_IMAGE_PATH = '/booth/assets/mock_preset.jpg';
export const EXAMPLE_IMAGE_PATH = '/booth/assets/mock_apply.jpg';
