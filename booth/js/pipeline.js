/* ============================================================
   8akeryy AI Photobooth — AI 변환 파이프라인 (클라이언트 어댑터)
   ------------------------------------------------------------
   핵심 계약: transformImage(photoBlob) → Promise<{ imageUrl, shareUrl }>
   - imageUrl : 결과 화면 <img>에 표시할 URL (data URL 포함)
   - shareUrl : QR로 인코딩할 공개 URL ('' 이면 QR 숨김)
   MOCK_MODE 플래그로 목업/실서비스 전환. UI 코드는 몰라도 됨.
   ============================================================ */
window.BoothPipeline = (function () {
  const cfg = window.BOOTH_CONFIG;

  /* ---------- MOCK ---------- */
  async function transformMock(photoBlob, { onProgress } = {}) {
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await sleep(cfg.MOCK_DELAY_MS / steps);
      if (onProgress) onProgress(i / steps);
    }
    const abs = new URL(cfg.MOCK_RESULT_IMAGE, location.href).href;
    return { imageUrl: abs, shareUrl: abs };
  }

  /* ---------- REAL: /api/transform (NB2) ---------- */
  async function transformReal(photoBlob, { onProgress } = {}) {
    if (onProgress) onProgress(0.05);
    const photoDataUrl = await blobToDataUrl(photoBlob);
    if (onProgress) onProgress(0.15);

    // 변환 소요(10~30초) 동안 진행바를 부드럽게 진행
    let fake = 0.15;
    const ticker = setInterval(() => {
      fake = Math.min(0.9, fake + 0.03);
      if (onProgress) onProgress(fake);
    }, 900);

    try {
      const res = await fetch(cfg.API_TRANSFORM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo: photoDataUrl,
          consent: window.BoothConsent.get(),
        }),
      });
      if (!res.ok) {
        let msg = 'transform failed: ' + res.status;
        try { msg += ' — ' + (await res.json()).error; } catch (e) {}
        throw new Error(msg);
      }
      const data = await res.json(); // { imageUrl, shareUrl }
      if (onProgress) onProgress(1);
      return data;
    } finally {
      clearInterval(ticker);
    }
  }

  async function transformImage(photoBlob, opts = {}) {
    return cfg.MOCK_MODE ? transformMock(photoBlob, opts) : transformReal(photoBlob, opts);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  return { transformImage };
})();
