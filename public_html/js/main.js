/**
 * 메인 애플리케이션
 */

class BookRequestApp {
    constructor() {
        this.currentClass = null;
        this.currentBooks = [];
        this.isInitialized = false;
        this.isAuthenticated = false; // 인증 상태
        this.authExpiry = null; // 인증 만료 시간
        
        // DOM 요소들
        this.elements = {};
        
        // 디바운스된 검색 함수
        this.debouncedSearch = debounce(this.handleSearch.bind(this), 300);
        
        // 알라딘 API 인스턴스를 전역으로 설정
        if (!window.aladinAPI) {
            window.aladinAPI = new AladinAPI();
        }
    }

    /**
     * 앱 초기화
     */
    async init() {
        try {
            console.log('🚀 BookRequestApp 초기화 시작');
            this.bindElements();
            this.bindEvents();
            
            // 세션스토리지 기반 인증 복원
            const restored = await this.checkSessionAuth();
            if (!restored) {
                // 인증 복원 실패 시 기존 로직 수행
                await this.restoreClassInfo();
            }
            // 학급 정보 복원 후 재확인
            setTimeout(() => {
                if (!this.currentClass) {
                    const savedClass = Storage.get('currentClass');
                    if (savedClass) {
                        console.log('🔄 학급 정보 재시도');
                        this.restoreClassInfo();
                    }
                }
            }, 1000);
            // 기본 카테고리 도서 로드
            await this.loadBooksByCategory('bestseller');
            console.log('✅ BookRequestApp 초기화 완료');
        } catch (error) {
            console.error('❌ 앱 초기화 실패:', error);
            Toast.show('초기화 오류', '애플리케이션 초기화 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 세션스토리지 기반 인증 복원
     */
    async checkSessionAuth() {
        const authInfo = JSON.parse(sessionStorage.getItem('classAuth') || 'null');
        if (authInfo && authInfo.classId && authInfo.expiry > Date.now()) {
            // 서버에서 학급 정보 조회
            const response = await fetch('/api/classes/settings');
            if (response.ok) {
                const classSettings = await response.json();
                const classData = classSettings.find(cls => cls.classId === authInfo.classId);
                if (classData) {
                    this.currentClass = classData;
                    this.isAuthenticated = true;
                    this.authExpiry = authInfo.expiry;
                    // UI 갱신
                    if (this.elements.grade && this.elements.class) {
                        this.elements.grade.value = classData.grade;
                        await this.handleGradeChange();
                        this.elements.class.value = classData.class;
                        if (this.elements.teacher) this.elements.teacher.value = classData.teacher;
                    }
                    if (typeof this.loadClassInfo === 'function') this.loadClassInfo();
                    if (typeof this.updateBudgetDisplay === 'function') await this.updateBudgetDisplay();
                    return true;
                }
            }
        }
        sessionStorage.removeItem('classAuth');
        return false;
    }

    /**
     * 기본 데이터 초기화
     */
    initializeData() {
        this.bindElements();
        this.currentBooks = [];
        this.currentCategory = null;
        this.currentClass = null;
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.bindEvents();
    }

    /**
     * 카테고리 초기화
     */
    initializeCategories() {
        // 카테고리는 HTML에 정적으로 정의되어 있으므로 별도 로딩 불필요
        // 기본 카테고리 상태 설정
        this.currentCategory = null;
        
        // 베스트셀러 버튼을 기본 활성화
        const bestsellerBtn = document.querySelector('[data-category="bestseller"]');
        if (bestsellerBtn) {
            bestsellerBtn.classList.add('active');
        }
    }

    /**
     * DOM 요소 바인딩
     */
    bindElements() {
        this.elements = {
            // 학급 정보
            grade: document.getElementById('grade'),
            class: document.getElementById('class'),
            teacher: document.getElementById('teacher'),
            setClassBtn: document.getElementById('setClassBtn'),
            classInfo: document.getElementById('classInfo'),
            displayClass: document.getElementById('displayClass'),
            displayTeacher: document.getElementById('displayTeacher'),
            
            // 예산 정보
            usedBudget: document.getElementById('usedBudget'),
            totalBudget: document.getElementById('totalBudget'),
            budgetBar: document.getElementById('budgetBar'),
            
            // 검색 및 카테고리
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            searchType: document.getElementById('searchType'),
            searchSort: document.getElementById('searchSort'),
            recentOnly: document.getElementById('recentOnly'),
            inStockOnly: document.getElementById('inStockOnly'),
            categoryList: document.getElementById('categoryList'),
            currentCategory: document.getElementById('currentCategory'),
            sortBy: document.getElementById('sortBy'),
            
            // 도서 목록
            booksGrid: document.getElementById('booksGrid'),
            totalBooks: document.getElementById('totalBooks'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            emptyState: document.getElementById('emptyState'),
            
            // 모달
            bookModal: document.getElementById('bookModal'),
            modalContent: document.getElementById('modalContent')
        };
    }

    /**
     * 이벤트 리스너 바인딩
     */
    bindEvents() {
        // 학급 정보 설정
        this.elements.setClassBtn.addEventListener('click', this.handleSetClass.bind(this));
        
        // 학년 선택 시 해당 학년의 반 목록 로드
        this.elements.grade.addEventListener('change', this.handleGradeChange.bind(this));
        
        // 반 선택 시 담임교사 정보 로드
        this.elements.class.addEventListener('change', this.handleClassChange.bind(this));
        
        // 검색
        this.elements.searchInput.addEventListener('input', (e) => {
            this.debouncedSearch(e.target.value);
        });
        this.elements.searchBtn.addEventListener('click', () => {
            this.handleSearch(this.elements.searchInput.value);
        });
        
        // 엔터 키로 검색
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });
        
        // 정렬 변경
        this.elements.sortBy.addEventListener('change', this.handleSortChange.bind(this));
        
        // 더보기 버튼
        this.elements.loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
        
        // 도서 그리드 클릭 (이벤트 위임)
        this.elements.booksGrid.addEventListener('click', this.handleBookGridClick.bind(this));
        
        // 모달 내부 신청하기 버튼 (이벤트 위임)
        this.elements.modalContent.addEventListener('click', this.handleModalClick.bind(this));
        
        // 카테고리 이벤트 설정
        this.setupCategoryEvents();
    }

    /**
     * 카테고리 이벤트 설정
     */
    setupCategoryEvents() {
        // 카테고리 버튼 이벤트 (이벤트 위임)
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                // 상위 카테고리 펼침/접힘 처리
                if (e.target.closest('.category-parent-btn')) {
                    e.preventDefault();
                    this.handleCategoryToggle(e.target.closest('.category-parent-btn'));
                    return;
                }
                
                // 카테고리 선택 처리
                if (e.target.closest('.category-btn')) {
                    this.handleCategoryClick(e.target.closest('.category-btn'));
                }
            });
        }
    }

    /**
     * 초기 데이터 로드
     */
    async loadInitialData() {
        try {
            // 베스트셀러 로드
            await this.loadBooksByCategory('bestseller');
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
            this.showEmptyState();
        }
    }

    /**
     * 저장된 학급 정보 복원
     */
    async restoreClassInfo() {
        try {
            // 로컬스토리지 사용 제거
            console.log('💡 학급 정보는 항상 서버에서 조회합니다');
            return;
        } catch (error) {
            console.error('❌ 학급 정보 조회 오류:', error);
            Toast.show('오류', '학급 정보 조회 중 오류가 발생했습니다. 다시 선택해주세요.', 'error');
        }
    }

    /**
     * 학급 정보 설정 처리
     */
    async handleSetClass() {
        const grade = this.elements.grade.value;
        const classNum = this.elements.class.value;
        const teacher = this.elements.teacher.value.trim();

        // 입력 검증
        if (!grade || !classNum || !teacher) {
            Toast.show('입력 오류', '학년, 반, 담임교사는 필수 입력 항목입니다.', 'error');
            return;
        }

        // 세션스토리지 인증 정보 확인 (패스워드 입력 모달 전에 체크)
        const authInfo = JSON.parse(sessionStorage.getItem('classAuth') || 'null');
        if (
            authInfo &&
            authInfo.classId === `${grade}-${classNum}` &&
            authInfo.expiry > Date.now()
        ) {
            Toast.show('알림', '이미 인증된 학급입니다.', 'info');
            return;
        }

        // 서버에서 학급 정보 받아오기
        let classSettings = [];
        try {
            const response = await fetch('/api/classes/settings');
            if (response.ok) {
                classSettings = await response.json();
            }
        } catch (e) {
            // 무시: 검증 실패 시 오류 메시지로 안내
        }

        // 입력 검증
        const validation = Validator.validateClassInfo(grade, classNum, teacher, classSettings);
        if (!validation.isValid) {
            Toast.show('입력 오류', validation.errors.join('\n'), 'error');
            return;
        }

        const classInfo = {
            grade: parseInt(grade),
            class: parseInt(classNum),
            teacher: teacher,
            classId: `${grade}-${classNum}`
        };

        // 패스워드 인증 요구
        await this.authenticateClass(classInfo);
    }

    /**
     * 학급 패스워드 인증
     */
    async authenticateClass(classInfo) {
        try {
            // 중복 인증 체크 (패스워드 입력 모달 전에 한 번 더 체크)
            const authInfo = JSON.parse(sessionStorage.getItem('classAuth') || 'null');
            if (
                authInfo &&
                authInfo.classId === classInfo.classId &&
                authInfo.expiry > Date.now()
            ) {
                Toast.show('알림', '이미 인증된 학급입니다.', 'info');
                return;
            }

            // 서버에서 해당 학급의 패스워드 확인
            const response = await fetch('/api/classes/settings');
            if (!response.ok) {
                throw new Error('학급 정보를 불러올 수 없습니다.');
            }
            
            const classSettings = await response.json();
            console.log('🔍 받은 학급 설정 데이터:', classSettings);
            console.log('🔍 찾는 학급 ID:', classInfo.classId);
            
            // 배열에서 해당 학급 찾기
            const classData = classSettings.find(cls => cls.classId === classInfo.classId);
            console.log('🔍 찾은 학급 데이터:', classData);
            
            if (!classData) {
                Toast.show('학급 없음', '해당 학급이 설정되지 않았습니다. 관리자에게 문의하세요.', 'error');
                return;
            }
            
            const correctPassword = classData.password || `class${classInfo.grade}${classInfo.class}^^`;
            console.log('🔑 올바른 패스워드:', correctPassword);
            
            // 패스워드 입력 모달 표시
            const userPassword = await this.showPasswordModal(classInfo);
            
            if (userPassword === null) {
                // 사용자가 취소한 경우
                return;
            }
            
            // 패스워드 정규화 (양쪽 모두 소문자 변환 + 공백 제거)
            const normalizedUserPassword = userPassword.toLowerCase().replace(/\s/g, '');
            const normalizedCorrectPassword = correctPassword.toLowerCase().replace(/\s/g, '');
            
            console.log('🔍 입력된 패스워드 (정규화):', normalizedUserPassword);
            console.log('🔍 올바른 패스워드 (정규화):', normalizedCorrectPassword);
            
            if (normalizedUserPassword === normalizedCorrectPassword) {
                // 인증 성공
                this.isAuthenticated = true;
                this.authExpiry = Date.now() + (2 * 60 * 60 * 1000); // 2시간 후 만료
                
                await this.setCurrentClass(classInfo);
                Toast.show('인증 성공', `${classInfo.classId} ${classInfo.teacher} 선생님 학급으로 인증되었습니다.`, 'success');
            } else {
                // 인증 실패
                Toast.show('인증 실패', '패스워드가 올바르지 않습니다.', 'error');
            }
            
        } catch (error) {
            console.error('인증 오류:', error);
            Toast.show('인증 오류', '인증 처리 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 패스워드 입력 모달 표시
     */
    async showPasswordModal(classInfo) {
        return new Promise(async (resolve) => {
            // 서버에서 해당 학급의 실제 패스워드 가져오기
            let displayPassword = `class${classInfo.grade}${classInfo.class}^^`; // 기본값
            
            try {
                const response = await fetch('/api/classes/settings');
                if (response.ok) {
                    const classSettings = await response.json();
                    // 배열에서 해당 학급 찾기
                    const classData = classSettings.find(cls => cls.classId === classInfo.classId);
                    if (classData && classData.password) {
                        displayPassword = classData.password;
                    }
                }
            } catch (error) {
                console.warn('패스워드 정보 조회 실패, 기본값 사용:', error);
            }
            
            const modalHtml = `
                <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" id="passwordModal">
                    <div class="bg-white rounded-lg p-6 w-96 max-w-90vw">
                        <div class="text-center mb-4">
                            <i class="fas fa-lock text-4xl text-blue-600 mb-2"></i>
                            <h3 class="text-lg font-bold text-gray-900">학급 인증</h3>
                            <p class="text-gray-600 mt-2">
                                <strong>${classInfo.grade}학년 ${classInfo.class}반</strong> 패스워드를 입력하세요
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <input type="password" 
                                   id="classPassword" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="패스워드 입력"
                                   autocomplete="off">
                            <p class="text-xs text-gray-500 mt-1">
                                현재 패스워드: ${displayPassword}
                            </p>
                        </div>
                        
                        <div class="flex gap-3">
                            <button id="cancelAuth" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                취소
                            </button>
                            <button id="confirmAuth" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = document.getElementById('passwordModal');
            const passwordInput = document.getElementById('classPassword');
            const cancelBtn = document.getElementById('cancelAuth');
            const confirmBtn = document.getElementById('confirmAuth');
            
            // 포커스 설정
            passwordInput.focus();
            
            // 패스워드 입력 시 자동 변환 (소문자 변환 + 공백 제거)
            passwordInput.addEventListener('input', (e) => {
                let value = e.target.value;
                // 대문자를 소문자로 변환하고 공백 제거
                value = value.toLowerCase().replace(/\s/g, '');
                e.target.value = value;
            });
            
            // 엔터 키로 확인
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn.click();
                }
            });
            
            // 취소 버튼
            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });
            
            // 확인 버튼
            confirmBtn.addEventListener('click', () => {
                const password = passwordInput.value;
                modal.remove();
                resolve(password);
            });
            
            // ESC 키로 취소
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', escHandler);
                    resolve(null);
                }
            });
        });
    }

    /**
     * 현재 학급 설정
     */
    async setCurrentClass(classInfo) {
        this.currentClass = classInfo;
        // 인증 정보 세션스토리지에 저장 (2시간 유지)
        sessionStorage.setItem('classAuth', JSON.stringify({
            classId: classInfo.classId,
            expiry: Date.now() + (2 * 60 * 60 * 1000)
        }));
        location.reload(); // 인증 성공 시 새로고침
        return;
        bookStatusManager.setCurrentClass(classInfo.classId);
        
        // UI 업데이트
        this.elements.displayClass.textContent = `${classInfo.grade}학년 ${classInfo.class}반`;
        this.elements.displayTeacher.textContent = classInfo.teacher;
        this.elements.classInfo.classList.remove('hidden');
        
        // 인증 상태 표시 추가
        this.updateAuthStatus();
        
        // 예산 정보 업데이트 (비동기)
        await this.updateBudgetDisplay();
        
        // 도서 상태 업데이트
        this.updateBooksStatus();
    }

    /**
     * 인증 상태 UI 업데이트
     */
    updateAuthStatus() {
        let authStatusElement = document.getElementById('authStatus');
        if (!authStatusElement) {
            // 인증 상태 표시 요소 생성
            authStatusElement = document.createElement('div');
            authStatusElement.id = 'authStatus';
            authStatusElement.className = 'text-xs mt-1';
            this.elements.classInfo.appendChild(authStatusElement);
        }
        
        if (this.checkAuthentication()) {
            const remainingTime = Math.ceil((this.authExpiry - Date.now()) / (60 * 1000)); // 분 단위
            authStatusElement.innerHTML = `
                <span class="text-green-600">
                    <i class="fas fa-lock mr-1"></i>인증됨 (${remainingTime}분 남음)
                </span>
            `;
        } else {
            authStatusElement.innerHTML = `
                <span class="text-amber-600">
                    <i class="fas fa-unlock mr-1"></i>인증 필요
                </span>
            `;
        }
    }

    /**
     * 예산 정보 업데이트
     */
    async updateBudgetDisplay() {
        if (!this.currentClass) {
            console.log('❌ 선택된 학급 없음');
            this.elements.usedBudget.textContent = '0';
            this.elements.totalBudget.textContent = '0';
            this.elements.budgetBar.style.width = '0%';
            return;
        }
        try {
            // 서버에서 실제 예산 정보 가져오기
            const response = await fetch('/api/classes/settings');
            if (response.ok) {
                const classSettings = await response.json();
                const classData = classSettings.find(cls => cls.classId === this.currentClass.classId);
                if (classData && classData.budget) {
                    const serverBudget = classData.budget;
                    // 신청 내역을 서버에서 fetch해서 합산
                    const applications = await Applications.getByClass(this.currentClass.classId);
                    const usedBudget = applications.reduce((sum, app) => sum + (app.price || 0), 0);
                    const totalBudget = serverBudget;
                    const percentage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
                    this.elements.usedBudget.textContent = formatPrice(usedBudget);
                    this.elements.totalBudget.textContent = formatPrice(totalBudget);
                    this.elements.budgetBar.style.width = `${percentage}%`;
                    if (percentage > 90) {
                        this.elements.budgetBar.classList.add('bg-red-600');
                        this.elements.budgetBar.classList.remove('bg-blue-600');
                    } else {
                        this.elements.budgetBar.classList.add('bg-blue-600');
                        this.elements.budgetBar.classList.remove('bg-red-600');
                    }
                } else {
                    this.elements.usedBudget.textContent = '0';
                    this.elements.totalBudget.textContent = '0';
                    this.elements.budgetBar.style.width = '0%';
                    Toast.show('알림', '해당 학급의 예산 정보가 없습니다.', 'warning');
                }
            } else {
                this.elements.usedBudget.textContent = '0';
                this.elements.totalBudget.textContent = '0';
                this.elements.budgetBar.style.width = '0%';
                Toast.show('오류', '예산 정보를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 예산 정보 업데이트 오류:', error);
            this.elements.usedBudget.textContent = '0';
            this.elements.totalBudget.textContent = '0';
            this.elements.budgetBar.style.width = '0%';
            Toast.show('오류', '예산 정보 업데이트 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 검색 처리
     */
    async handleSearch(query) {
        if (!query || query.trim() === '') {
            await this.loadBooksByCategory('bestseller');
            return;
        }

        try {
            Loading.show();
            this.elements.emptyState.classList.add('hidden');
            
            // 검색 옵션 수집
            const searchOptions = {
                queryType: this.elements.searchType?.value || 'Title',
                sort: this.elements.searchSort?.value || 'SalesPoint',
                maxResults: 50,
                start: 1
            };
            
            // 필터 옵션 적용
            if (this.elements.recentOnly?.checked) {
                searchOptions.recentPublishFilter = 6; // 최근 6개월
            }
            
            if (this.elements.inStockOnly?.checked) {
                searchOptions.outofStockfilter = 1; // 품절 제외
            }
            
            // 부가 정보 요청
            searchOptions.optResult = ['ratingInfo', 'bestSellerRank'];

            const results = await searchManager.search(query.trim(), searchOptions);
            
            if (results && results.books && results.books.length > 0) {
                this.currentBooks = results.books;
                this.displayBooks(this.currentBooks);
                this.updateResultsInfo(results);
                this.updateBooksStatus();
                this.updateLoadMoreButton();
                
                // 현재 카테고리 표시 업데이트
                this.elements.currentCategory.textContent = `"${query}" 검색 결과`;
                
                // 카테고리 버튼 비활성화
                this.updateCategoryButtons(null);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('검색 오류:', error);
            Toast.show('검색 오류', '도서 검색 중 오류가 발생했습니다.', 'error');
            this.showEmptyState();
        } finally {
            Loading.hide();
        }
    }

    /**
     * 카테고리별 도서 로드
     */
    async loadBooksByCategory(categoryId) {
        try {
            this.elements.emptyState.classList.add('hidden');
            
            const results = await searchManager.searchByCategory(categoryId);
            if (results && results.books && results.books.length > 0) {
                this.currentBooks = results.books;
                this.displayBooks(this.currentBooks);
                this.updateResultsInfo(results);
                this.updateLoadMoreButton();
                
                // 카테고리 버튼 상태 업데이트
                this.updateCategoryButtons(categoryId);
            } else {
                this.currentBooks = [];
                this.showEmptyState();
            }
        } catch (error) {
            console.error('카테고리 로드 오류:', error);
            Toast.show('로드 오류', '도서 목록을 불러오는 중 오류가 발생했습니다.', 'error');
            this.showEmptyState();
        }
    }

    /**
     * 정렬 변경 처리
     */
    async handleSortChange() {
        const sortBy = this.elements.sortBy.value;
        
        // 알라딘 API 정렬 옵션 매핑 (정확한 API 파라미터 사용)
        const sortMapping = {
            'salesPoint': 'SalesPoint',           // 판매량순 (내림차순)
            'publishTime': 'PublishTime',         // 출간일순 (내림차순 - 최신순)
            'customerReviewRank': 'CustomerReviewRank', // 평점순 (내림차순)
            'reviewCount': 'ReviewCount',         // 리뷰순 (내림차순)
            'accuracy': 'Accuracy',               // 정확도순 (내림차순)
            'title': 'Title',                     // 제목순 (오름차순)
            'priceAsc': 'PriceAsc',              // 가격 낮은순 (오름차순)
            'priceDesc': 'PriceDesc'             // 가격 높은순 (내림차순)
        };
        
        const apiSortValue = sortMapping[sortBy] || 'SalesPoint';
        
        try {
            Loading.show('정렬 중...');
            
            let results;
            const sortOptions = { 
                sort: apiSortValue,
                page: 1  // 정렬 변경 시 첫 페이지부터 시작
            };
            
            if (searchManager.currentQuery) {
                // 검색 결과 정렬
                results = await searchManager.search(searchManager.currentQuery, sortOptions);
            } else {
                // 카테고리 결과 정렬
                results = await searchManager.searchByCategory(searchManager.currentCategory, sortOptions);
            }
            
            if (results && results.books) {
                // 클라이언트 사이드에서 추가 정렬 (API 정렬이 완벽하지 않을 경우 보완)
                results.books = this.applySortToBooks(results.books, sortBy);
                
                this.displayBooks(results.books);
                this.updateResultsInfo(results);
                
                Toast.show('정렬 완료', `${this.getSortDisplayName(sortBy)}로 정렬되었습니다.`, 'success');
            }
        } catch (error) {
            console.error('정렬 변경 오류:', error);
            Toast.show('정렬 오류', '정렬 중 오류가 발생했습니다.', 'error');
        } finally {
            Loading.hide();
        }
    }

    /**
     * 클라이언트 사이드 정렬 적용 (API 정렬 보완용)
     */
    applySortToBooks(books, sortBy) {
        if (!books || books.length === 0) return books;
        
        const sortedBooks = [...books];
        
        switch (sortBy) {
            case 'salesPoint':
                // 판매량순 (내림차순)
                return sortedBooks.sort((a, b) => (b.salesPoint || 0) - (a.salesPoint || 0));
                
            case 'publishTime':
                // 출간일순 (내림차순 - 최신순)
                return sortedBooks.sort((a, b) => {
                    const dateA = new Date(a.pubDate || '1900-01-01');
                    const dateB = new Date(b.pubDate || '1900-01-01');
                    return dateB - dateA;
                });
                
            case 'customerReviewRank':
                // 평점순 (내림차순)
                return sortedBooks.sort((a, b) => (b.customerReviewRank || 0) - (a.customerReviewRank || 0));
                
            case 'reviewCount':
                // 리뷰순 (내림차순)
                return sortedBooks.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                
            case 'title':
                // 제목순 (오름차순)
                return sortedBooks.sort((a, b) => {
                    const titleA = (a.title || '').toLowerCase();
                    const titleB = (b.title || '').toLowerCase();
                    return titleA.localeCompare(titleB, 'ko');
                });
                
            case 'priceAsc':
                // 가격 낮은순 (오름차순)
                return sortedBooks.sort((a, b) => (a.price || 0) - (b.price || 0));
                
            case 'priceDesc':
                // 가격 높은순 (내림차순)
                return sortedBooks.sort((a, b) => (b.price || 0) - (a.price || 0));
                
            default:
                return sortedBooks;
        }
    }

    /**
     * 정렬 옵션 표시명 반환
     */
    getSortDisplayName(sortBy) {
        const displayNames = {
            'salesPoint': '판매량순',
            'publishTime': '출간일순',
            'customerReviewRank': '평점순',
            'reviewCount': '리뷰순',
            'accuracy': '정확도순',
            'title': '제목순',
            'priceAsc': '가격 낮은순',
            'priceDesc': '가격 높은순'
        };
        
        return displayNames[sortBy] || '판매량순';
    }

    /**
     * 더보기 버튼 처리
     */
    async handleLoadMore() {
        try {
            console.log('더보기 버튼 클릭');
            const result = await searchManager.loadNextPage();
            if (result && result.books.length > 0) {
                // 단순 누적: 기존 currentBooks에 새 books를 추가
                this.currentBooks = [...this.currentBooks, ...result.books];
                this.displayBooks(this.currentBooks);
            } else {
                console.log('더 이상 불러올 도서가 없음');
                Toast.show('더 이상 불러올 도서가 없습니다.', 'info');
            }
        } catch (error) {
            console.error('더보기 처리 중 오류:', error);
            Toast.show('도서를 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 도서 그리드 클릭 처리 (이벤트 위임)
     */
    handleBookGridClick(e) {
        const bookCard = e.target.closest('.book-card');
        const applyBtn = e.target.closest('.apply-btn');
        
        if (applyBtn) {
            e.stopPropagation();
            const isbn = applyBtn.dataset.isbn;
            const book = this.currentBooks.find(b => b.isbn === isbn);
            if (book) {
                this.handleBookApplication(book);
            }
        } else if (bookCard) {
            const isbn = bookCard.dataset.isbn;
            const book = this.currentBooks.find(b => b.isbn === isbn);
            if (book) {
                this.showBookDetail(book);
            }
        }
    }

    /**
     * 도서 신청 처리 (개선된 버전)
     */
    async handleBookApplication(book) {
        console.log('🔍 현재 학급 정보:', this.currentClass);
        
        if (!this.currentClass || !this.currentClass.classId) {
            console.log('❌ 학급 정보 없음');
            Toast.show('학급 정보 필요', '먼저 학급 정보를 입력해주세요.', 'warning');
            return;
        }

        // 인증 상태 확인
        console.log('🔐 인증 상태 확인:', this.isAuthenticated);
        if (!this.checkAuthentication()) {
            console.log('🔐 인증 필요');
            const password = await this.showPasswordModal();
            if (!password) {
                console.log('❌ 패스워드 입력 취소');
                return;
            }
            
            // 패스워드 검증
            const expectedPassword = `class${this.currentClass.grade}${this.currentClass.class}^^`;
            if (password !== expectedPassword) {
                console.log('❌ 패스워드 불일치');
                Toast.show('인증 실패', '학급 패스워드가 일치하지 않습니다.', 'error');
                return;
            }
            
            // 인증 성공
            console.log('✅ 인증 성공');
            this.isAuthenticated = true;
            Toast.show('인증 성공', '학급 패스워드 인증이 완료되었습니다.', 'success');
        }

        if (!book.canApply) {
            console.log('❌ 도서 신청 불가:', book.statusText);
            let message = book.statusText;
            if (book.matchedBook) {
                message += `\n\n📚 보유 도서 정보:\n`;
                message += `• 제목: ${book.matchedBook.title}\n`;
                if (book.matchedBook.author) message += `• 저자: ${book.matchedBook.author}\n`;
                if (book.matchedBook.publisher) message += `• 출판사: ${book.matchedBook.publisher}\n`;
                if (book.matchedBook.registrationNumber) message += `• 등록번호: ${book.matchedBook.registrationNumber}\n`;
            }
            Toast.show('신청 불가', message, 'warning', 5000);
            return;
        }

        try {
            Loading.show('도서관 보유 여부 확인 중...');
            
            console.log('도서 신청 시도:', {
                title: book.title,
                author: book.author,
                isbn: book.isbn
            });
            
            // 개선된 즉시 확인 기능 사용
            const availabilityCheck = await bookStatusManager.checkBookAvailabilityNow(book);
            
            console.log('도서관 보유 여부 확인 결과:', availabilityCheck);
            
            if (availabilityCheck.isOwned) {
                Loading.hide();
                
                console.log('도서관 보유 도서로 판정됨:', availabilityCheck.matchedBook);
                
                // 도서관 보유 도서인 경우 신청 불가
                const matchedBook = availabilityCheck.matchedBook;
                let message = `이 도서는 도서관에 이미 보유중입니다.\n\n`;
                message += `📚 보유 도서 정보:\n`;
                message += `• 제목: ${matchedBook.title}\n`;
                if (matchedBook.author) message += `• 저자: ${matchedBook.author}\n`;
                if (matchedBook.publisher) message += `• 출판사: ${matchedBook.publisher}\n`;
                if (matchedBook.registrationNumber) message += `• 등록번호: ${matchedBook.registrationNumber}\n`;
                message += `\n🔍 매칭 방식: ${this.getMatchTypeDescription(availabilityCheck.matchType)}`;
                
                Toast.show('신청 불가', message, 'warning', 6000);
                
                // 도서 상태 업데이트
                book.isOwned = true;
                book.canApply = false;
                book.statusText = '보유중';
                book.statusClass = 'owned';
                book.matchedBook = matchedBook;
                book.matchType = availabilityCheck.matchType;
                
                // UI 업데이트
                bookStatusManager.updateBookCardInUI(book);
                return;
            }
            
            console.log('신청 가능한 도서로 판정됨, 신청 진행');
            Loading.hide();
            
            // 예산 확인
            const budgetCheck = Budget.checkBudgetExceeded(this.currentClass.classId, book.price);
            if (budgetCheck) {
                Toast.show('예산 초과', '학급 예산을 초과하여 신청할 수 없습니다.', 'warning');
                return;
            }
            
            // 신청 데이터 생성
            const application = {
                classId: this.currentClass.classId,
                isbn: book.isbn13 || book.isbn,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                price: book.price,
                cover: book.cover,
                isTeacherBook: false,
                appliedAt: new Date().toISOString()
            };

            // 신청 저장
            const success = Applications.add(application);
            
            if (success) {
                Toast.show('신청 완료', `"${book.title}" 도서 신청이 완료되었습니다.`, 'success');
                
                // 도서 상태 업데이트
                book.isApplied = true;
                book.canApply = false;
                book.statusText = '신청완료';
                book.statusClass = 'applied';
                
                // UI 업데이트
                this.updateBudgetDisplay();
                this.updateSingleBookStatus(book);
                
                // 통계 로깅
                console.log('신청 완료 통계:', bookStatusManager.getStats());
            } else {
                Toast.show('신청 실패', '도서 신청 중 오류가 발생했습니다.', 'error');
            }
        } catch (error) {
            Loading.hide();
            console.error('도서 신청 오류:', error);
            Toast.show('오류', '도서 신청 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 매칭 타입 설명 반환
     */
    getMatchTypeDescription(matchType) {
        const descriptions = {
            'isbn': 'ISBN 정확 매칭',
            'title_author': '제목 + 저자 매칭',
            'title_only': '제목 매칭',
            'title_partial_author': '제목 + 부분 저자 매칭',
            'none': '매칭 없음'
        };
        return descriptions[matchType] || '알 수 없음';
    }

    /**
     * 개별 도서 상태 업데이트
     */
    updateSingleBookStatus(book) {
        const isbn = book.isbn13 || book.isbn;
        const bookCard = document.querySelector(`[data-isbn="${isbn}"]`);
        
        if (bookCard) {
            // 신청 버튼 업데이트
            const applyBtn = bookCard.querySelector('.apply-btn');
            if (applyBtn) {
                applyBtn.className = `apply-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${book.statusClass}`;
                applyBtn.textContent = book.statusText;
                applyBtn.disabled = !book.canApply;
                
                if (!book.canApply) {
                    applyBtn.classList.add('cursor-not-allowed', 'opacity-60');
                }
            }
            
            // 상태 오버레이 추가 (신청완료인 경우)
            if (book.isApplied) {
                let statusOverlay = bookCard.querySelector('.status-overlay');
                if (!statusOverlay) {
                    statusOverlay = document.createElement('div');
                    statusOverlay.className = 'status-overlay applied';
                    statusOverlay.textContent = '신청완료';
                    bookCard.appendChild(statusOverlay);
                }
            }
        }
    }

    /**
     * 도서 목록 표시
     */
    displayBooks(books) {
        if (!books || books.length === 0) {
            this.showEmptyState();
            return;
        }
        this.elements.booksGrid.innerHTML = books.map(book => this.createBookCard(book)).join('');
        this.elements.emptyState.classList.add('hidden');
        this.updateLoadMoreButton();
    }

    /**
     * 도서 카드 HTML 생성
     */
    createBookCard(book) {
        const discountPercent = book.discount > 0 ? Math.round(book.discount) : 0;
        const hasDiscount = discountPercent > 0;
        
        return `
            <div class="book-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative" data-isbn="${book.isbn}">
                ${book.isOwned ? '<div class="status-overlay owned">보유중</div>' : ''}
                ${book.isApplied ? '<div class="status-overlay applied">신청완료</div>' : ''}
                
                <div class="aspect-w-3 aspect-h-4 bg-gray-100">
                    <img src="${book.cover}" alt="${Validator.escapeHtml(book.title)}" 
                         class="book-cover w-full h-48 object-cover"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgdmlld0JveD0iMCAwIDIwMCAyNjciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjY3IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMzLjVMMTAwIDEzMy41WiIgc3Ryb2tlPSIjOUI5QkEwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K'">
                </div>
                
                <div class="p-4">
                    <h3 class="book-title font-semibold text-sm text-gray-900 mb-2 leading-tight">
                        ${Validator.escapeHtml(book.title)}
                    </h3>
                    
                    <p class="book-author text-xs text-gray-600 mb-2">
                        ${Validator.escapeHtml(book.author)}
                    </p>
                    
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-right">
                            ${hasDiscount ? `
                                <div class="price-discount text-xs">${formatPrice(book.price)}원</div>
                                <div class="price-text text-sm">${formatPrice(book.salePrice)}원</div>
                                <div class="text-xs text-red-500">${discountPercent}% 할인</div>
                            ` : `
                                <div class="price-text text-sm">${formatPrice(book.salePrice)}원</div>
                            `}
                        </div>
                    </div>
                    
                    <button class="apply-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${book.statusClass} ${!book.canApply ? 'cursor-not-allowed opacity-60' : ''}"
                            data-isbn="${book.isbn}"
                            ${!book.canApply ? 'disabled' : ''}>
                        ${book.statusText}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 도서 상세 모달 표시
     */
    showBookDetail(book) {
        const modalContent = `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/3">
                    <img src="${book.cover}" alt="${Validator.escapeHtml(book.title)}" 
                         class="w-full rounded-lg shadow-md">
                </div>
                
                <div class="md:w-2/3">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${Validator.escapeHtml(book.title)}</h3>
                    
                    <div class="space-y-2 mb-4">
                        <p><span class="font-medium">저자:</span> ${Validator.escapeHtml(book.author)}</p>
                        <p><span class="font-medium">출판사:</span> ${Validator.escapeHtml(book.publisher)}</p>
                        <p><span class="font-medium">출간일:</span> ${book.pubDate}</p>
                        <p><span class="font-medium">ISBN:</span> ${book.isbn}</p>
                        ${book.categoryName ? `<p><span class="font-medium">분류:</span> ${book.categoryName}</p>` : ''}
                    </div>
                    
                    <div class="mb-4">
                        <div class="text-lg font-bold text-blue-600">${formatPrice(book.salePrice)}원</div>
                        ${book.discount > 0 ? `
                            <div class="text-sm text-gray-500">
                                정가: <span class="line-through">${formatPrice(book.price)}원</span>
                                <span class="text-red-500 ml-2">${Math.round(book.discount)}% 할인</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${book.description ? `
                        <div class="mb-4">
                            <h4 class="font-medium mb-2">도서 소개</h4>
                            <p class="text-sm text-gray-700 leading-relaxed">${Validator.escapeHtml(book.description)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="flex gap-3">
                        <button class="apply-btn flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${book.statusClass} ${!book.canApply ? 'cursor-not-allowed opacity-60' : ''}"
                                data-isbn="${book.isbn}"
                                ${!book.canApply ? 'disabled' : ''}>
                            ${book.statusText}
                        </button>
                        
                        ${book.link ? `
                            <a href="${book.link}" target="_blank" 
                               class="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                <i class="fas fa-external-link-alt mr-1"></i>상세보기
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        this.elements.modalContent.innerHTML = modalContent;
        Modal.show('bookModal');
    }

    /**
     * 도서 상태 업데이트
     */
    async updateBooksStatus() {
        if (this.currentBooks.length === 0) return;
        
        try {
            Loading.show('도서 상태를 확인하고 있습니다...');
            this.currentBooks = await bookStatusManager.updateBooksStatus(this.currentBooks);
            this.displayBooks(this.currentBooks);
        } catch (error) {
            console.error('도서 상태 업데이트 오류:', error);
        } finally {
            Loading.hide();
        }
    }

    /**
     * 결과 정보 업데이트
     */
    updateResultsInfo(results) {
        this.elements.totalBooks.textContent = results.totalResults;
        
        // 더보기 버튼 표시 여부
        const hasMore = results.books.length < results.totalResults;
        this.elements.loadMoreBtn.classList.toggle('hidden', !hasMore);
    }

    /**
     * 더보기 버튼 업데이트
     */
    updateLoadMoreButton() {
        if (!searchManager.lastResults) {
            this.elements.loadMoreBtn.classList.add('hidden');
            return;
        }
        
        const currentCount = this.currentBooks.length;
        const totalCount = Math.min(200, searchManager.lastResults.totalResults); // API 제한 반영
        const hasMore = currentCount < totalCount && currentCount < 200; // 최대 200개 제한
        
        this.elements.loadMoreBtn.classList.toggle('hidden', !hasMore);
        
        if (hasMore) {
            this.elements.loadMoreBtn.innerHTML = `
                <i class="fas fa-plus mr-2"></i>더 많은 도서 보기 (${currentCount}/${totalCount})
            `;
        } else if (currentCount >= 200) {
            // API 제한에 도달한 경우 안내 메시지
            this.elements.loadMoreBtn.innerHTML = `
                <i class="fas fa-info-circle mr-2"></i>API 제한으로 최대 200개까지만 조회 가능
            `;
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.classList.add('cursor-not-allowed', 'opacity-60');
            this.elements.loadMoreBtn.disabled = true;
        }
    }

    /**
     * 카테고리 버튼 상태 업데이트
     */
    updateCategoryButtons(activeCategory) {
        const buttons = this.elements.categoryList.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.dataset.category === activeCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 빈 상태 표시
     */
    showEmptyState() {
        this.elements.booksGrid.innerHTML = '';
        this.elements.emptyState.classList.remove('hidden');
        this.elements.loadMoreBtn.classList.add('hidden');
        this.elements.totalBooks.textContent = '0';
    }

    /**
     * 모달 내부 신청하기 버튼 (이벤트 위임)
     */
    handleModalClick(e) {
        if (e.target.classList.contains('apply-btn')) {
            e.stopPropagation();
            const isbn = e.target.dataset.isbn;
            const book = this.currentBooks.find(b => b.isbn === isbn);
            if (book) {
                this.handleBookApplication(book);
            }
        }
    }

    handleCategoryToggle(button) {
        const categoryGroup = button.closest('.category-group');
        const subcategoryList = categoryGroup.querySelector('.subcategory-list');
        const chevron = button.querySelector('.fa-chevron-down');
        
        // 다른 카테고리 그룹들 닫기
        document.querySelectorAll('.category-group').forEach(group => {
            if (group !== categoryGroup) {
                const otherBtn = group.querySelector('.category-parent-btn');
                const otherList = group.querySelector('.subcategory-list');
                otherBtn.classList.remove('expanded');
                otherList.classList.remove('show');
                otherList.classList.add('hidden');
            }
        });
        
        // 현재 카테고리 토글
        if (button.classList.contains('expanded')) {
            button.classList.remove('expanded');
            subcategoryList.classList.remove('show');
            setTimeout(() => {
                subcategoryList.classList.add('hidden');
            }, 300);
        } else {
            button.classList.add('expanded');
            subcategoryList.classList.remove('hidden');
            setTimeout(() => {
                subcategoryList.classList.add('show');
            }, 10);
        }
    }

    handleCategoryClick(button) {
        const category = button.dataset.category;
        
        // 모든 카테고리 버튼에서 active 클래스 제거
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 클릭된 버튼에 active 클래스 추가
        button.classList.add('active');
        
        // 카테고리 이름 표시
        const categoryName = button.textContent.trim().replace(/^\s*•\s*/, ''); // 불릿 포인트 제거
        this.elements.currentCategory.textContent = categoryName;
        
        // 검색 입력창 초기화
        this.elements.searchInput.value = '';
        
        // 카테고리별 도서 로드
        this.loadBooksByCategory(category);
    }

    /**
     * 캐시 정리 스케줄링
     */
    setupCacheCleanup() {
        // 10분마다 만료된 캐시 정리
        setInterval(() => {
            bookStatusManager.clearExpiredCache();
            console.log('🧹 만료된 캐시 정리 완료');
        }, 10 * 60 * 1000);
        
        // 페이지 언로드 시 캐시 정리
        window.addEventListener('beforeunload', () => {
            bookStatusManager.clearExpiredCache();
        });
    }

    /**
     * 통계 표시 초기화
     */
    setupStatsDisplay() {
        // 개발 모드에서만 통계 표시
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.createStatsDisplay();
            this.updateStatsDisplay();
            
            // 5초마다 통계 업데이트
            setInterval(() => {
                this.updateStatsDisplay();
            }, 5000);
        }
    }

    /**
     * 통계 표시 UI 생성
     */
    createStatsDisplay() {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'status-stats';
        statsDiv.className = 'status-stats';
        statsDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">📊 시스템 상태</div>
            <div id="stats-content"></div>
        `;
        document.body.appendChild(statsDiv);
        
        // 클릭으로 표시/숨김 토글
        let isVisible = false;
        statsDiv.addEventListener('click', () => {
            isVisible = !isVisible;
            statsDiv.classList.toggle('show', isVisible);
        });
        
        // 마우스 오버 시 잠시 표시
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                statsDiv.classList.add('show');
                setTimeout(() => {
                    if (!isVisible) {
                        statsDiv.classList.remove('show');
                    }
                }, 3000);
            }
        });
    }

    /**
     * 통계 정보 업데이트
     */
    updateStatsDisplay() {
        const statsContent = document.getElementById('stats-content');
        if (!statsContent) return;
        
        const stats = bookStatusManager.getStats();
        const currentBooks = this.currentBooks ? this.currentBooks.length : 0;
        
        statsContent.innerHTML = `
            <div>📚 현재 도서: ${currentBooks}권</div>
            <div>💾 캐시: ${stats.cacheSize}개</div>
            <div>⏳ 확인중: ${stats.pendingChecks}개</div>
            <div>📖 보유: ${stats.ownedBooksCount}권</div>
            <div>✅ 신청: ${stats.appliedBooksCount}권</div>
            <div style="margin-top: 4px; font-size: 10px; opacity: 0.7;">Ctrl+S로 표시</div>
        `;
    }

    /**
     * 학년 선택 변경 처리 - 해당 학년의 반 목록 로드
     */
    async handleGradeChange() {
        const grade = this.elements.grade.value;
        
        console.log('🔄 학년 선택 변경:', grade);
        
        // 반 선택 초기화
        this.elements.class.innerHTML = '<option value="">반 선택</option>';
        this.elements.teacher.value = '';
        
        // 예산 현황 숨기기
        this.currentClass = null;
        this.elements.classInfo.classList.add('hidden');
        
        if (!grade) {
            console.log('❌ 학년이 선택되지 않음');
            Toast.show('알림', '학년을 선택해주세요.', 'warning');
            return;
        }
        
        try {
            console.log('📡 학급 정보 API 호출 시작...');
            
            // 서버에서 학급 정보 조회
            const response = await fetch('/api/classes/settings');
            console.log('📡 API 응답 상태:', response.status, response.statusText);
            
            if (response.ok) {
                const classSettings = await response.json();
                console.log('📊 전체 학급 설정 데이터:', classSettings);
                
                // 해당 학년의 반들 찾기
                const gradeClasses = classSettings.filter(cls => cls.grade === parseInt(grade));
                console.log('📋 찾은 반 목록:', gradeClasses);
                
                if (gradeClasses.length > 0) {
                    // 반 번호 정렬
                    gradeClasses.sort((a, b) => a.class - b.class);
                    console.log('📋 정렬된 반 목록:', gradeClasses);
                    
                    // 반 옵션 동적 생성
                    gradeClasses.forEach(classData => {
                        const option = document.createElement('option');
                        option.value = classData.class;
                        option.textContent = `${classData.class}반`;
                        this.elements.class.appendChild(option);
                        console.log('➕ 반 옵션 추가:', classData.class);
                    });
                    
                    console.log(`✅ ${grade}학년 반 목록 로드 완료:`, gradeClasses);
                    Toast.show('정보 로드', `${grade}학년에 설정된 ${gradeClasses.length}개 반을 불러왔습니다.`, 'info');
                } else {
                    console.log(`⚠️ ${grade}학년에 설정된 반이 없음`);
                    Toast.show('알림', `${grade}학년에 설정된 반이 없습니다. 관리자 페이지에서 먼저 설정해주세요.`, 'warning');
                }
            } else {
                console.error('❌ 학급 정보 조회 실패:', response.status);
                Toast.show('오류', '학급 정보를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 학급 정보 조회 오류:', error);
            console.error('❌ 오류 상세:', error.message, error.stack);
            Toast.show('오류', '학급 정보 조회 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 반 선택 변경 처리 - 담임교사 정보 로드
     */
    async handleClassChange() {
        const grade = this.elements.grade.value;
        const classNum = this.elements.class.value;
        
        if (!grade || !classNum) {
            Toast.show('알림', '학년과 반을 모두 선택해주세요.', 'warning');
            return;
        }
        // 담임교사 입력란은 비우기만 하고, 자동 입력하지 않음
        this.elements.teacher.value = '';
        this.currentClass = null;
        this.elements.classInfo.classList.add('hidden');
    }

    /**
     * 인증 상태 확인
     */
    checkAuthentication() {
        // 현재 인증 상태 확인
        if (!this.isAuthenticated || !this.authExpiry) {
            return false;
        }
        
        const currentTime = Date.now();
        if (currentTime > this.authExpiry) {
            // 인증 만료
            this.isAuthenticated = false;
            this.authExpiry = null;
            return false;
        }
        
        return true;
    }

    /**
     * 저장된 인증 정보 복원
     */
    restoreAuthInfo() {
        // 로컬스토리지 사용 제거
        return false;
    }
}

// 애플리케이션 인스턴스 생성 및 초기화
const app = new BookRequestApp();

// DOM 로드 완료 시 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    app.init();
}); 