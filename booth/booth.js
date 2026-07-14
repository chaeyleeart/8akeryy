/* ============================================================
   8akeryy AI Photobooth — 화면 플로우 컨트롤러
   start → consent → camera → processing → result → (start)
   ============================================================ */
(function () {
  const cfg = window.BOOTH_CONFIG;

  /* ---------- 화면 전환 ---------- */
  const screens = {};
  document.querySelectorAll('.screen').forEach(s => { screens[s.dataset.screen] = s; });
  let activeScreen = 'start';

  function show(name) {
    const from = screens[activeScreen];
    const to = screens[name];
    if (!to || from === to) return;
    activeScreen = name;

    from.classList.remove('is-active');
    to.classList.add('is-active');
    gsap.fromTo(to, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out' });

    // 화면별 진입 훅
    if (name === 'camera') startCamera();
    else stopCamera();
    if (name !== 'result') clearIdleReset();
  }

  // data-goto 버튼 공통 처리
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => show(btn.dataset.goto));
  });

  /* ---------- 1. 시작 ---------- */
  document.getElementById('btnStart').addEventListener('click', () => show('consent'));

  /* ---------- 2. 동의 ---------- */
  const ckRequired = document.getElementById('ckRequired');
  const ckOptional = document.getElementById('ckOptional');
  const btnConsent = document.getElementById('btnConsent');

  ckRequired.addEventListener('change', () => { btnConsent.disabled = !ckRequired.checked; });

  btnConsent.addEventListener('click', async () => {
    await window.BoothConsent.record({
      aiTransform: ckRequired.checked,
      snsPublish: ckOptional.checked,
    });
    show('camera');
  });

  /* ---------- 3. 카메라 ---------- */
  const video = document.getElementById('camVideo');
  const canvas = document.getElementById('camCanvas');
  const shotImg = document.getElementById('camShot');
  const camTitle = document.getElementById('camTitle');
  const camCount = document.getElementById('camCount');
  const camFlash = document.getElementById('camFlash');
  const camError = document.getElementById('camError');
  const controlsLive = document.getElementById('camControlsLive');
  const controlsReview = document.getElementById('camControlsReview');
  const btnShutter = document.getElementById('btnShutter');

  let stream = null;
  let capturedBlob = null;
  let counting = false;

  async function startCamera() {
    resetCameraUI();
    camError.hidden = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('[camera]', err);
      camError.hidden = false;
    }
  }

  function stopCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    video.srcObject = null;
  }

  function resetCameraUI() {
    capturedBlob = null;
    counting = false;
    shotImg.hidden = true;
    video.hidden = false;
    camCount.hidden = true;
    controlsLive.hidden = false;
    controlsReview.hidden = true;
    camTitle.textContent = '프레임 안에 서 주세요';
  }

  document.getElementById('btnCamRetry').addEventListener('click', startCamera);

  btnShutter.addEventListener('click', async () => {
    if (counting || !stream) return;
    counting = true;
    // 카운트다운
    camCount.hidden = false;
    const numEl = camCount.querySelector('span');
    for (let n = cfg.COUNTDOWN_SEC; n >= 1; n--) {
      numEl.textContent = n;
      gsap.fromTo(numEl, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2)' });
      await sleep(1000);
    }
    camCount.hidden = true;
    counting = false;
    capture();
  });

  function capture() {
    // 4:5 중앙 크롭 캡처
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const targetW = cfg.CAPTURE_WIDTH;
    const targetH = Math.round(targetW / cfg.CAPTURE_ASPECT);
    // 소스에서 4:5 영역 산출
    let sw = vw, sh = Math.round(vw / cfg.CAPTURE_ASPECT);
    if (sh > vh) { sh = vh; sw = Math.round(vh * cfg.CAPTURE_ASPECT); }
    const sx = Math.round((vw - sw) / 2), sy = Math.round((vh - sh) / 2);

    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    // 미러 프리뷰와 동일하게 좌우 반전 저장
    ctx.translate(targetW, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);

    // 플래시 효과
    gsap.fromTo(camFlash, { opacity: 1 }, { opacity: 0, duration: .5, ease: 'power2.out' });

    canvas.toBlob(blob => {
      capturedBlob = blob;
      shotImg.src = URL.createObjectURL(blob);
      shotImg.hidden = false;
      video.hidden = true;
      controlsLive.hidden = true;
      controlsReview.hidden = false;
      camTitle.textContent = '마음에 드시나요?';
    }, 'image/jpeg', cfg.JPEG_QUALITY);
  }

  document.getElementById('btnRetake').addEventListener('click', () => {
    if (shotImg.src) URL.revokeObjectURL(shotImg.src);
    resetCameraUI();
  });

  document.getElementById('btnUsePhoto').addEventListener('click', () => {
    if (!capturedBlob) return;
    show('processing');
    runPipeline(capturedBlob);
  });

  /* ---------- 4. 처리 중 ---------- */
  const procMsg = document.getElementById('procMsg');
  const procBar = document.getElementById('procBar');
  let msgTimer = null;

  function startProcAnimation() {
    let i = 0;
    procMsg.textContent = cfg.PROC_MESSAGES[0];
    procBar.style.width = '4%';
    msgTimer = setInterval(() => {
      i = (i + 1) % cfg.PROC_MESSAGES.length;
      gsap.fromTo(procMsg, { opacity: 0 }, { opacity: 1, duration: .4 });
      procMsg.textContent = cfg.PROC_MESSAGES[i];
    }, 1900);
  }
  function stopProcAnimation() { clearInterval(msgTimer); msgTimer = null; }

  async function runPipeline(photoBlob) {
    startProcAnimation();
    try {
      const result = await window.BoothPipeline.transformImage(photoBlob, {
        onProgress: r => { procBar.style.width = Math.round(4 + r * 96) + '%'; },
      });
      stopProcAnimation();
      showResult(result);
    } catch (err) {
      console.error('[pipeline]', err);
      stopProcAnimation();
      procMsg.textContent = '앗, 오븐에 문제가 생겼어요. 다시 시도해 주세요 🙏';
      await sleep(2600);
      show('camera');
    }
  }

  /* ---------- 5. 결과 + QR ---------- */
  const resultImg = document.getElementById('resultImg');
  const qrBox = document.getElementById('qrBox');
  const resultTimer = document.getElementById('resultTimer');
  let idleTimer = null, idleTick = null;

  function showResult({ imageUrl, shareUrl }) {
    resultImg.src = imageUrl;

    // QR 생성 (다운로드용 공개 URL 인코딩) — shareUrl 없으면 QR 카드 숨김
    qrBox.innerHTML = '';
    const qrCard = document.querySelector('.qr-card');
    if (shareUrl) {
      qrCard.hidden = false;
      new QRCode(qrBox, {
        text: shareUrl,
        width: 150, height: 150,
        colorDark: '#3E3216', colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } else {
      qrCard.hidden = true;
    }

    show('result');
    gsap.fromTo('#resultCard', { scale: .9, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: 'back.out(1.4)', delay: .15 });
    startIdleReset();
  }

  // 키오스크: 결과 화면 방치 시 자동 리셋
  function startIdleReset() {
    clearIdleReset();
    let remain = cfg.RESULT_IDLE_RESET_SEC;
    resultTimer.hidden = false;
    idleTick = setInterval(() => {
      remain--;
      resultTimer.textContent = remain + '초 후 처음 화면으로 돌아가요';
      if (remain <= 0) resetAll();
    }, 1000);
  }
  function clearIdleReset() {
    clearInterval(idleTick); idleTick = null;
    if (resultTimer) { resultTimer.hidden = true; }
  }

  document.getElementById('btnAgain').addEventListener('click', resetAll);

  function resetAll() {
    clearIdleReset();
    window.BoothConsent.reset();
    ckRequired.checked = false;
    ckOptional.checked = false;
    btnConsent.disabled = true;
    capturedBlob = null;
    if (shotImg.src) { URL.revokeObjectURL(shotImg.src); shotImg.removeAttribute('src'); }
    resultImg.removeAttribute('src');
    qrBox.innerHTML = '';
    show('start');
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
})();
