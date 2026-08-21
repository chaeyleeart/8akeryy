/* ============================================================
   8akeryy AI Photobooth — 서버 전용 고정 상수 (프롬프트 v4)
   ------------------------------------------------------------
   v4 개선: 스타일 일관성 + 합성 품질
   — 모델 Lite → 표준 (gemini-3.1-flash-image, 장당 ~$0.067)
   — STYLE LOCK: IMAGE 3의 soft 3D 렌더 스타일 강제, 2D/스티커 금지
   — 레이어링 강화: 흰 강아지가 캐릭터 앞을 반드시 가림 + 접촉 그림자
   v3: 개인 얼굴 특징 반영 강화 (캐리커처 원칙)
   v2: 성별 반영 / 옷색 반영 니트 / 배경 무시 / 강아지 가림 금지
   ============================================================ */

/** 사용할 모델 — Gemini 3 Pro Image (Nano Banana Pro, 장당 ~$0.134 @1K/2K)
 *  2026-08-21 전시 중 전환. 이유:
 *  - lite: v4 프롬프트로도 배경 강아지 훼손·합성 실패 (2회 탈락)
 *  - flash-image(표준): 알려진 용량/라우팅 병목으로 Pro보다 느림 (googleapis/js-genai#1544, 미해결)
 *    → 혼잡 시간대 요청당 50~105초까지 튐. Pro가 품질·속도 모두 우위일 수 있음 */
export const MODEL_ID = 'gemini-3-pro-image-preview';

/** 의상 규칙 */
export const OUTFIT_RULE = 'a cozy knit sweater whose color and tone follow the visitor\'s actual clothing; cream if not visible';

/** 캐릭터 기본 포즈 */
export const FIXED_POSE = 'sitting snugly, front-facing, relaxed, only visible from the chest up';

/**
 * 단일 호출 합성 프롬프트 (v4).
 * 이미지 순서: [1] 관관객 사진 [2] 배경 프리셋(강아지만) [3] 구도/화풍 예시
 */
export const PROMPT_COMPOSITE = `
You are creating a PERSONALIZED CARICATURE for a photo booth — someone who knows the visitor must recognize them at a single glance.

IMAGE 1 is a photo of the real visitor. It is the ONLY source of the character's identity. Completely IGNORE the background, furniture, walls and the visitor's pose in IMAGE 1.
IMAGE 2 is the fixed background scene: four fluffy puppies on grass. It must stay EXACTLY as it is — same puppies, same positions, same lighting, same grass.
IMAGE 3 defines the RENDERING STYLE, composition, placement and scale. Copy its STYLE exactly. Its character's identity (face, hairstyle, gender) is a generic placeholder — copying the identity is a FAILURE, but abandoning its rendering style is ALSO a failure.

TASK: Recreate IMAGE 2 with a chibi caricature of the visitor placed in the same spot and scale as the placeholder in IMAGE 3.

STYLE LOCK (non-negotiable):
- The character MUST be rendered in the exact same style as the character in IMAGE 3: a soft-3D chibi figurine — volumetric, softly shaded skin, glossy reflective eyes, rosy cheeks, fine 3D hair strands. Think collectible vinyl figure, NOT a drawing.
- NEVER output flat 2D cartoon, sticker, emoji, line-art, cel-shaded, anime-illustration or clip-art styles. If the character looks like a flat sticker pasted onto a photo, the result is a FAILURE.
- The character is lit by the SAME warm golden-hour light as IMAGE 2, from the same direction, with soft contact shadows where the character meets the puppies and grass. The character must look like it was photographed IN the scene, not composited onto it.

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
- STRICT ANATOMY: exactly one head, exactly two arms, at most two hands visible. Before finishing, COUNT the limbs — any extra, duplicated or merged arm/hand is a FAILURE.

LAYERING (critical — the character is BURIED among the puppies, not floating on top):
- Depth order, back to front: grass → brown puppy and cream puppy (BEHIND the character) → the character → the white fluffy puppy (IN FRONT, clearly OVERLAPPING and covering part of the character's chest and arms).
- Puppy fur slightly overlaps the character's shoulders and arms, so the character looks snugly wedged in, with soft shadows in the crevices.
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
