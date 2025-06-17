파일 구조:
```
/book-request-system
│
├── index.html                   # 메인 페이지
├── styles.css                   # 스타일 (Tailwind CSS)
│
├── js/
│   ├── app.js                   # 메인 애플리케이션 로직
│   ├── aladin-api.js            # 알라딘 API 연동 모듈
│   ├── duplicate-checker.js     # 중복 체크 모듈
│   ├── data-manager.js          # 데이터 관리 모듈
│   └── utils.js                 # 유틸리티 함수
│
├── pages/
│   ├── admin.html               # 관리자 페이지
│   ├── cart-preview.html        # 장바구니 미리보기/수정 페이지
│   ├── class-view.html          # 학급별 신청 현황
│   └── all-requests.html        # 전체 도서 신청 현황
│
└── data/
    ├── classes.json             # 학급 정보 (학년, 반 구조)
    └── existing-books.json      # 기존 보유 도서 정보
```

시스템 구성 설명:
1. 프론트엔드: HTML, CSS(Tailwind), JavaScript를 사용하여 사용자 인터페이스 구현
2. 데이터 관리: JSON 형식으로 데이터 저장 및 관리
3. API 연동: 알라딘 API를 통해 장바구니 정보 가져오기
4. 중복 체크: 기존 도서와 신규 신청 도서 간의 중복 검사 알고리즘
5. 반응형 디자인: Tailwind CSS를 활용한 모바일 친화적 디자인