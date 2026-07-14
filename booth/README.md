# 8akeryy AI Photobooth (`booth/`)

오프라인 전시 부스용 AI 포토부스 웹앱. iPad Safari 세로 화면 · 키오스크(가이드 액세스) 운영 기준.
관람객 촬영 → 8akeryy 화풍 치비 캐릭터 변환 → 강아지 프리셋 합성 → QR 다운로드.

## 현재 상태 (초안 스켈레톤)

- ✅ 전체 5화면 플로우 동작: 시작 → 동의 → 카메라(카운트다운/재촬영) → 처리 중 → 결과+QR
- ✅ iPad 내장 카메라(getUserMedia, 4:5 중앙 크롭 캡처, 미러 저장)
- ✅ QR 코드 생성 (shareUrl 인코딩)
- ✅ 키오스크 편의: 스크롤/줌 잠금, 결과 화면 90초 방치 시 자동 리셋
- 🔲 AI 변환 — **stub** (`js/pipeline.js` → 목업 이미지 반환)
- 🔲 동의 기록 — **stub** (`js/consent.js`, UI만 동작)
- 🔲 R2 업로드 / NB2 호출 — **골격만** (`api/transform.js`)

## 파일 구조

```
booth/
├── index.html          # 단일 페이지 (5개 screen 섹션)
├── booth.css           # 메인 사이트 style.css 팔레트 계승
├── booth.js            # 화면 플로우 컨트롤러 (카메라·카운트다운·QR·리셋)
├── js/
│   ├── config.js       # 클라이언트 설정 (MOCK_MODE 등) — 비밀값 금지
│   ├── consent.js      # 동의 stub  ← 나중에 실제 기록 로직
│   └── pipeline.js     # transformImage(photo) → {imageUrl, shareUrl}  ← 유일한 AI 계약점
├── api/
│   ├── transform.js    # Vercel 서버리스 골격 (NB2 → R2 → 공개 URL)
│   └── _constants.js   # 고정 프롬프트·의상(크림 니트)·포즈 상수 (서버 전용)
├── assets/             # 로고, 목업 이미지(웹용 리사이즈)
├── vercel.json
└── package.json
```

## 실제 연동 시 바꿀 곳 (딱 3군데)

1. **`api/_constants.js`** — PLACEHOLDER 프롬프트 3개를 확정 전문으로 교체
2. **`api/transform.js`** — TODO 블록 구현 (multipart 파싱 → NB2 3단계 호출 → R2 업로드)
   - 환경변수(Vercel 대시보드): `GEMINI_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `PRESET_IMAGE_URL`
3. **`js/config.js`** — `MOCK_MODE: false` 로 변경

UI/플로우 코드(booth.js)는 손댈 필요 없음.

## 로컬 테스트

```bash
cd booth
python3 -m http.server 8000   # 또는 npx serve
```

⚠️ 카메라는 `localhost` 또는 HTTPS에서만 열림. iPad 실기기 테스트는 배포 URL(HTTPS)로.

## 배포 (Vercel)

```bash
npm i -g vercel
cd booth
vercel            # 첫 배포
vercel --prod
```

- 도메인: Vercel 프로젝트 → Settings → Domains → `booth.8akeryy.com` 추가
  → 카페24 DNS에 CNAME `booth` → `cname.vercel-dns.com` 등록
- iPad 여러 대가 같은 URL 접속, Safari 전체화면(홈 화면에 추가) + 가이드 액세스 권장
- 인터넷 필수 (LTE 라우터 백업 권장)

## 운영 체크리스트

- [ ] 부스 조명에서 카메라 노출 확인 (역광 주의)
- [ ] 동의 문구 법무 검토 후 확정
- [ ] 결과 이미지 보존 기간 / 자동 삭제 정책 (R2 lifecycle)
- [ ] QR 접속 페이지(공개 URL)에 다운로드 버튼 있는 랜딩 씌울지 결정
