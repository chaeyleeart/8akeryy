// 8akeryy AI Photobooth — transform API
// 전시(2026. 8. 19–21) 종료와 함께 비활성화되었습니다.
// 기존 구현은 git 히스토리 참고. 게시 동의 결과물 목록은 /api/booth-archive 가 계속 제공합니다.

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(410).json({
    error: 'exhibition_ended',
    message: '8akeryy AI 포토부스는 전시 종료와 함께 마무리되었습니다. 기록은 /archive.html 에서 볼 수 있어요.',
    archive: 'https://8akeryy.vercel.app/archive.html#booth',
  });
}
