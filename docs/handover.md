교내 희망 도서 구매 시스템 인수인계 문서 (완전판)
목차
시스템 개요
설치 및 개발환경 구축
운영환경 및 배포
DB 설계 및 데이터 초기화
API 명세
프론트엔드 구조 및 개발 가이드
백엔드 구조 및 개발 가이드
테스트 및 검증
운영/장애/복구/백업
실전 운영 팁 및 주의사항
향후 개선 사항
연락처
1. 시스템 개요
목적: 교내 학생 희망 도서 신청, 예산 관리, 담임교사 인증, 관리자 기능 등 도서 구매 전산화
주요 사용자: 학생, 담임교사, 관리자
주요 기능: 도서 검색/신청, 예산 관리, 신청 현황, 관리자 승인, 통계 등
2. 설치 및 개발환경 구축
2.1 요구사항
Node.js (권장: 18.x 이상)
npm (Node.js 설치 시 포함)
MongoDB (권장: 5.x 이상)
Git
(선택) PM2, Docker
2.2 소스코드 다운로드
Apply to admin.js
Run
system
2.3 환경 변수 설정
.env 파일을 프로젝트 루트에 생성
Apply to admin.js
backups
2.4 의존성 설치
Apply to admin.js
Run
install
2.5 개발 서버 실행
Apply to admin.js
Run
js
기본 접속: http://localhost:3000
3. 운영환경 및 배포
3.1 운영 서버 준비
Ubuntu 20.04 이상 권장
Node.js, MongoDB 설치
방화벽(80, 443, 3000포트 등) 설정
3.2 배포
소스코드 서버에 업로드 (git pull 권장)
환경 변수(.env) 서버에 맞게 설정
의존성 설치: npm ci 또는 npm install
빌드(필요시): npm run build
프로세스 매니저(PM2)로 실행 권장
Apply to admin.js
Run
startup
Nginx 등 리버스 프록시 설정(SSL 적용시)
3.3 운영 중 주요 명령어
Apply to admin.js
Run
monit
4. DB 설계 및 데이터 초기화
4.1 주요 컬렉션
classes: 학급 정보
books: 도서 정보
requests: 도서 신청 내역
admins: 관리자 계정
backups: 백업 이력
4.2 예시 데이터 삽입
Apply to admin.js
)
4.3 데이터 초기화/복구
초기화: 각 컬렉션 drop 후 샘플 데이터 삽입
복구: 백업 파일(backups/)을 MongoDB로 복원
5. API 명세
5.1 인증/관리자
메서드	경로	설명
POST	/api/admin/login	관리자 로그인
GET	/api/admin/setup-status	초기 설정 상태 확인
GET	/api/admin/profile	관리자 프로필 조회
POST	/api/admin/set-password	비밀번호 변경
5.2 학급/도서/신청
메서드	경로	설명
GET	/api/classes/settings	학급 정보 조회
POST	/api/classes/settings	학급 정보 등록/수정
GET	/api/books/search	도서 검색
POST	/api/books/request	도서 신청
GET	/api/books/status	신청 현황 조회
5.3 예시 요청/응답
Apply to admin.js
}
6. 프론트엔드 구조 및 개발 가이드
6.1 주요 파일
public_html/js/main.js: 메인 로직
public_html/js/api-handler.js: API 통신
public_html/css/style.css: 스타일
public_html/admin/index.html: 관리자 페이지
6.2 개발 팁
fetch API로 서버와 통신
상태 관리: 전역 변수 최소화, 함수 분리
에러 메시지/로딩 표시 구현 권장
Tailwind CSS로 UI 빠르게 커스터마이즈
6.3 빌드/배포
정적 파일(public_html)만 배포 서버에 복사
JS/CSS 압축 권장
7. 백엔드 구조 및 개발 가이드
7.1 주요 파일
backend/server.js: 메인 서버
backend/routes/: 라우터
backend/models/: Mongoose 모델
backend/controllers/: 비즈니스 로직
backend/utils/: 유틸리티/백업/예산 계산 등
7.2 개발 팁
라우터/컨트롤러/모델 분리
환경 변수 사용 철저
에러 핸들링(try-catch, next(err))
JWT 인증 미들웨어 활용
로그(winston)로 주요 이벤트 기록
8. 테스트 및 검증
8.1 단위 테스트
Jest, Mocha 등 도입 권장
예시: npm test
8.2 통합 테스트
Postman, Insomnia로 API 시나리오 검증
예시: 로그인 → 도서 신청 → 예산 차감 → 신청 현황 확인
8.3 E2E 테스트
Cypress 등 도입 가능
8.4 실전 점검 체크리스트
관리자 로그인/설정 가능 여부
학급/예산/담임 정보 정상 등록
도서 신청/승인/반려 정상 동작
예산 초과/경고 정상 동작
백업/복구 정상 동작
9. 운영/장애/복구/백업
9.1 백업
자동: 6시간마다, 최대 50개 보관
수동: 데이터 변경/업데이트 전 node backend/utils/backup.js
복구: mongorestore 또는 직접 스크립트 실행
9.2 장애/복구
서버 다운: pm2 restart book-request-system
DB 장애: MongoDB 로그 확인, 복구 필요시 백업에서 복원
긴급: 관리자 연락처 참고
9.3 로그 관리
logs/ 또는 /var/log/book-request-system/ 확인
에러 발생시 로그 첨부하여 문의
10. 실전 운영 팁 및 주의사항
환경 변수 노출 금지: .env는 git에 올리지 않기
비밀번호/토큰 관리: 주기적 변경, 강력한 값 사용
백업 주기 확인: 자동 백업 정상 동작 모니터링
DB 용량/성능 모니터링: MongoDB Compass, mongotop 등 활용
서버 리소스 모니터링: pm2 monit, top, htop
정기 점검: 관리자 기능, 예산, 신청 정상 동작 확인
업데이트 전 전체 백업 필수
장애 발생시: 로그/백업/DB 상태 확인 후 신속히 복구
11. 향후 개선 사항
도서 검색 API 성능 개선, 캐싱 도입
모바일 UI/UX 강화
통계/리포트 자동화
2단계 인증 등 보안 강화
테스트 자동화 및 CI/CD 도입
12. 연락처
12.1 개발 담당
이름: [이름]
이메일: [이메일]
전화번호: [전화번호]
12.2 운영 담당
이름: [이름]
이메일: [이메일]
전화번호: [전화번호]
12.3 긴급 연락처
시스템 장애: [전화번호], [이메일]
보안 이슈: [전화번호], [이메일]
12.4 외부 연락처
서버 호스팅: [회사명] [담당자명] [연락처]
도서 검색 API: [회사명] [담당자명] [연락처]
> 본 문서만으로도 신규 개발자/운영자가 시스템을 재구축, 버전업, 운영할 수 있도록 최대한 상세히 작성하였습니다. 추가 문의는 담당자에게 연락 바랍니다.
문서에 추가로 원하는 항목이나, 실제 환경에 맞는 예시/명령어/스크립트/DB초기화/운영 경험 등이 있다면 언제든 요청해 주세요!