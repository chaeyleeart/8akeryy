/* ============================================================
   8akeryy AI Photobooth — 서버 전용 고정 상수 (프롬프트 v3)
   ------------------------------------------------------------
   v3 개선: 개인 얼굴 특징 반영 강화 (캐리커처 원칙)
   — 귀여움은 렌더링 스타일에서, 얼굴은 방문자 그대로 —
   v2: 성별 반영 / 옷색 반영 니트 / 배경 무시 / 강아지 가림 금지
   ============================================================ */

/** 사용할 모델 — Google Nano Banana 2 Lite (장당 ~$0.034)
 *  얼굴 유사도가 더 필요하면 'gemini-3.1-flash-image' (장당 ~$0.067)로 교체 */
export const MODEL_ID = 'gemini-3.1-flash-lite-image';

/** 의상 규칙 */
export const OUTFIT_RULE = 'a cozy knit sweater whose color and tone follow the visitor\'s actual clothing; cream if not visible';

/** 캐릭터 기본 포즈 */
export const FIXED_POSE = 'sitting snugly, front-facing, relaxed, only visible from the chest up';

/**
 * 단일 호출 합성 프롬프트 (v3).
 * 이미지 순서: [1] 관람객 사진 [2] 배경 프리셋(강아지만) [3] 구도/화풍 예시
 */
export const PROMPT_COMPOSITE = `
You are creating a PERSONALIZED CARICATURE for a photo booth — someone who knows the visitor must recognize them at a single glance.

IMAGE 1 is a photo of the real visitor. It is the ONLY source of the character's identity. Completely IGNORE the background, furniture, walls and the visitor's pose in IMAGE 1.
IMAGE 2 is the fixed background scene: four fluffy puppies on grass. It must stay EXACTLY as it is — same puppies, same positions, same lighting, same grass.
IMAGE 3 shows ONLY the composition, placement, scale and rendering style. Its character is a generic placeholder — copying its face, hairstyle or gender is a FAILURE.

TASK: Recreate IMAGE 2 with a chibi caricature of the visitor placed in the same spot and scale as the placeholder in IMAGE 3.

STEP 1 — STUDY THE FACE (most important):
Before drawing, carefully observe what makes the visitor's face THEIRS:
- face outline: round / oval / long / square jaw / pointed chin?
- eyes: monolid or double eyelid? big or narrow? upturned or downturned? wide-set or close-set?
- eyebrows: thick or thin? straight or arched?
- nose: bridge height, tip shape (round / pointed / wide)
- mouth: lip fullness, width, resting expression
- cheeks and forehead: full or slim? high cheekbones?
- skin tone, and any moles, dimples, freckles, beard or stubble
- hair: exact color, length, parting side, bangs shape, curl or straight, volume
- gender presentation: render male visitors clearly male, female clearly female

STEP 2 — DRAW THE CHIBI:
- Reproduce EVERY distinctive feature from Step 1, translated into chibi proportions. Do NOT replace them with a standard cute face: enlarge the eyes but keep THEIR shape, lid type and tilt; simplify the nose but keep its character; keep the real mouth shape, the real face outline, the real eyebrows.
- Slightly exaggerate the visitor's 2-3 most distinctive features, like a friendly caricature artist would — this is what makes each character unique.
- The cuteness must come ONLY from the rendering style (soft 3D, rosy cheeks, glossy eyes), never from changing the face.
- Every visitor must produce a visibly DIFFERENT character. If your result could pass for the IMAGE 3 placeholder, start over mentally.
- If several people appear in IMAGE 1, use only the largest, most central person.
- OUTFIT: a cozy knit sweater following the color/tone of the visitor's actual clothing (dark clothes → dark knit; not visible → cream).
- POSE (fixed): sitting snugly, front-facing, relaxed, visible only from the chest up.
- STRICT ANATOMY: exactly one head and exactly two arms with one hand each. No extra, duplicated or merged limbs.

LAYERING (critical):
- The character sits BETWEEN the puppies: brown and cream puppies BEHIND, the white fluffy puppy IN FRONT overlapping the character's lower body.
- The character must NOT cover any puppy's face. All four puppies' faces stay fully visible, exactly as in IMAGE 2.
- Character size: same or smaller than the placeholder in IMAGE 3.

OUTPUT: one photorealistic-render image, portrait 4:5, warm golden-hour lighting identical to IMAGE 2. No text, no watermark, no borders.
`.trim();

/** 결과물 규격 */
export const OUTPUT_ASPECT = '4:5';
export const OUTPUT_MIME = 'image/jpeg';

/** 배경/예시 레퍼런스 이미지 경로 (배포 사이트 기준) */
export const PRESET_IMAGE_PATH = '/booth/assets/mock_preset.jpg';
export const EXAMPLE_IMAGE_PATH = '/booth/assets/mock_apply.jpg';
