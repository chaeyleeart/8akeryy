/* ============================================================
   GET /api/booth-archive — 포토부스 공개 아카이브 목록
   ------------------------------------------------------------
   booth/results/archive/  : 공개(웹·SNS 게시) 동의분 → 목록 표시
   응답: { images: [{ url, uploadedAt, no }], total }
   - total  : 전시 기간(2026. 8. 19–21) 전체 생성 수 = 방문자 수.
              전시 종료 후 미동의분(private/) 원본 삭제에 대비해 고정값.
   - no     : 1..total 범위에서 고정 시드로 부여한 고유 랜덤 번호
   - HIDDEN : 아카이브 페이지에서 내린 결과물
   ============================================================ */

const TOTAL_VISITORS = 287; // 전시 종료 시점 archive+private 전체 집계

const HIDDEN = new Set([
  'mt2efdm4-2taszv-aCxzVlysfsOGWs8brsptb6oW8PbItr.jpg',
  'mt0vnrij-l7lu9o-hufOe1OWCSEKnYtFtcjA9v8VJ2lZjL.jpg',
  'mszrqu2h-lmnwa9-hbFEDN26kewCsw03TKYOKHx4Zfm4oV.jpg',
  'mszlac4d-13oknj-fGcTUrs3SGNKWN4elmFTPBqPtZwRxn.jpg',
  'msyistp6-l8rh9f-gOgtj1kYeCyYZfiGsxgny9Vj7IYyQj.jpg',
  'msyirzcg-fvkqjy-PBhZ4461RfrRnszzWKjpE7NaxlLvWJ.jpg',
  'msyiqva4-1gkqtu-Vyal4HuhPxYDUDWTn259qmqs2xraoc.jpg',
  'mrmtuppv-do4ui8-8lEsiEdqb2HRm3RCZMQQtzjnJkaKh8.jpg',
  'mrkl9phj-p9yloq-tY8LPOwwgU7zFiOrxZdWIEhZkKVkxZ.jpg',
  'mrkmeper-9d0m8a-x3xviwCQ4QXfQ0s00ayn41dWZpnLhx.jpg',
  'mrkmi00b-r75ex7-LwV3GzMOY9DLfiTp5jo9BkZmBEzrRe.jpg',
  'mrkj0npo-zovesr-8JGmQdDn1kExnNVzeRDd9OW0EyZGvq.jpg',
  'mrkhuzdl-j3biku-lin2zt54W7bBvpgMaPglGMmxDBZpLO.jpg',
]);

// 고정 시드 PRNG — 번호가 항상 동일하게 유지되도록
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ images: [], total: 0 });

  try {
    const blobs = [];
    let cursor = '';
    for (let i = 0; i < 20; i++) {
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
      (j.blobs || []).forEach(b => blobs.push(b));
      if (!j.hasMore || !j.cursor) break;
      cursor = j.cursor;
    }

    const total = TOTAL_VISITORS;

    // HIDDEN 제외 (공개 URL 기준 — pathname 필드는 접미사가 다름)
    let images = blobs.filter(b => !HIDDEN.has(new URL(b.url).pathname.split('/').pop()));

    // 업로드 순으로 정렬 후, 1..total 범위의 고유 랜덤 번호 부여
    images.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
    const rng = mulberry32(20260819);
    const nums = Array.from({ length: total }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    images = images.map((b, i) => ({ url: b.url, uploadedAt: b.uploadedAt, no: nums[i] }));
    images.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // 최신순 응답

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ images, total });
  } catch (err) {
    console.error('[api/booth-archive]', err);
    return res.status(500).json({ error: 'list failed' });
  }
}
