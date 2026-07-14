/* ============================================================
   8akeryy AI Photobooth — 동의 처리 (STUB)
   ------------------------------------------------------------
   지금은 UI만 존재. 나중에 실제 로직(동의 기록 저장, 게시 동의
   여부를 결과물 메타데이터에 연결 등)을 이 파일에만 구현하면 됨.
   ============================================================ */
window.BoothConsent = (function () {
  let current = null;

  /**
   * 동의 내용을 기록한다. (STUB)
   * @param {{aiTransform: boolean, snsPublish: boolean}} consent
   * @returns {Promise<{ok: boolean, consentId: string}>}
   *
   * TODO(실서비스):
   *  - 타임스탬프와 함께 서버(/api/consent 등)에 기록하거나
   *    변환 요청 페이로드에 포함시켜 서버에서 함께 저장
   *  - snsPublish=true 인 결과물만 게시 후보 풀에 태깅
   */
  async function record(consent) {
    current = { ...consent, at: new Date().toISOString() };
    console.info('[consent:stub] recorded', current);
    return { ok: true, consentId: 'stub-' + Math.random().toString(36).slice(2, 10) };
  }

  /** 현재 세션의 동의 상태 조회 */
  function get() { return current; }

  /** 세션 리셋(다시 하기) 시 호출 */
  function reset() { current = null; }

  return { record, get, reset };
})();
