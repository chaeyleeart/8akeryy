/* ============================================================
   8akeryy — 아카이브 게시물 목록
   새 글을 올리려면 아래 배열 맨 앞에 항목을 하나 추가하면 됩니다.
   - category : 분류 라벨 (예: "Artwork", "Behind", "News")
   - image    : 대표 이미지 경로 (characters/ 또는 posts/ 폴더 등)
   - fit      : "contain"(투명 캐릭터·로고) 또는 "cover"(꽉 찬 일러스트) — 생략 시 cover
   - body     : 상세보기에 들어갈 본문 (줄바꿈은 \n)
   ※ 업로드 날짜는 사이트에 노출하지 않습니다.
   ============================================================ */
window.POSTS = [
  {
    id: "minhebang-intro",
    title: "민희방(minhebbang)",
    category: "Artwork",
    image: "characters/minhebang_front.png",
    fit: "contain",
    body: "8akeryy의 작은 가게를 지키는 안내자 민희방.\n말이 많진 않지만 곁에 있으면 마음이 차분해지는 존재예요. 오늘도 누군가의 잠든 마음을 디저트로 구워내며, 조용히 손님을 기다립니다."
  },
  {
    id: "dali-artwork",
    title: "달이(dali)",
    category: "Artwork",
    image: "characters/ddal_front.png",
    fit: "contain",
    body: "활발하고 용감한 대형견 달이.\n먼저 떠난 가족을 보내고 혼자가 됐지만, 여전히 환하게 사람을 반겨요. 달이의 첫 렌더 컷을 공개합니다."
  },
  {
    id: "kong-artwork",
    title: "콩(kong)",
    category: "Artwork",
    image: "characters/grey_front.png",
    fit: "contain",
    body: "느긋하고 온화한 노령견 콩.\n10년을 함께한 가족에게 버려졌지만, 지금은 보호소에서 가장 따뜻한 아이예요. 옆에 앉으면 금세 기대오는 콩을 담았습니다."
  },
  {
    id: "byeol-artwork",
    title: "별이(byeol)",
    category: "Artwork",
    image: "characters/brown_front.png",
    fit: "contain",
    body: "섬세하고 감수성 높은 별이.\n마음의 문이 굳게 닫혀 있던 아이지만, 천천히 다가가면 별이가 먼저 다가올지도 몰라요."
  },
  {
    id: "project-behind",
    title: "「기다릴게, 네 이름을」 — 기획 비하인드",
    category: "Behind",
    image: "characters/minhebang_front.png",
    fit: "contain",
    body: "숫자가 아니라 하루로 설득하기.\n이번 팝업 프로젝트가 어떤 고민에서 시작됐는지, 그리고 왜 끝까지 '입양하세요'라고 말하지 않기로 했는지에 대한 기록입니다."
  },
  {
    id: "8akeryy-world",
    title: "현실과 꿈의 경계에 있는 가게",
    category: "News",
    image: "characters/minhebang_sitting.png",
    fit: "contain",
    body: "8akeryy의 세계관 노트.\n잠깐 머물다 가는 작고 조용한 공간에서, 누구든 자신의 이야기를 한 조각의 디저트로 남길 수 있도록. 브랜드가 그리는 풍경을 기록해 둡니다."
  }
];
