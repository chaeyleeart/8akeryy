/* ============================================================
   8akeryy AI Photobooth — AI 변환 파이프라인 (클라이언트 어댑터)
   ------------------------------------------------------------
   핵심 계약은 단 하나:
       transformImage(photoBlob) → Promise<{ imageUrl, shareUrl }>
   - imageUrl : 결과 화면 <img> 에 표시할 이미지 URL
   - shareUrl : QR 코드로 인코딩할 공개 URL (폰에서 열어 저장)
   나중에 NB2(Gemini 3.1 Flash Image)·R2 연동이 확정되면
   MOCK_MODE=false 로만 바꾸면 됨. UI 코드는 손댈 필요 없음.
   ============================================================ */
window.BoothPipeline = (function () {
  const cfg = window.BOOTH_CONFIG;

  /* ----------------------------------------------------------
     MOCK: 목업 이미지 반환 (현재 사용)
     ---------------------------------------------------------- */
  async function transformMock(photoBlob, { onProgress } = {}) {
    console.info('[pipeline:mock] photo size =', photoBlob ? photoBlob.size : 0, 'bytes');
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await sleep(cfg.MOCK_DELAY_MS / steps);
      if (onProgress) onProgress(i / steps);
    }
    const abs = new URL(cfg.MOCK_RESULT_IMAGE, location.href).href;
    return { imageUrl: abs, shareUrl: abs };
  }

  /* ----------------------------------------------------------
     REAL: Vercel 서버리스 함수 호출 (NB2 연동 후 사용)
     서버 흐름: /api/transform 참고
       사진 → NB2 특징 추출·치비화 → preset 인페인팅 합성
       → R2 업로드 → 공개 URL 반환
     ---------------------------------------------------------- */
  async function transformReal(photoBlob, { onProgress } = {}) {
    if (onProgress) onProgress(0.1);
    const form = new FormData();
    form.append('photo', photoBlob, 'visitor.jpg');
    const consent = window.BoothConsent.get();
    if (consent) form.append('consent', JSON.stringify(consent));

    const res = await fetch(cfg.API_TRANSFORM, { method: 'POST', body: form });
    if (!res.ok) throw new Error('transform failed: ' + res.status);
    if (onProgress) onProgress(0.9);

    // 서버 응답 계약: { imageUrl: string, shareUrl: string }
    const data = await res.json();
    if (onProgress) onProgress(1);
    return data;
  }

  /**
   * 단일 진입점 — UI는 이 함수만 호출한다.
   * @param {Blob} photoBlob 관람객 사진(JPEG)
   * @param {{onProgress?: (ratio:number)=>void}} opts
   * @returns {Promise<{imageUrl:string, shareUrl:string}>}
   */
  async function transformImage(photoBlob, opts = {}) {
    return cfg.MOCK_MODE ? transformMock(photoBlob, opts) : transformReal(photoBlob, opts);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { transformImage };
})();
