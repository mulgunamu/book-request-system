# 교내 희망도서 신청시스템

입실초등학교를 위한 웹 기반 희망도서 신청 관리 시스템입니다.

## 🚀 주요 기능

### 📚 도서 검색 및 신청
- **알라딘 API 연동**: 실시간 도서 정보 검색
- **카테고리별 검색**: 어린이 도서 카테고리 필터링
- **실시간 검색**: 디바운싱을 통한 부드러운 검색 경험
- **도서 상세 정보**: 표지, 저자, 출판사, 가격 등 상세 정보 제공

### 🏫 학급 관리
- **학급 정보 설정**: 학년, 반, 담임교사 정보 관리
- **예산 관리**: 학급별 도서 구입 예산 설정 및 추적
- **실시간 예산 현황**: 사용 금액, 잔여 예산, 사용률 표시

### 📋 신청 관리
- **중복 신청 방지**: 이미 신청한 도서 및 기보유 도서 확인
- **예산 초과 방지**: 예산 한도 내에서만 신청 가능
- **신청 내역 관리**: 신청 도서 목록 조회, 수정, 삭제
- **CSV 내보내기**: 신청 목록을 Excel 파일로 다운로드

### 👨‍💼 관리자 기능
- **전체 현황 대시보드**: 총 신청 도서 수, 금액, 활성 학급 등 통계
- **학급별 현황**: 각 학급의 신청 현황 및 예산 사용률 모니터링
- **기보유 도서 관리**: CSV 업로드를 통한 기보유 도서 목록 관리
- **데이터 내보내기**: 전체 신청 데이터 CSV 다운로드

## 🛠 기술 스택

### Frontend
- **HTML5, CSS3, Vanilla JavaScript**
- **Tailwind CSS**: 반응형 UI 디자인
- **Font Awesome**: 아이콘

### Backend
- **Node.js + Express**: RESTful API 서버
- **JSON 파일**: 데이터 저장 (파일 시스템 기반)
- **Multer**: 파일 업로드 처리
- **CORS**: 크로스 오리진 요청 지원

### API
- **알라딘 오픈 API**: 도서 검색 및 정보 제공
- **JSONP 방식**: CORS 문제 해결

## 📁 프로젝트 구조

```
book-request-system/
├── public_html/             # 프론트엔드 (웹 문서)
│   ├── index.html          # 메인 페이지 (도서 검색 및 신청)
│   ├── applications.html   # 신청 도서 목록 페이지
│   ├── css/
│   │   └── style.css       # 커스텀 스타일
│   ├── js/
│   │   ├── utils.js        # 공통 유틸리티 함수
│   │   ├── api-client.js   # 백엔드 API 클라이언트
│   │   ├── api-handler.js  # 알라딘 API 핸들러
│   │   └── main.js         # 메인 애플리케이션 로직
│   ├── admin/
│   │   ├── index.html      # 관리자 대시보드
│   │   └── admin.js        # 관리자 기능 로직
│   └── data/
│       └── sample-data.json # 샘플 데이터
├── backend/                 # 백엔드 서버
│   ├── server.js           # Express 서버
│   ├── routes/             # API 라우트
│   │   ├── applications.js # 도서 신청 API
│   │   ├── classes.js      # 학급 관리 API
│   │   └── books.js        # 기보유 도서 API
│   └── data/               # JSON 데이터 파일
│       ├── applications.json
│       ├── classes.json
│       ├── budgets.json
│       └── owned-books.json
├── package.json            # 프로젝트 설정 및 의존성
├── start.sh               # 서버 시작 스크립트
└── README.md
```

## 🚀 설치 및 실행

### 1. 시스템 요구사항
- **Node.js** 16.0 이상
- **npm** 8.0 이상

### 2. 프로젝트 설치
```bash
# 프로젝트 다운로드
git clone [repository-url]
cd book-request-system

# 의존성 설치 및 서버 시작 (자동)
./start.sh
```

### 3. 수동 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 모드로 실행 (nodemon 사용)
npm run dev

