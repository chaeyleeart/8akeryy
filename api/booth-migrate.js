/* ============================================================
   GET /api/booth-migrate?run=8akeryy-migrate-2026
   ------------------------------------------------------------
   일회용: booth/results/ 바로 아래(미분류) 이미지를
   booth/results/archive/ 로 복사해 홈페이지 갤러리에 노출시킴.
   원본은 삭제하지 않음(사용자가 대시보드에서 직접 정리).
   ⚠️ 실행 완료 후 이 파일은 저장소에서 제거할 것.
   ============================================================ */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const url = new URL(req.url, `https://${req.headers.host}`);
  if (url.searchParams.get('run') !== '8akeryy-migrate-2026') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'no blob token' });

  try {
    // 1) 전체 목록 수집
    const all = [];
    let cursor = '';
    for (let i = 0; i < 10; i++) {
      const qs = new URLSearchParams({ prefix: 'booth/results/', limit: '100' });
      if (cursor) qs.set('cursor', cursor);
      const r = await fetch(`https://blob.vercel-storage.com/?${qs}`, {
        headers: { authorization: `Bearer ${token}`, 'x-api-version': '7' },
      });
      if (!r.ok) throw new Error(`list ${r.status}`);
      const j = await r.json();
      all.push(...(j.blobs || []));
      if (!j.hasMore || !j.cursor) break;
      cursor = j.cursor;
    }

    // 2) 미분류(= results/ 바로 아래)만 필터
    const loose = all.filter(b => {
      const rest = (b.pathname || '').replace(/^booth\/results\//, '');
      return rest && !rest.includes('/');
    });

    // 3) archive/ 로 복사
    const moved = [];
    for (const b of loose) {
      const src = await fetch(b.url);
      if (!src.ok) { moved.push({ from: b.pathname, ok: false }); continue; }
      const buf = Buffer.from(await src.arrayBuffer());
      const base = b.pathname.split('/').pop();
      const put = await fetch(`https://blob.vercel-storage.com/booth/results/archive/${base}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'x-api-version': '7',
          'x-content-type': 'image/jpeg',
          'cache-control': 'public, max-age=31536000',
        },
        body: buf,
      });
      moved.push({ from: b.pathname, ok: put.ok });
    }

    return res.status(200).json({ total: loose.length, copied: moved.filter(m => m.ok).length, moved });
  } catch (err) {
    console.error('[booth-migrate]', err);
    return res.status(500).json({ error: String(err.message || err).slice(0, 200) });
  }
}
