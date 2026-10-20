(() => {
  const $ = id => document.getElementById(id);
  let images = [], selected = 0, trigger = null;
  function safeURL(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com') && url.pathname.startsWith('/booth/results/archive/') ? url.href : null;
    } catch { return null; }
  }
  function show(index) {
    selected = index;
    const item = images[index];
    $('photo-label').textContent = `그날의 손님 · No. ${item.no}`;
    $('photo-large').alt = `손님 ${item.no}의 AI 기념사진`;
    $('large-error').hidden = true;
    $('photo-large').src = item.url;
    $('photo-position').textContent = `${index + 1} / ${images.length}`;
    $('photo-previous').disabled = index === 0;
    $('photo-next').disabled = index === images.length - 1;
  }
  async function load() {
    $('gallery-retry').hidden = true; $('gallery-error').hidden = true;
    $('photo-count').textContent = '사진을 불러오고 있어요…';
    try {
      const response = await fetch('/api/booth-archive', { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('list');
      const data = await response.json();
      if (!Array.isArray(data.images)) throw new Error('list');
      images = data.images.map(item => ({ ...item, url: safeURL(item.url) })).filter(item => item.url);
      $('photo-wall').replaceChildren();
      images.forEach((item, index) => {
        const button = document.createElement('button'); button.className = 'photo-card';
        button.style.setProperty('--tilt', `${[-2, 1.6, -.8, 2.3][index % 4]}deg`);
        button.setAttribute('aria-label', `손님 ${item.no}의 사진 크게 보기`);
        const img = document.createElement('img'); img.src = item.url; img.alt = `강아지들과 함께한 손님 ${item.no}`; img.loading = index < 8 ? 'eager' : 'lazy'; img.decoding = 'async';
        const label = document.createElement('span'); label.textContent = `8AKERYY · No. ${item.no}`;
        button.append(img, label);
        button.addEventListener('click', () => { trigger = button; show(index); $('photo-detail').showModal(); });
        $('photo-wall').append(button);
      });
      $('photo-count').textContent = images.length ? `함께 남긴 사진 ${images.length}장` : '아직 공개된 사진이 없어요.';
    } catch {
      $('photo-count').textContent = '';
      $('gallery-error').textContent = '사진 목록을 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해주세요.';
      $('gallery-error').hidden = false; $('gallery-retry').hidden = false;
    }
  }
  $('gallery-retry').addEventListener('click', load);
  $('photo-large').addEventListener('error', () => { $('large-error').hidden = false; });
  $('photo-close').addEventListener('click', () => $('photo-detail').close());
  $('photo-detail').addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  $('photo-previous').addEventListener('click', () => { if (selected > 0) show(selected - 1); });
  $('photo-next').addEventListener('click', () => { if (selected < images.length - 1) show(selected + 1); });
  $('photo-detail').addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
    if (event.key === 'ArrowLeft' && selected > 0) { event.preventDefault(); show(selected - 1); }
    if (event.key === 'ArrowRight' && selected < images.length - 1) { event.preventDefault(); show(selected + 1); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('photo-detail').open && parent !== window) parent.postMessage({ source: '8akeryy-archive', type: 'close' }, location.origin);
  });
  load();
})();