# 프로덕션 모드로 실행
npm start
```

### 4. 브라우저에서 접속
```
http://localhost:3000
```

## 📖 사용 방법

### 1. 학급 정보 설정
1. 메인 페이지에서 학년, 반, 담임교사 정보 입력
2. "확인" 버튼 클릭하여 학급 정보 저장

### 2. 도서 검색 및 신청
1. 좌측 카테고리에서 원하는 분류 선택 또는 검색창에 도서명 입력
2. 도서 목록에서 원하는 도서 선택
3. "신청하기" 버튼 클릭하여 도서 신청

### 3. 신청 내역 확인
1. 상단 메뉴에서 "신청목록" 클릭
2. 신청한 도서 목록 확인 및 관리
3. 필요시 "내보내기" 버튼으로 CSV 다운로드

### 4. 관리자 기능
1. 상단 메뉴에서 "관리자" 클릭
2. 전체 현황 대시보드 확인
3. 학급 관리, 기보유 도서 관리 등 수행

## 🔧 API 엔드포인트

### 도서 신청 API
- `GET /api/applications` - 전체 신청 목록 조회
- `GET /api/applications/class/:classId` - 학급별 신청 목록 조회
- `POST /api/applications` - 신청 추가
- `DELETE /api/applications/:id` - 신청 삭제
- `GET /api/applications/budget/:classId` - 학급별 예산 현황 조회

### 학급 관리 API
- `GET /api/classes` - 전체 학급 목록 조회
- `GET /api/classes/:classId` - 특정 학급 정보 조회
- `PUT /api/classes/:classId` - 학급 정보 업데이트
- `GET /api/classes/:classId/budget` - 학급별 예산 조회
- `PUT /api/classes/:classId/budget` - 학급별 예산 설정

### 기보유 도서 API
- `GET /api/books/owned` - 기보유 도서 목록 조회
- `POST /api/books/owned` - 기보유 도서 추가
- `DELETE /api/books/owned/:isbn` - 기보유 도서 삭제
- `POST /api/books/owned/upload-csv` - CSV 파일로 일괄 업로드

## ⚙️ 설정

### 알라딘 API 키
기본적으로 `ttbgujeongmo2105001` 키가 설정되어 있습니다.
다른 키를 사용하려면 `public_html/js/api-handler.js` 파일에서 수정하세요:

```javascript
class AladinAPI {
    constructor() {
        this.apiKey = 'YOUR_TTB_KEY_HERE';
        // ...
    }
}
```

### 서버 포트 변경
기본 포트는 3000입니다. 변경하려면 환경변수를 설정하세요:

```bash
PORT=8080 npm start
```

### 기본 예산 설정
각 학급의 기본 예산은 50만원으로 설정되어 있습니다.
`backend/server.js` 파일에서 수정할 수 있습니다.

## 📱 반응형 디자인

- **데스크톱**: 전체 기능 지원
- **태블릿**: 적응형 레이아웃
- **모바일**: 터치 친화적 인터페이스

## 🔧 주요 기능 상세

### 데이터 저장
- **JSON 파일**: 서버의 파일 시스템에 JSON 형태로 저장
- **자동 백업**: 데이터 변경 시 자동으로 파일에 저장
- **CSV 지원**: 데이터 가져오기/내보내기 지원

### 보안 기능
- **입력 검증**: 모든 사용자 입력에 대한 서버 사이드 검증
- **CORS 설정**: 안전한 크로스 오리진 요청 처리
- **데이터 무결성**: 중복 신청 및 예산 초과 방지

### 성능 최적화
- **API 캐싱**: 알라딘 API 응답 캐싱 (5분)
- **디바운싱**: 검색 입력 최적화
- **페이지네이션**: 대량 데이터 처리

## 🐛 문제 해결

### 서버가 시작되지 않을 때
1. Node.js 설치 확인: `node --version`
2. 포트 충돌 확인: `lsof -i :3000`
3. 의존성 재설치: `rm -rf node_modules && npm install`

### 도서 검색이 안 될 때
1. 인터넷 연결 확인
2. 알라딘 API 상태 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 데이터가 저장되지 않을 때
1. 서버 로그 확인
2. `backend/data/` 디렉토리 권한 확인
3. 디스크 용량 확인

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 다음으로 연락해주세요:
- 이메일: [담당자 이메일]
- 전화: [담당자 전화번호]

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**입실초등학교 희망도서 신청시스템** - 더 나은 독서 환경을 위해 💚 