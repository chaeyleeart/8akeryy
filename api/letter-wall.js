// Only explicitly consented wall submissions are stored here. Rainbow letters never reach this API.
// The existing public photo store may hold these public letters under a separate prefix.
const PREFIX = 'showcase/2026/wall/';
const validId = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const publicLetter = value => value?.consent?.publish === true && validId(value.id) &&
  typeof value.message === 'string' && value.message.trim() && value.message.length <= 500
  ? { id: value.id, display_text: value.message, createdAt: value.createdAt } : null;
const origins = new Set(['https://www.8akeryy.com', 'https://8akeryy.com', 'https://8akeryy.vercel.app']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: '지원하지 않는 요청이에요.' });
  }
  const privateToken = process.env.SHOWCASE_LETTERS_BLOB_READ_WRITE_TOKEN;
  const token = privateToken || process.env.BLOB_READ_WRITE_TOKEN;
  const access = privateToken ? 'private' : 'public';
  if (!token) return res.status(503).json({ available: false, message: '편지 벽 저장 연결을 준비하고 있어요. 잠시 후 다시 시도해주세요.' });
  try {
    const { list, get, put } = await import('@vercel/blob');
    const read = async path => {
      const result = await get(path, { access, token, useCache: false });
      return result?.statusCode === 200 ? new Response(result.stream).json() : null;
    };
    if (req.method === 'GET') {
      const cursor = new URL(req.url, 'https://www.8akeryy.com').searchParams.get('cursor') || undefined;
      if (cursor && cursor.length > 2048) return res.status(400).json({ message: '목록 주소를 확인해주세요.' });
      const page = await list({ prefix: PREFIX, limit: 50, cursor, token });
      const letters = [];
      // Bounded batches avoid opening dozens of simultaneous Blob requests.
      for (let i = 0; i < page.blobs.length; i += 5) {
        const batch = await Promise.all(page.blobs.slice(i, i + 5).map(async blob => {
          if (!blob.pathname.startsWith(PREFIX) || blob.size > 10000) return null;
          return publicLetter(await read(blob.pathname));
        }));
        letters.push(...batch.filter(Boolean));
      }
      return res.status(200).json({ available: true, mode: 'live', letters, cursor: page.hasMore ? page.cursor : null });
    }
    if (req.headers.origin && !origins.has(req.headers.origin)) return res.status(403).json({ message: '전시 페이지에서 다시 시도해주세요.' });
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ message: '요청 형식을 확인해주세요.' });
    if (Number(req.headers['content-length'] || 0) > 10000) return res.status(413).json({ message: '500자 이내로 적어주세요.' });
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ message: '편지 내용을 확인해주세요.' }); }
    if (!validId(body?.id) || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 500 || body.consent !== true) {
      return res.status(400).json({ message: '편지 내용과 편지 벽 공개 동의를 확인해주세요.' });
    }
    const record = { id: body.id, message: body.message.trim(), createdAt: new Date().toISOString(), consent: { publish: true, scope: 'showcase-letter-wall', version: '2026-10-20' } };
    const path = `${PREFIX}${body.id}.json`;
    const existing = await read(path);
    if (existing) {
      if (existing.message !== record.message || existing.consent?.publish !== true) return res.status(409).json({ message: '이미 붙인 편지예요. 수정해서 붙이려면 새 편지로 작성해주세요.' });
      return res.status(200).json({ receipt: body.id, mode: 'live', letter: publicLetter(existing) });
    }
    try {
      await put(path, JSON.stringify(record), { token, access, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false });
    } catch (error) {
      // An identical retry may have won the create race; never overwrite another letter.
      const saved = await read(path);
      if (saved?.message !== record.message || saved?.consent?.publish !== true) throw error;
    }
    return res.status(201).json({ receipt: body.id, mode: 'live', letter: publicLetter(record) });
  } catch {
    return res.status(503).json({ message: '편지 벽에 연결하지 못했어요. 글은 유지되니 다시 시도해주세요.' });
  }
}
