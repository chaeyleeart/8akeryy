/* ============================================================
   GET /api/booth-archive — 포토부스 공개 아카이브 목록
   ------------------------------------------------------------
   게시 동의된 결과물(booth/results/archive/)만 목록으로 반환.
   gallery.html의 Photo Booth 섹션이 페이지 로드 시 호출 →
   생성과 동시에(새로고침 시) 홈페이지에 자동 게재됨.
   응답: { images: [{ url, uploadedAt }] }  (최신순)
   ============================================================ */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ images: [] });

  try {
    const images = [];
    let cursor = '';
    // 페이지네이션 순회 (최대 1000장까지)
    for (let i = 0; i < 10; i++) {
      const qs = new URLSearchParams({ prefix: 'booth/results/archive/', limit: '100' });
      if (cursor) qs.set('cursor', cursor);
      const r = await fetch(`https://blob.vercel-storage.com/?${qs}`, {
        headers: {
          authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          'x-api-version': '7',
        },
      });
      if (!r.ok) throw new Error(`blob list ${r.status}`);
      const j = await r.json();
      (j.blobs || []).forEach(b => images.push({ url: b.url, uploadedAt: b.uploadedAt }));
      if (!j.hasMore || !j.cursor) break;
      cursor = j.cursor;
    }

    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // 최신순

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ images });
  } catch (err) {
    console.error('[api/booth-archive]', err);
    return res.status(500).json({ error: 'list failed' });
  }
}
