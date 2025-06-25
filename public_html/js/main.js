class BookRequestSystem {
    constructor() {
        console.log('🚀 도서 신청 시스템 초기화 중...');
        
        this.elements = {};
        this.currentBooks = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.currentCategory = null;
        this.currentClass = null;
        
        // 디바운스된 검색 함수
        this.debouncedSearch = this.debounce(this.handleSearch.bind(this), 300);
        
        this.init();
    }

    /**
     * 시스템 초기화
     */
    async init() {
        try {
            console.log('🔧 시스템 초기화 시작...');
            
            // DOM 요소 바인딩 및 이벤트 설정
            await this.setupElements();
            
            // 보유도서 정보 로드
            await this.loadOwnedBooks();
            
            // 카테고리 초기화
            this.initializeCategories();
            
            // 초기 데이터 로드
            await this.loadInitialData();
            
            // 통계 표시 설정 (개발 모드)
            this.setupStatsDisplay();
            
            console.log('✅ 시스템 초기화 완료!');
        } catch (error) {
            console.error('❌ 시스템 초기화 실패:', error);
            this.showErrorMessage('시스템 초기화 중 오류가 발생했습니다.');
        }
    }

    /**
     * DOM 요소 설정 및 이벤트 바인딩 (개선됨)
     */
    async setupElements() {
        return new Promise((resolve) => {
            // DOM이 완전히 로드될 때까지 대기
            const setup = () => {
                this.bindElements();
                this.bindEvents();
                resolve();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setup);
            } else {
                setup();
            }
        });
    }

    /**
     * DOM 요소 바인딩 (개선됨)
     */
    bindElements() {
        console.log('🔗 DOM 요소 바인딩 중...');
        
        // 학급 정보 요소들을 다양한 방법으로 찾기
        this.elements.grade = this.findElement([
            'grade',
            'gradeSelect', 
            'select[name="grade"]',
            '.grade-select'
        ]);
        
        this.elements.class = this.findElement([
            'class',
            'classSelect',
            'select[name="class"]', 
            '.class-select'
        ]);

        // 추가로 모든 select 요소를 검사해서 학년/반 찾기
        if (!this.elements.grade || !this.elements.class) {
            this.findGradeClassSelects();
        }

        // 나머지 요소들
        this.elements.teacher = document.getElementById('teacher');
        this.elements.setClassBtn = document.getElementById('setClassBtn');
        this.elements.classInfo = document.getElementById('classInfo');
        this.elements.displayClass = document.getElementById('displayClass');
        this.elements.displayTeacher = document.getElementById('displayTeacher');
        
        // 예산 정보
        this.elements.usedBudget = document.getElementById('usedBudget');
        this.elements.totalBudget = document.getElementById('totalBudget');
        this.elements.budgetBar = document.getElementById('budgetBar');
        
        // 검색 및 카테고리
        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.searchBtn = document.getElementById('searchBtn');
        this.elements.searchType = document.getElementById('searchType');
        this.elements.searchSort = document.getElementById('searchSort');
        this.elements.recentOnly = document.getElementById('recentOnly');
        this.elements.inStockOnly = document.getElementById('inStockOnly');
        this.elements.categoryList = document.getElementById('categoryList');
        this.elements.currentCategory = document.getElementById('currentCategory');
        this.elements.sortBy = document.getElementById('sortBy');
        
        // 도서 목록
        this.elements.booksGrid = document.getElementById('booksGrid');
        this.elements.totalBooks = document.getElementById('totalBooks');
        //this.elements.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.elements.emptyState = document.getElementById('emptyState');
        
        // 모달
        this.elements.bookModal = document.getElementById('bookModal');
        this.elements.modalContent = document.getElementById('modalContent');

        // 바인딩 결과 로그
        console.log('🎯 학년 선택 요소:', this.elements.grade ? '발견!' : '❌ 없음');
        console.log('🎯 반 선택 요소:', this.elements.class ? '발견!' : '❌ 없음');
        
        if (this.elements.grade) {
            console.log('📝 학년 요소 ID:', this.elements.grade.id);
            console.log('📝 학년 요소 name:', this.elements.grade.name);
        }
        if (this.elements.class) {
            console.log('📝 반 요소 ID:', this.elements.class.id);
            console.log('📝 반 요소 name:', this.elements.class.name);
        }
    }

    /**
     * 요소 찾기 헬퍼 (여러 선택자 시도)
     */
    findElement(selectors) {
        for (const selector of selectors) {
            const element = selector.startsWith('#') || selector.includes('[') || selector.includes('.') 
                ? document.querySelector(selector)
                : document.getElementById(selector);
            
            if (element) {
                console.log(`✅ 요소 발견: ${selector}`, element);
                return element;
            }
        }
        console.log(`❌ 요소 못찾음: ${selectors.join(', ')}`);
        return null;
    }

    /**
     * 모든 select 요소를 검사해서 학년/반 요소 찾기
     */
    findGradeClassSelects() {
        console.log('🔍 모든 select 요소 검사 중...');
        
        const allSelects = document.querySelectorAll('select');
        console.log(`📊 총 ${allSelects.length}개의 select 요소 발견`);
        
        allSelects.forEach((select, index) => {
            const text = select.parentElement?.textContent || '';
            const id = select.id;
            const name = select.name;
            
            console.log(`🔎 Select ${index}: id="${id}", name="${name}", 주변텍스트="${text.trim()}"`);
            
            // 학년 요소 찾기
            if (!this.elements.grade && (
                text.includes('학년') || 
                id.includes('grade') || 
                name.includes('grade')
            )) {
                this.elements.grade = select;
                console.log('🎯 학년 요소 발견!', select);
            }
            
            // 반 요소 찾기  
            if (!this.elements.class && (
                text.includes('반') || 
                id.includes('class') || 
                name.includes('class')
            )) {
                this.elements.class = select;
                console.log('🎯 반 요소 발견!', select);
            }
        });
    }

    // 2. handleCategoryParentClick 함수 추가 (이 함수가 없어서 오류 발생)
handleCategoryParentClick(button) {
    const categoryGroup = button.closest('.category-group');
    const subcategoryList = categoryGroup.querySelector('.subcategory-list');
    
    console.log('🔄 카테고리 토글:', button.textContent.trim());
    
    // 다른 모든 카테고리 그룹들 닫기
    document.querySelectorAll('.category-group').forEach(group => {
        if (group !== categoryGroup) {
            const otherBtn = group.querySelector('.category-parent-btn');
            const otherList = group.querySelector('.subcategory-list');
            if (otherBtn && otherList) {
                otherBtn.classList.remove('expanded');
                otherList.classList.remove('show');
                otherList.classList.add('hidden');
            }
        }
    });
    
    // 현재 카테고리 토글
    if (button.classList.contains('expanded')) {
        // 닫기
        button.classList.remove('expanded');
        subcategoryList.classList.remove('show');
        setTimeout(() => {
            subcategoryList.classList.add('hidden');
        }, 300);
        
        console.log('🔽 카테고리 닫기');
    } else {
        // 열기
        button.classList.add('expanded');
        subcategoryList.classList.remove('hidden');
        setTimeout(() => {
            subcategoryList.classList.add('show');
        }, 10);
        
        console.log('🔼 카테고리 열기');
    }
}

    /**
     * 이벤트 리스너 바인딩 (개선됨)
     */
    bindEvents() {
        console.log('🔗 이벤트 리스너 바인딩 중...');
        
        // 학급 정보 설정
        if (this.elements.setClassBtn) {
            this.elements.setClassBtn.addEventListener('click', this.handleSetClass.bind(this));
            console.log('✅ 학급 설정 버튼 이벤트 바인딩');
        } else {
            console.log('⚠️ 학급 설정 버튼을 찾을 수 없음');
        }
        
        // 학년 선택 이벤트
        if (this.elements.grade) {
            this.elements.grade.addEventListener('change', this.handleGradeChange.bind(this));
            console.log('✅ 학년 선택 이벤트 바인딩');
        } else {
            console.log('⚠️ 학년 선택 요소를 찾을 수 없음');
        }
        
        // 반 선택 이벤트
        if (this.elements.class) {
            this.elements.class.addEventListener('change', this.handleClassChange.bind(this));
            console.log('✅ 반 선택 이벤트 바인딩');
        } else {
            console.log('⚠️ 반 선택 요소를 찾을 수 없음');
        }
        
        // 검색 관련 이벤트
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
            
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
            console.log('✅ 검색 입력 이벤트 바인딩');
        }
        
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.handleSearch(this.elements.searchInput.value);
            });
            console.log('✅ 검색 버튼 이벤트 바인딩');
        }
        
        // 정렬 변경
        if (this.elements.sortBy) {
            this.elements.sortBy.addEventListener('change', this.handleSortChange.bind(this));
            console.log('✅ 정렬 변경 이벤트 바인딩');
        }
        
        // 더보기 버튼
        //if (this.elements.loadMoreBtn) {
          //  this.elements.loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
            //console.log('✅ 더보기 버튼 이벤트 바인딩');
        //}
        
        // 도서 그리드 클릭 (이벤트 위임) - 수정된 버전
        if (this.elements.booksGrid) {
            this.elements.booksGrid.addEventListener('click', this.handleBookGridClick.bind(this));
            console.log('✅ 도서 그리드 이벤트 바인딩');
        }
        
        // 모달 내부 신청하기 버튼 (이벤트 위임)
        if (this.elements.modalContent) {
            this.elements.modalContent.addEventListener('click', this.handleModalClick.bind(this));
            console.log('✅ 모달 이벤트 바인딩');
        }
        
        // 카테고리 이벤트 설정
        this.setupCategoryEvents();
        
        console.log('✅ 모든 이벤트 바인딩 완료');
    }

    /**
     * 보유도서 정보 로드 (경로 수정됨)
     */
    async loadOwnedBooks() {
        try {
            console.log('📚 보유도서 정보 로드 시작...');
            
            // 여러 경로에서 시도
            const possiblePaths = [
                './backend/data/owned-books.json',
                './data/owned-books.json',
                './owned-books.json',
                '/backend/data/owned-books.json'
            ];
            
            let ownedBooks = [];
            let loaded = false;
            
            for (const path of possiblePaths) {
                try {
                    console.log(`🔍 경로 시도: ${path}`);
                    const response = await fetch(path);
                    
                    if (response.ok) {
                        ownedBooks = await response.json();
                        console.log(`✅ 경로 성공: ${path}`);
                        loaded = true;
                        break;
                    }
                } catch (pathError) {
                    console.log(`❌ 경로 실패: ${path}`);
                    continue;
                }
            }
            
            if (loaded) {
                // 전역 변수에 저장
                window.ownedBooks = ownedBooks;
                
                console.log(`✅ 보유도서 ${ownedBooks.length}권 로드 완료`);
                
                // 북 상태 매니저에 보유도서 정보 설정
                if (window.bookStatusManager) {
                    window.bookStatusManager.setOwnedBooks(ownedBooks);
                }
                
                // 보유도서 정보를 즉시 표시하도록 설정
                this.ownedBooksLoaded = true;
            } else {
                console.log('📚 모든 경로에서 owned-books.json 파일을 찾을 수 없음, 빈 배열로 초기화');
                window.ownedBooks = [];
                this.ownedBooksLoaded = true;
            }
        } catch (error) {
            console.error('❌ 보유도서 로드 오류:', error);
            window.ownedBooks = [];
            this.ownedBooksLoaded = true;
        }
    }

    /**
     * 카테고리 이벤트 설정
     */
    setupCategoryEvents() {
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                // 상위 카테고리 펼침/접힘 처리
                if (e.target.closest('.category-parent-btn')) {
                    e.preventDefault();
                    this.handleCategoryParentClick(e.target.closest('.category-parent-btn'));
                    return;
                }
                
                // 카테고리 선택 처리
                if (e.target.closest('.category-btn')) {
                    this.handleCategoryClick(e.target.closest('.category-btn'));
                }
            });
            console.log('✅ 카테고리 이벤트 바인딩');
        }
    }

    /**
     * 초기 데이터 로드
     */
    async loadInitialData() {
        try {
            console.log('🔄 초기 데이터 로드 중...');
            // 베스트셀러 로드 시도
            await this.loadBooksByCategory('bestseller');
        } catch (error) {
            console.error('❌ 초기 데이터 로드 오류:', error);
            
            try {
                // 초기 로드 실패 시 샘플 데이터로 대체
                console.log('🔄 초기 로드 실패로 샘플 데이터 로드');
                await this.loadSampleBooks();
            } catch (fallbackError) {
                console.error('❌ 샘플 데이터 로드도 실패:', fallbackError);
                
                // 최후의 수단: 빈 상태 표시
                try {
                    this.showEmptyState();
                } catch (emptyStateError) {
                    console.error('❌ 빈 상태 표시도 실패:', emptyStateError);
                    
                    // 정말 최후의 수단: 기본 메시지만 표시
                    if (this.elements.booksGrid) {
                        this.elements.booksGrid.innerHTML = `
                            <div class="col-span-full flex items-center justify-center py-12">
                                <div class="text-center text-gray-500">
                                    <div class="text-4xl mb-4">📚</div>
                                    <p>도서 정보를 불러올 수 없습니다.</p>
                                    <p class="text-sm mt-2">페이지를 새로고침해주세요.</p>
                                </div>
                            </div>
                        `;
                    }
                }
            }
        }
    }

    /**
     * 카테고리 초기화
     */
    initializeCategories() {
        // 카테고리는 HTML에 정적으로 정의되어 있으므로 별도 로딩 불필요
        this.currentCategory = null;
        
        // 베스트셀러 버튼을 기본 활성화
        const bestsellerBtn = document.querySelector('[data-category="bestseller"]');
        if (bestsellerBtn) {
            bestsellerBtn.classList.add('active');
        }
    }

    /**
     * 학년 선택 변경 처리 (개선됨)
     */
    async handleGradeChange() {
        if (!this.elements.grade || !this.elements.class) {
            console.log('❌ 학년 또는 반 요소가 없어서 처리할 수 없음');
            return;
        }

        const grade = this.elements.grade.value;
        console.log('🔄 학년 선택 변경:', grade);
        
        // 반 선택 초기화
        this.elements.class.innerHTML = '<option value="">반 선택</option>';
        if (this.elements.teacher) {
            this.elements.teacher.value = '';
        }
        
        // 예산 현황 숨기기
        this.currentClass = null;
        if (this.elements.classInfo) {
            this.elements.classInfo.classList.add('hidden');
        }
        
        if (!grade) {
            console.log('❌ 학년이 선택되지 않음');
            this.showNotification('학년을 선택해주세요.', 'warning');
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
                    this.showNotification(`${grade}학년에 설정된 ${gradeClasses.length}개 반을 불러왔습니다.`, 'info');
                } else {
                    console.log(`⚠️ ${grade}학년에 설정된 반이 없음`);
                    this.showNotification(`${grade}학년에 설정된 반이 없습니다. 관리자 페이지에서 먼저 설정해주세요.`, 'warning');
                }
            } else {
                console.error('❌ 학급 정보 조회 실패:', response.status);
                this.showNotification('학급 정보를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 학급 정보 조회 오류:', error);
            this.showNotification('학급 정보 조회 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 반 선택 변경 처리 (개선됨)
     */
    async handleClassChange() {
        if (!this.elements.grade || !this.elements.class) {
            console.log('❌ 학년 또는 반 요소가 없어서 처리할 수 없음');
            return;
        }

        const grade = this.elements.grade.value;
        const classNum = this.elements.class.value;
        
        if (!grade || !classNum) {
            this.showNotification('학년과 반을 모두 선택해주세요.', 'warning');
            return;
        }
        
        try {
            console.log(`🔄 반 선택 변경: ${grade}학년 ${classNum}반`);
            
            // 서버에서 해당 학급의 담임교사 정보 조회
            const response = await fetch('/api/classes/settings');
            
            if (response.ok) {
                const classSettings = await response.json();
                const classData = classSettings.find(cls => 
                    cls.grade === parseInt(grade) && cls.class === parseInt(classNum)
                );
                
                if (classData && this.elements.teacher) {
                    this.elements.teacher.value = classData.teacher || '';
                    console.log(`✅ 담임교사 정보 로드: ${classData.teacher}`);
                }
            }
        } catch (error) {
            console.error('❌ 담임교사 정보 조회 오류:', error);
        }
    }

    /**
     * 학급 정보 설정 처리
     */
    async handleSetClass() {
        if (!this.elements.grade || !this.elements.class || !this.elements.teacher) {
            this.showNotification('학급 정보 입력 요소를 찾을 수 없습니다.', 'error');
            return;
        }

        const grade = this.elements.grade.value;
        const classNum = this.elements.class.value;
        const teacher = this.elements.teacher.value.trim();

        // 입력 검증
        if (!grade || !classNum || !teacher) {
            this.showNotification('학년, 반, 담임교사는 필수 입력 항목입니다.', 'error');
            return;
        }

        try {
            // 학급 정보 설정 로직 실행
            await this.setClassInfo(grade, classNum, teacher);
        } catch (error) {
            console.error('❌ 학급 설정 오류:', error);
            this.showNotification('학급 설정 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 검색 처리
     */
    async handleSearch(query) {
        if (!query || query.trim().length < 2) {
            this.showNotification('검색어를 2글자 이상 입력해주세요.', 'warning');
            return;
        }

        console.log('🔍 도서 검색:', query);
        
        if (this.isLoading) {
            console.log('⏳ 이미 로딩 중...');
            return;
        }

        this.isLoading = true;
        this.showLoadingState();

        try {
            console.log('🔍 검색 API 객체 확인:', {
                aladinAPI: typeof window.aladinAPI,
                searchManager: typeof window.searchManager
            });
            
            let books = [];
            
            // searchManager가 있으면 사용
            if (window.searchManager && typeof window.searchManager.search === 'function') {
                console.log('📖 searchManager로 검색 시도...');
                
                const options = {
                    maxResults: 50,
                    start: 1,
                    sort: 'SalesPoint'
                };
                
                const result = await window.searchManager.search(query.trim(), options);
                books = result && result.books ? result.books : [];
                
                console.log(`🔍 searchManager 검색 결과: ${books.length}권`);
                
            } else if (window.aladinAPI && typeof window.aladinAPI.callAPI === 'function') {
                console.log('📖 aladinAPI.callAPI로 직접 검색 시도...');
                
                // API 직접 호출로 검색
                const params = {
                    Query: query.trim(),
                    QueryType: 'Title',
                    MaxResults: 50,
                    start: 1,
                    SearchTarget: 'Book',
                    Sort: 'SalesPoint',
                    Version: '20131101'
                };
                
                console.log('🌐 검색 API 파라미터:', params);
                
                const response = await window.aladinAPI.callAPI('ItemSearch.aspx', params);
                
                console.log('📡 검색 API 응답:', response);
                
                if (response && response.item && Array.isArray(response.item)) {
                    books = response.item.map(item => ({
                        title: item.title || '제목 없음',
                        author: item.author || '저자 미상',
                        publisher: item.publisher || '출판사 미상',
                        cover: item.cover || '/images/no-image.png',
                        pubDate: item.pubDate || '0000-00-00',
                        price: parseInt(item.priceStandard) || 0,
                        salePrice: parseInt(item.priceSales) || parseInt(item.priceStandard) || 0,
                        isbn13: item.isbn13 || item.isbn || '',
                        isbn: item.isbn || item.isbn13 || '',
                        description: item.description || '',
                        link: item.link || ''
                    }));
                }
                
                console.log(`📖 직접 검색 결과: ${books.length}권`);
                
            } else {
                console.log('⚠️ 사용할 수 있는 검색 API가 없음, 샘플 검색 결과 생성');
                
                // 검색어와 관련된 샘플 데이터 생성
                books = this.generateSearchSampleBooks(query.trim(), 8);
            }

            console.log(`🔍 최종 검색 결과:`, {
                query: query.trim(),
                totalBooks: books.length,
                firstBook: books[0] ? books[0].title : 'none'
            });

            this.currentBooks = books;
            this.currentPage = 1;
            this.currentCategory = null;

            // 도서 목록 표시
            await this.displayBooks(books, true);

            // 카테고리 활성화 제거
            this.updateCategoryActive(null);

            // 현재 카테고리 표시 업데이트
            if (this.elements.currentCategory) {
                this.elements.currentCategory.textContent = `검색: "${query}"`;
            }

            if (books.length > 0) {
                console.log(`✅ 검색 완료: ${books.length}권`);
                this.showNotification(`"${query}" 검색 결과 ${books.length}권을 찾았습니다.`, 'success');
            } else {
                console.log(`📭 검색 결과 없음: ${query}`);
                this.showNotification(`"${query}" 검색 결과가 없습니다. 다른 검색어를 시도해보세요.`, 'info');
            }

        } catch (error) {
            console.error('❌ 검색 오류:', error);
            console.error('❌ 검색 에러 상세:', {
                message: error.message,
                stack: error.stack,
                query: query.trim()
            });
            
            // 에러 발생 시 샘플 데이터로 대체
            console.log('🔄 에러 발생으로 샘플 검색 결과 생성');
            const sampleBooks = this.generateSearchSampleBooks(query.trim(), 5);
            
            this.currentBooks = sampleBooks;
            this.currentPage = 1;
            this.currentCategory = null;
            
            await this.displayBooks(sampleBooks, true);
            this.updateCategoryActive(null);
            
            if (this.elements.currentCategory) {
                this.elements.currentCategory.textContent = `검색: "${query}" (샘플)`;
            }
            
            this.showNotification(`검색 중 문제가 발생했어요. 샘플 결과를 표시합니다.`, 'warning');
            
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * 검색용 샘플 도서 데이터 생성
     */
    generateSearchSampleBooks(query, count = 8) {
        const sampleBooks = [];
        
        // 검색어와 관련된 도서 제목 생성
        const relatedTitles = [
            `${query}와 함께하는 모험`,
            `${query}의 비밀`,
            `신나는 ${query} 이야기`,
            `${query} 탐험대`,
            `마법의 ${query}`,
            `${query}를 찾아서`,
            `${query}와 친구들`,
            `${query} 대모험`
        ];
        
        const authors = ['김작가', '이소설', '박동화', '최이야기', '정모험', '한마법', '임탐험'];
        const publishers = ['검색출판사', '도서나라', '책벌레출판', '이야기집', '모험출판'];
        
        for (let i = 0; i < count; i++) {
            sampleBooks.push({
                title: relatedTitles[i] || `${query} 관련 도서 ${i + 1}`,
                author: authors[i % authors.length],
                publisher: publishers[i % publishers.length],
                cover: '/images/no-image.png',
                pubDate: `202${3 + (i % 2)}-0${1 + (i % 9)}-15`,
                price: 12000 + (i * 1500),
                salePrice: 12000 + (i * 1500),
                isbn13: `978896${String(2000 + i).padStart(4, '0')}${String(i).padStart(4, '0')}`,
                isbn: `896${String(2000 + i).padStart(4, '0')}${String(i).padStart(4, '0')}`,
                description: `"${query}"와 관련된 흥미진진한 이야기입니다.`,
                link: '#'
            });
        }
        
        return sampleBooks;
    }

    /**
     * 정렬 변경 처리
     */
    async handleSortChange() {
        if (!this.elements.sortBy) return;
        
        const sortBy = this.elements.sortBy.value;
        console.log('🔄 정렬 변경:', sortBy);
        
        if (this.currentBooks && this.currentBooks.length > 0) {
            // 현재 도서 목록 정렬
            const sortedBooks = this.sortBooks(this.currentBooks, sortBy);
            await this.displayBooks(sortedBooks, true);
        }
    }

    /**
     * 도서 정렬
     */
    sortBooks(books, sortBy) {
        const sortedBooks = [...books];
        
        switch (sortBy) {
            case 'title':
                return sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
            case 'author':
                return sortedBooks.sort((a, b) => a.author.localeCompare(b.author));
            case 'pubDate':
                return sortedBooks.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            case 'price':
                return sortedBooks.sort((a, b) => (b.price || 0) - (a.price || 0));
            default:
                return sortedBooks;
        }
    }

    /**
 * handleLoadMore 메서드도 함께 수정 (디버깅 강화)
 */
async handleLoadMore() {
    if (this.isLoading) {
        console.log('⏳ 이미 로딩 중...');
        return;
    }
    
    console.log('📖 더보기 로드 시작...');
    console.log('현재 상태:', {
        currentCategory: this.currentCategory,
        currentPage: this.currentPage,
        currentBooks: this.currentBooks?.length || 0,
        isLoading: this.isLoading
    });
    
    if (!this.currentCategory) {
        console.warn('⚠️ 현재 카테고리가 설정되지 않음');
        this.showNotification('카테고리가 설정되지 않았습니다.', 'warning');
        return;
    }

       // 🔍 API 제한 체크
       const maxPages = 4; // 알라딘 API 제한: 최대 200개 (4페이지 × 50개)
       const nextPage = this.currentPage + 1;
       
       if (nextPage > maxPages) {
           console.log('⚠️ API 제한 도달: 최대 4페이지');
           this.showNotification('최대 200권까지만 조회할 수 있습니다.', 'info');
           return;
       }
       
    
    try {
        // 페이지 증가
        //const nextPage = this.currentPage + 1;
        console.log(`📄 다음 페이지 로드: ${this.currentPage} → ${nextPage}`);
        console.log(`🔢 예상 start 파라미터: ${((nextPage - 1) * 50) + 1}`);
        
        //this.currentPage = nextPage;
        
        // 🔥 핵심: loadBooksByCategory 호출 시 누적 모드로 설정
        await this.loadBooksByCategory(this.currentCategory, nextPage);
        
        //console.log(`✅ 페이지 ${nextPage} 로드 완료`);
        console.log(`✅ 페이지 ${nextPage} 로드 완료, 총 ${this.currentBooks?.length || 0}권`);
        
    } catch (error) {
        console.error('❌ 더보기 로드 오류:', error);
        this.showNotification('도서를 불러오는 중 오류가 발생했습니다.', 'error');
        
        // 페이지 번호 롤백
        //this.currentPage = Math.max(1, this.currentPage - 1);
    }
}

    /**
     * 도서 그리드 클릭 처리 (이벤트 위임) - 수정된 버전
     */
    async handleBookGridClick(e) {
        // 신청하기 버튼 클릭
        if (e.target.closest('.request-btn')) {
            e.preventDefault();
            const button = e.target.closest('.request-btn');
            const bookCard = button.closest('.book-card');
            const isbn = bookCard?.getAttribute('data-isbn');
            
            if (isbn && window.bookRequestSystem) {
                const book = window.bookRequestSystem.currentBooks?.find(b => 
                    (b.isbn13 || b.isbn) === isbn
                );
                
                if (book && typeof window.bookRequestSystem.handleBookApplication === 'function') {
                    window.bookRequestSystem.handleBookApplication(book);
                }
            }
            return;
        }
        
        // 도서 카드 클릭 (모달 열기) - 수정된 버전
        const bookCard = e.target.closest('.book-card');
        if (bookCard && !e.target.closest('.request-btn')) {
            const isbn = bookCard.getAttribute('data-isbn');
            
            if (isbn && window.bookRequestSystem) {
                const book = window.bookRequestSystem.currentBooks?.find(b => 
                    (b.isbn13 || b.isbn) === isbn
                );
                
                if (book) {
                    this.showCompactBookModal(book);
                }
            }
        }
    }

    /**
     * 모달 클릭 처리 (이벤트 위임)
     */
    async handleModalClick(e) {
        // 모달 내부 신청하기 버튼
        if (e.target.closest('.modal-request-btn')) {
            e.preventDefault();
            const button = e.target.closest('.modal-request-btn');
            const isbn = button.getAttribute('data-isbn');
            
            if (isbn) {
                await this.requestBook(isbn);
                this.closeModal(); // 신청 후 모달 닫기
            }
        }
    }

    /**
     * 카테고리 클릭 처리
     */
    async handleCategoryClick(categoryBtn) {
        const categoryId = categoryBtn.getAttribute('data-category');
        if (!categoryId) return;
        
        console.log('📂 카테고리 선택:', categoryId);
        
        // 현재 카테고리와 동일하면 무시
        if (this.currentCategory === categoryId) {
            console.log('이미 선택된 카테고리');
            return;
        }
        
        // 카테고리별 도서 로드
        await this.loadBooksByCategory(categoryId);
        
        // 현재 카테고리 표시 업데이트
        if (this.elements.currentCategory) {
            this.elements.currentCategory.textContent = categoryBtn.textContent.trim();
        }
    }

    /**
     * 카테고리 토글 처리
     */
    handleCategoryToggle(toggleBtn) {
        const parentCategory = toggleBtn.closest('.category-parent');
        if (!parentCategory) return;
        
        const childList = parentCategory.querySelector('.category-children');
        if (!childList) return;
        
        const isExpanded = !childList.classList.contains('hidden');
        
        if (isExpanded) {
            childList.classList.add('hidden');
            toggleBtn.querySelector('i').className = 'fas fa-chevron-right';
        } else {
            childList.classList.remove('hidden');
            toggleBtn.querySelector('i').className = 'fas fa-chevron-down';
        }
    }

    /**
     * 학급 정보 설정
     */
    async setClassInfo(grade, classNum, teacher) {
        // 학급 정보를 세션스토리지에 저장하고 UI 업데이트하는 로직
        const classId = `${grade}-${classNum}`;
        
        // 인증 정보 저장 (24시간 유효)
        const authInfo = {
            classId: classId,
            grade: parseInt(grade),
            class: parseInt(classNum),
            teacher: teacher,
            expiry: Date.now() + (24 * 60 * 60 * 1000) // 24시간
        };
        
        sessionStorage.setItem('classAuth', JSON.stringify(authInfo));
        
        // UI 업데이트
        this.currentClass = authInfo;
        
        if (this.elements.displayClass) {
            this.elements.displayClass.textContent = `${grade}학년 ${classNum}반`;
        }
        if (this.elements.displayTeacher) {
            this.elements.displayTeacher.textContent = teacher;
        }
        if (this.elements.classInfo) {
            this.elements.classInfo.classList.remove('hidden');
        }
        
        // 예산 정보 로드
        await this.loadBudgetInfo(classId);
        
        this.showNotification(`${grade}학년 ${classNum}반으로 설정되었습니다.`, 'success');
    }

    /**
     * 예산 정보 로드
     */
    async loadBudgetInfo(classId) {
        // 예산 정보를 로드하고 표시하는 로직
        const defaultBudget = 500000; // 기본 예산 50만원
        const appliedBooks = JSON.parse(localStorage.getItem(`appliedBooks_${classId}`) || '[]');
        const usedBudget = appliedBooks.reduce((sum, book) => sum + (book.price || 0), 0);
        
        if (this.elements.usedBudget) {
            this.elements.usedBudget.textContent = usedBudget.toLocaleString();
        }
        if (this.elements.totalBudget) {
            this.elements.totalBudget.textContent = defaultBudget.toLocaleString();
        }
        if (this.elements.budgetBar) {
            const percentage = (usedBudget / defaultBudget) * 100;
            this.elements.budgetBar.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    /**
     * 도서 신청
     */
    async requestBook(isbn) {
        // 인증 확인
        const authInfo = JSON.parse(sessionStorage.getItem('classAuth') || 'null');
        if (!authInfo || authInfo.expiry < Date.now()) {
            this.showNotification('학급 인증이 필요합니다.', 'warning');
            return;
        }

        // 도서 찾기
        const book = this.currentBooks?.find(b => (b.isbn13 || b.isbn) === isbn);
        if (!book) {
            this.showNotification('도서 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        // 중복 신청 확인
        const appliedBooks = JSON.parse(localStorage.getItem(`appliedBooks_${authInfo.classId}`) || '[]');
        const isDuplicate = appliedBooks.some(appliedBook => 
            (appliedBook.isbn13 || appliedBook.isbn) === isbn
        );

        if (isDuplicate) {
            this.showNotification('이미 신청한 도서입니다.', 'warning');
            return;
        }

        // 예산 확인
        const defaultBudget = 500000;
        const currentUsed = appliedBooks.reduce((sum, b) => sum + (b.price || 0), 0);
        const newTotal = currentUsed + (book.price || 0);

        if (newTotal > defaultBudget) {
            this.showNotification('예산을 초과합니다.', 'error');
            return;
        }

        // 신청 정보 추가
        const requestInfo = {
            ...book,
            requestedAt: new Date().toISOString(),
            classId: authInfo.classId,
            grade: authInfo.grade,
            class: authInfo.class,
            teacher: authInfo.teacher
        };

        appliedBooks.push(requestInfo);
        localStorage.setItem(`appliedBooks_${authInfo.classId}`, JSON.stringify(appliedBooks));

        // 예산 정보 업데이트
        await this.loadBudgetInfo(authInfo.classId);

        // 도서 목록 새로고침 (상태 업데이트)
        await this.displayBooks(this.currentBooks, true);

        this.showNotification('도서 신청이 완료되었습니다.', 'success');
    }

    /**
     * 컴팩트한 도서 모달 표시 - 완전한 버전
     */
    showCompactBookModal(book) {
        if (!this.elements.bookModal || !this.elements.modalContent) {
            console.error('모달 요소를 찾을 수 없음');
            return;
        }

        const isbn = book.isbn13 || book.isbn;
        const aladinDirectUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${isbn}`;
        
        const priceInfo = book.salePrice ? 
            `${book.salePrice.toLocaleString()}원${book.price && book.price !== book.salePrice ? ` (정가 ${book.price.toLocaleString()}원)` : ''}` :
            book.price ? `${book.price.toLocaleString()}원` : '가격 정보 없음';

        this.elements.modalContent.innerHTML = `
            <div class="fixed inset-0 flex items-center justify-center p-4 z-50" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;">
                <!-- 백그라운드 오버레이 -->
                <div class="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onclick="window.bookRequestSystem.closeModal()"></div>
                
                <!-- 모달 컨테이너 -->
                <div class="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden" style="box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);">
                    
                    <!-- 헤더 -->
                    <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h2 class="text-lg font-semibold text-gray-900">도서 정보</h2>
                        <button type="button" id="modalCloseBtn"
                                class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- 본문 -->
                    <div class="p-6">
                        <div class="flex gap-5">
                            
                            <!-- 도서 이미지 -->
                            <div class="flex-shrink-0">
                                <img src="${book.cover || '/images/placeholder.jpg'}" 
                                     alt="${book.title}" 
                                     class="w-32 h-44 object-cover rounded-lg shadow-md"
                                     onerror="this.src='/images/placeholder.jpg'">
                            </div>
                            
                            <!-- 도서 정보 -->
                            <div class="flex-1 min-w-0">
                                
                                <!-- 제목 -->
                                <h1 class="text-xl font-bold text-gray-900 mb-4 leading-tight">
                                    ${book.title}
                                </h1>
                                
                                <!-- 기본 정보 -->
                                <div class="space-y-2 mb-5 text-sm">
                                    <div class="flex">
                                        <span class="text-gray-500 w-16">저자</span>
                                        <span class="text-gray-900 font-medium">${book.author || '저자 미상'}</span>
                                    </div>
                                    <div class="flex">
                                        <span class="text-gray-500 w-16">출판사</span>
                                        <span class="text-gray-700">${book.publisher || '출판사 미상'}</span>
                                    </div>
                                    ${book.pubDate ? `
                                    <div class="flex">
                                        <span class="text-gray-500 w-16">출간일</span>
                                        <span class="text-gray-700">${book.pubDate}</span>
                                    </div>
                                    ` : ''}
                                    <div class="flex">
                                        <span class="text-gray-500 w-16">가격</span>
                                        <span class="text-gray-900 font-semibold">${priceInfo}</span>
                                    </div>
                                </div>
                                
                                <!-- 액션 버튼들 -->
                                <div class="flex gap-2">
                                    <button type="button" data-isbn="${book.isbn13 || book.isbn}"
                                            class="modal-request-btn flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                        </svg>
                                        신청하기
                                    </button>
                                    
                                    <a href="${aladinDirectUrl}" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       class="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                        </svg>
                                        상세보기
                                    </a>
                                </div>
                                
                            </div>
                        </div>
                        
                        ${book.description ? `
                            <!-- 책 소개 -->
                            <div class="mt-5 pt-5 border-t border-gray-100">
                                <h3 class="text-sm font-semibold text-gray-900 mb-2">책 소개</h3>
                                <p class="text-gray-700 text-sm leading-relaxed">
                                    ${book.description}
                                </p>
                            </div>
                        ` : ''}
                        
                    </div>
                </div>
            </div>
        `;

        // 모달 표시
        this.elements.bookModal.classList.remove('hidden');
        this.elements.bookModal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // 이벤트 리스너 추가
        setTimeout(() => {
            const closeBtn = document.getElementById('modalCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                });
            }

            const requestBtn = document.querySelector('.modal-request-btn');
            if (requestBtn) {
                requestBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isbn = requestBtn.getAttribute('data-isbn');
                    this.requestBook(isbn);
                    this.closeModal();
                });
            }
        }, 10);
    }

    /**
     * 모달 닫기
     */
    closeModal() {
        if (this.elements.bookModal) {
            this.elements.bookModal.classList.add('hidden');
            this.elements.bookModal.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
    }

    /**
     * 도서 상태 확인 (보유중/신청된 도서 체크) - 인증 없이도 표시하도록 수정
     */
    async checkBookStatus(book) {
        try {
            // ISBN 정규화
            const isbn = book.isbn13 || book.isbn || '';
            const normalizedIsbn = isbn.replace(/[^0-9]/g, '');
            
            if (!normalizedIsbn) {
                return { isOwned: false, isApplied: false };
            }
            
            // 1. 보유도서 체크 (인증 없이 항상 표시)
            let isOwned = false;
            if (window.ownedBooks && Array.isArray(window.ownedBooks)) {
                isOwned = window.ownedBooks.some(ownedBook => {
                    const ownedIsbn = (ownedBook.isbn || '').replace(/[^0-9]/g, '');
                    return ownedIsbn === normalizedIsbn;
                });
            }
            
            // 2. 신청도서 체크 (세션스토리지 기반)
            let isApplied = false;
            try {
                const authInfo = JSON.parse(sessionStorage.getItem('classAuth') || 'null');
                if (authInfo && authInfo.classId) {
                    const appliedBooks = JSON.parse(localStorage.getItem(`appliedBooks_${authInfo.classId}`) || '[]');
                    isApplied = appliedBooks.some(appliedBook => {
                        const appliedIsbn = (appliedBook.isbn13 || appliedBook.isbn || '').replace(/[^0-9]/g, '');
                        return appliedIsbn === normalizedIsbn;
                    });
                }
            } catch (error) {
                console.error('신청도서 체크 오류:', error);
            }
            
            return { isOwned, isApplied };
            
        } catch (error) {
            console.error('도서 상태 확인 오류:', error);
            return { isOwned: false, isApplied: false };
        }
    }

    /**
 * 로드 더 버튼 업데이트 - 페이지네이션 버그 수정 버전
 * main.js의 BookRequestSystem 클래스 내부 메서드
 */
updateLoadMoreButton() {
    console.log('🔄 로드 더 버튼 업데이트...');
    
    const currentBooks = this.currentBooks?.length || 0;
    const totalAvailable = 1000;
    
    // 🔥 더 철저한 기존 버튼 제거
    const selectorsToRemove = [
        '.load-more-btn', 
        '.load-more-section', 
        '#loadMoreBtn',
        '#load-more-btn',
        '[data-action="load-more"]',
        'button[onclick*="loadMore"]',
        'button[onclick*="handleLoadMore"]'
    ];
    
    selectorsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            console.log(`🗑️ 기존 버튼 제거: ${selector}`);
            element.remove();
        });
    });
    
    // 🎯 도서 그리드 정확히 찾기
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) {
        console.warn('❌ booksGrid를 찾을 수 없음');
        return;
    }
    
    console.log('📍 도서 그리드 찾음:', booksGrid);
    
    // 버튼 섹션 생성
    const loadMoreSection = document.createElement('div');
    loadMoreSection.className = 'load-more-section w-full mt-8';
    loadMoreSection.setAttribute('data-created-by', 'main-js'); // 추적용 속성
    loadMoreSection.style.cssText = `
        margin-top: 2rem; 
        text-align: center; 
        padding: 2rem 1rem; 
        border-top: 1px solid #e5e7eb; 
        background: linear-gradient(to bottom, #f9fafb, #ffffff);
        border-radius: 0 0 12px 12px;
    `;
    
    // 버튼 생성
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1';
    loadMoreBtn.setAttribute('data-created-by', 'main-js'); // 추적용 속성
    
    // 🎯 올바른 이벤트 핸들러 바인딩
    loadMoreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔄 올바른 더보기 버튼 클릭!');
        console.log('현재 상태:', {
            currentCategory: this.currentCategory,
            currentPage: this.currentPage,
            currentBooks: this.currentBooks?.length || 0
        });
        
        // handleLoadMore 메서드 호출
        await this.handleLoadMore();
    });
    
    // 진행률 표시
    const progressInfo = document.createElement('div');
    progressInfo.className = 'progress-info mt-3 text-sm text-gray-600';
    
    // 버튼 상태 설정
    const remainingBooks = totalAvailable - currentBooks;
    
    if (remainingBooks > 0) {
        loadMoreBtn.innerHTML = `
            <i class="fas fa-plus mr-2"></i>
            더 많은 도서 보기 (${Math.min(50, remainingBooks)}권 더)
        `;
        loadMoreBtn.disabled = false;
        
        progressInfo.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <span>${currentBooks} / ${totalAvailable}권 표시 중</span>
                <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 transition-all duration-300" style="width: ${(currentBooks / totalAvailable) * 100}%"></div>
                </div>
            </div>
        `;
    } else {
        loadMoreBtn.innerHTML = `<i class="fas fa-check mr-2"></i>모든 도서 로드 완료`;
        loadMoreBtn.disabled = true;
        loadMoreBtn.className += ' opacity-60 cursor-not-allowed';
        
        progressInfo.innerHTML = `
            <span class="text-green-600 font-medium">
                <i class="fas fa-check-circle mr-1"></i>
                ${currentBooks}권 모두 표시됨
            </span>
        `;
    }
    
    // 조립
    loadMoreSection.appendChild(loadMoreBtn);
    loadMoreSection.appendChild(progressInfo);
    
    // 🎯 핵심: 도서 그리드 바로 다음에 삽입
    booksGrid.parentNode.insertBefore(loadMoreSection, booksGrid.nextSibling);
    
    console.log(`✅ 더보기 버튼 도서 목록 아래 배치 완료: ${currentBooks}/${totalAvailable}권`);
    console.log(`🎯 이벤트 핸들러 바인딩 완료 - currentPage: ${this.currentPage}`);
}

    /**
     * 카테고리별 도서 로드 - 50권씩 누적 로딩 버전
     */
    async loadBooksByCategory(categoryId, page = 1) {
        console.log(`📚 카테고리별 도서 로드: ${categoryId}, 페이지: ${page}`);
        
        if (this.isLoading) {
            console.log('⏳ 이미 로딩 중...');
            return;
        }

        this.isLoading = true;
        this.currentPage = page;
        this.currentCategory = categoryId;

        try {
            // 로딩 상태 표시
            if (page === 1) {
                this.showLoadingState();
            }
            
            if (this.elements.emptyState) {
                this.elements.emptyState.classList.add('hidden');
            }

            let results = null;

            // 베스트셀러 처리 (50권씩)
            if (categoryId === 'bestseller') {
                console.log(`📊 베스트셀러 API 호출 - 페이지: ${page}`);
                
                try {
                    // 🔥 start 파라미터 계산 검증
                    const startIndex = ((page - 1) * 50) + 1;
                    console.log(`🔢 페이지 계산: page=${page}, start=${startIndex}`);
                    
                    const bestsellerParams = new URLSearchParams({
                        endpoint: 'ItemList.aspx',
                        ttbkey: 'ttbgujeongmo2105001',
                        QueryType: 'Bestseller',
                        MaxResults: 50, // ✅ 50권씩
                        start: startIndex, // ✅ 올바른 계산
                        SearchTarget: 'Book',
                        output: 'JS',
                        Cover: 'MidBig',
                        Version: '20131101'
                    });
                    
                    console.log(`🌐 API 파라미터:`, {
                        page: page,
                        start: startIndex,
                        maxResults: 50,
                        category: categoryId,
                        queryType: 'Bestseller'
                    });
                    
                    const response = await fetch(`/api/books/aladin-proxy?${bestsellerParams.toString()}`);
                    
                    // 응답 확인
                    console.log(`📡 API 응답 상태: ${response.status}`);
                    
                    const result = await response.json();
                    
                    console.log(`📊 API 응답 데이터:`, {
                        success: response.ok,
                        totalResults: result?.totalResults || 0,
                        itemCount: result?.item?.length || 0,
                        firstTitle: result?.item?.[0]?.title || 'N/A'
                    });
                    
                    // ✅ 나머지 처리 로직 (기존 코드와 동일)
                    if (result?.item?.length > 0) {
                        results = {
                            books: result.item.map(item => ({
                                isbn: item.isbn13 || item.isbn,
                                isbn13: item.isbn13,
                                title: item.title,
                                author: item.author,
                                publisher: item.publisher,
                                price: item.priceStandard || 0,
                                salePrice: item.priceSales || item.priceStandard || 0,
                                cover: item.cover,
                                pubDate: item.pubDate || '',
                                description: item.description || '', // description 필드 포함
                                link: item.link || '',
                                discount: item.discount || 0,
                                isOwned: false,
                                isApplied: false,
                                canApply: true,
                                statusClass: 'bg-blue-500 hover:bg-blue-600 text-white',
                                statusText: '신청하기'
                            })),
                            totalResults: result.totalResults || 1000,
                            startIndex: result.startIndex || 1,
                            itemsPerPage: 50
                        };
                        console.log(`✅ 베스트셀러 ${results.books.length}권 로드 성공!`);
                    }
                } catch (error) {
                    console.error('❌ 베스트셀러 API 오류:', error);
                }
            }
            
            // 다른 카테고리 처리
            else {
                console.log(`📊 ${categoryId} 카테고리 베스트셀러 API 호출...`); // ✅ 로그 개선
                
                try {
                    // 🔥 핵심 수정: start 파라미터 계산 검증
                    const startIndex = ((page - 1) * 50) + 1;
                    console.log(`🔢 페이지 계산: page=${page}, start=${startIndex}`);
                    
                    const categoryParams = new URLSearchParams({
                        endpoint: 'ItemList.aspx',
                        ttbkey: 'ttbgujeongmo2105001',
                        QueryType: 'Bestseller', // ✅ 핵심 수정: ItemNewAll → Bestseller
                        MaxResults: 50,
                        start: startIndex, // ✅ 변수로 분리하여 검증 가능
                        SearchTarget: 'Book',
                        CategoryId: categoryId,
                        output: 'JS',
                        Cover: 'MidBig',
                        Version: '20131101'
                    });
                    
                    // ✅ 추가 로깅: API 파라미터 확인
                    console.log(`🌐 API 파라미터:`, {
                        page: page,
                        start: startIndex,
                        maxResults: 50,
                        category: categoryId,
                        queryType: 'Bestseller'
                    });
                    
                    const response = await fetch(`/api/books/aladin-proxy?${categoryParams.toString()}`);
                    
                    // ✅ 추가 로깅: API 응답 상태
                    console.log(`📡 API 응답 상태: ${response.status}`);
                    
                    const result = await response.json();
                    
                    // ✅ 추가 로깅: API 응답 데이터
                    console.log(`📊 API 응답 데이터:`, {
                        success: response.ok,
                        totalResults: result?.totalResults || 0,
                        itemCount: result?.item?.length || 0,
                        firstTitle: result?.item?.[0]?.title || 'N/A'
                    });
                    
                    if (result?.item?.length > 0) {
                        results = {
                            books: result.item.map(item => ({
                                isbn: item.isbn13 || item.isbn,
                                isbn13: item.isbn13,
                                title: item.title,
                                author: item.author,
                                publisher: item.publisher,
                                price: item.priceStandard || 0,
                                salePrice: item.priceSales || item.priceStandard || 0,
                                cover: item.cover,
                                pubDate: item.pubDate || '',
                                description: item.description || '',
                                link: item.link || '',
                                discount: item.discount || 0,
                                isOwned: false,
                                isApplied: false,
                                canApply: true,
                                statusClass: 'bg-blue-500 hover:bg-blue-600 text-white',
                                statusText: '신청하기'
                            })),
                            totalResults: result.totalResults || 100,
                            startIndex: result.startIndex || 1,
                            itemsPerPage: 50
                        };
                        console.log(`✅ ${categoryId} ${results.books.length}권 로드 성공!`);
                        console.log(`📚 첫 번째 도서: ${results.books[0]?.title || 'N/A'}`); // ✅ 추가 검증
                    }
                } catch (error) {
                    console.error(`❌ ${categoryId} API 오류:`, error);
                }
            }

            // 결과 처리 - 누적 로딩
            if (results && results.books && results.books.length > 0) {
                 // 🔍 디버깅: API 응답 상세 분석
    console.log(`🔍 API 응답 분석:`, {
        페이지: page,
        요청한_start: ((page - 1) * 50) + 1,
        받은_도서수: results.books.length,
        첫번째_도서: results.books[0]?.title || 'N/A',
        마지막_도서: results.books[results.books.length - 1]?.title || 'N/A',
        전체_titles: results.books.map(book => book.title).slice(0, 5) // 처음 5개 제목
    });

    // 🔍 기존 도서와 중복 체크
    if (page > 1 && this.currentBooks) {
        const existingTitles = new Set(this.currentBooks.map(book => book.title));
        const duplicateCount = results.books.filter(book => existingTitles.has(book.title)).length;
        
        console.log(`🔍 중복 체크:`, {
            기존_도서수: this.currentBooks.length,
            새_도서수: results.books.length,
            중복_도서수: duplicateCount,
            실제_새_도서수: results.books.length - duplicateCount
        });
        
        if (duplicateCount > 0) {
            console.warn(`⚠️ 중복 발견! ${duplicateCount}개 도서가 이미 존재합니다.`);
        }
    }

                // 도서 상태 업데이트
                if (window.bookStatusManager && typeof window.bookStatusManager.updateBooksStatus === 'function') {
                    results.books = await window.bookStatusManager.updateBooksStatus(results.books);
                }

                // 페이지 처리 - 누적 로딩
                if (page === 1) {
                    // 첫 페이지: 새로 시작
                    this.currentBooks = results.books;
                    console.log(`📄 첫 페이지 로드: ${this.currentBooks.length}권`);
                    this.displayBooks(this.currentBooks, true);
                } else {
                    // 추가 페이지: 기존에 누적
                    //const previousCount = this.currentBooks ? this.currentBooks.length : 0;
                    //this.currentBooks = [...(this.currentBooks || []), ...results.books];
                    
                    const existingIsbns = new Set(this.currentBooks.map(book => book.isbn13 || book.isbn));
                    const newBooks = results.books.filter(book => {
                        const isbn = book.isbn13 || book.isbn;
                        return !existingIsbns.has(isbn);
        });
        
        console.log(`🔄 중복 제거 결과:`, {
            API에서_받은_도서: results.books.length,
            중복_제거_후: newBooks.length,
            제거된_중복: results.books.length - newBooks.length
        });
        
        if (newBooks.length === 0) {
            console.warn(`⚠️ 새로운 도서가 없습니다. API가 중복 데이터를 반환했을 가능성이 높습니다.`);
            this.showNotification('더 이상 새로운 도서가 없습니다.', 'info');
            return;
        }

        const previousCount = this.currentBooks.length;
        this.currentBooks = [...this.currentBooks, ...newBooks];
        
        console.log(`📚 누적 결과:`, {
            이전_도서수: previousCount,
            추가된_도서수: newBooks.length,
            총_도서수: this.currentBooks.length
        });

                    this.displayBooks(this.currentBooks, false);
                    
                    // 새로 추가된 도서 영역으로 스크롤
                    setTimeout(() => {
                        const bookGrid = document.querySelector('#booksGrid');
                        
                        if (bookGrid) {
                            const bookCards = bookGrid.querySelectorAll('.book-card');
                            
                            if (bookCards.length > previousCount) {
                                const targetCard = bookCards[previousCount];
                                
                                if (targetCard) {
                                    // 살짝 위쪽으로 여백을 두고 스크롤
                                    const offset = 100;
                                    const elementPosition = targetCard.offsetTop;
                                    const offsetPosition = elementPosition - offset;
                                    
                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: 'smooth'
                                    });
                                    
                                    console.log(`✅ 스크롤 완료: ${previousCount}번째 도서로 이동`);
                                }
                            }
                        } else {
                            console.log('❌ booksGrid를 찾을 수 없습니다');
                        }
                    }, 200);
                }

                this.currentPage = page;

                // UI 업데이트
                try {
                    this.updateLoadMoreButton();
                    this.updateCategoryActive(categoryId);
                } catch (methodError) {
                    console.warn('일부 업데이트 메서드 오류 (무시 가능):', methodError.message);
                }

                console.log(`✅ 도서 로드 완료: ${results.books.length}권 (총 ${this.currentBooks.length}권, 페이지 ${page})`);
                
            } else {
                // API 실패 시 샘플 데이터 생성
                console.log('❌ API 호출 실패, 샘플 데이터 생성');
                
                const sampleBooks = [
                    {
                        isbn: '9788937460784',
                        title: '어린왕자',
                        author: '앙투안 드 생텍쥐페리',
                        publisher: '민음사',
                        price: 8000,
                        salePrice: 8000,
                        cover: '',
                        description: '사랑과 우정, 삶의 의미에 대한 깊이 있는 이야기',
                        isOwned: false,
                        isApplied: false,
                        canApply: true,
                        statusClass: 'bg-blue-500 hover:bg-blue-600 text-white',
                        statusText: '신청하기'
                    },
                    {
                        isbn: '9788954429108',
                        title: '해리포터와 마법사의 돌',
                        author: 'J.K. 롤링',
                        publisher: '문학수첩',
                        price: 12000,
                        salePrice: 12000,
                        cover: '',
                        description: '마법의 세계로 떠나는 신비한 모험',
                        isOwned: false,
                        isApplied: false,
                        canApply: true,
                        statusClass: 'bg-blue-500 hover:bg-blue-600 text-white',
                        statusText: '신청하기'
                    }
                ];

                console.log(`📚 최종 도서 데이터: ${sampleBooks.length}권 (샘플 데이터)`);
                
                this.currentBooks = sampleBooks;
                this.displayBooks(this.currentBooks, true);
                
                try {
                    this.updateCategoryActive(categoryId);
                } catch (methodError) {
                    console.warn('카테고리 버튼 업데이트 오류 (무시 가능):', methodError.message);
                }
            }

        } catch (error) {
            console.error('❌ 카테고리 로드 오류:', error);
            
            // 안전한 빈 상태 표시
            try {
                this.showEmptyState();
            } catch (emptyStateError) {
                console.warn('빈 상태 표시 오류:', emptyStateError.message);
            }
            
            this.showNotification('도서 목록을 불러오는 중 오류가 발생했습니다.', 'error');

        } finally {
            this.isLoading = false;
            if (page === 1) {
                this.hideLoadingState();
            }
        }
    }


 
    /**
     * 기본 도서 아이콘 반환
     */
    getDefaultBookIcon() {
        return `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160">
                <defs>
                    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="120" height="160" fill="url(#bookGrad)" stroke="#dee2e6" stroke-width="2" rx="8"/>
                <rect x="20" y="25" width="80" height="4" fill="#6c757d" rx="2"/>
                <rect x="20" y="35" width="70" height="3" fill="#adb5bd" rx="1.5"/>
                <rect x="20" y="43" width="60" height="3" fill="#adb5bd" rx="1.5"/>
                <circle cx="60" cy="80" r="18" fill="#e9ecef" stroke="#ced4da" stroke-width="2"/>
                <rect x="48" y="72" width="24" height="16" fill="#6c757d" rx="3"/>
                <text x="60" y="125" text-anchor="middle" font-family="system-ui" font-size="12" fill="#495057" font-weight="500">도서</text>
            </svg>
        `)}`;
    }

    /**
     * 샘플 도서 데이터 생성 (API 실패시 대체용)
     */
    generateSampleBooks(categoryId, count = 10) {
        const sampleBooks = [];
        
        const categories = {
            bestseller: [
                '어린왕자', '해리포터와 마법사의 돌', '이상한 나라의 앨리스', '피노키오의 모험',
                '신데렐라', '백설공주', '헨젤과 그레텔', '잭과 콩나무', '빨간모자'
            ],
            new: [
                '최신 과학 탐험', '미래의 우주 여행', '인공지능과 친구들', '로봇과 함께하는 하루',
                '바다 속 신비한 여행', '숲 속의 마법사', '시간 여행자의 모험'
            ],
            default: [
                '재미있는 수학 이야기', '신나는 과학 실험', '세계 여행 안내서', '동물들의 신기한 세상',
                '우리나라 전래동화', '세계 명작 동화집', '어린이 백과사전'
            ]
        };
        
        const bookTitles = categories[categoryId] || categories.default;
        const authors = ['김철수', '박영희', '이민수', '최지영', '정우진', '한소영', '임동혁'];
        const publishers = ['어린이책방', '동화나라', '학습출판사', '교육문고', '꿈나무출판'];
        
        for (let i = 0; i < Math.min(count, bookTitles.length); i++) {
            sampleBooks.push({
                title: bookTitles[i] || `도서 ${i + 1}`,
                author: authors[i % authors.length],
                publisher: publishers[i % publishers.length],
                cover: '/images/no-image.png',
                pubDate: `202${3 + (i % 2)}-0${1 + (i % 9)}-15`,
                price: 10000 + (i * 1000),
                salePrice: 10000 + (i * 1000),
                isbn13: `978895${String(1000 + i).padStart(4, '0')}${String(i).padStart(4, '0')}`,
                isbn: `895${String(1000 + i).padStart(4, '0')}${String(i).padStart(4, '0')}`,
                description: `${bookTitles[i] || `도서 ${i + 1}`}에 대한 설명입니다.`,
                link: '#'
            });
        }
        
        return sampleBooks;
    }

    /**
 * 도서 목록 표시 - 중복 카드 생성 방지 버전
 */
displayBooks(books, clearPrevious = true) {
    try {
        console.log(`📋 도서 목록 표시: ${books.length}권, 초기화: ${clearPrevious}`);
        
        if (!books || books.length === 0) {
            console.log('📚 빈 도서 목록, 빈 상태 표시');
            this.showEmptyState();
            return;
        }

        // DOM 그리드 요소 확인
        if (!this.elements.booksGrid) {
            console.error('❌ 도서 그리드 요소를 찾을 수 없음');
            this.showEmptyState();
            return;
        }

        // 빈 상태 숨기기
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.add('hidden');
        }

        if (clearPrevious) {
            // 🔥 첫 페이지: 전체 초기화 후 모든 카드 생성
            console.log('🧹 전체 초기화 후 모든 카드 생성');
            this.elements.booksGrid.innerHTML = '';
            
            console.log('📚 도서 카드 생성 시작...');
            const cardsHtml = books.map((book, index) => {
                try {
                    return this.createBookCard(book);
                } catch (error) {
                    console.error(`❌ 도서 카드 생성 실패 (${index + 1}):`, error, book);
                    return this.createErrorCard(book);
                }
            }).join('');

            this.elements.booksGrid.innerHTML = cardsHtml;
            console.log(`✅ 전체 도서 카드 생성 완료: ${books.length}개`);
            
        } else {
            // 🎯 추가 페이지: 새로운 카드만 생성 후 추가
            const currentCardCount = this.elements.booksGrid.querySelectorAll('.book-card').length;
            const newBooks = books.slice(currentCardCount); // 기존 카드 수 이후의 도서들만
            
            console.log(`➕ 새로운 카드만 추가: 기존 ${currentCardCount}개, 새로 추가 ${newBooks.length}개`);
            
            if (newBooks.length === 0) {
                console.log('⚠️ 추가할 새로운 도서가 없음');
                return;
            }
            
            console.log('📚 새 도서 카드 생성 시작...');
            const newCardsHtml = newBooks.map((book, index) => {
                try {
                    return this.createBookCard(book);
                } catch (error) {
                    console.error(`❌ 새 도서 카드 생성 실패 (${currentCardCount + index + 1}):`, error, book);
                    return this.createErrorCard(book);
                }
            }).join('');

            // 🔥 핵심: 기존 카드 뒤에 새 카드만 추가
            this.elements.booksGrid.insertAdjacentHTML('beforeend', newCardsHtml);
            console.log(`✅ 새 도서 카드 추가 완료: ${newBooks.length}개 (총 ${this.elements.booksGrid.querySelectorAll('.book-card').length}개)`);
        }

        // 통계 업데이트 (전체 도서 수로)
        this.updateBookCount(books.length);

        console.log('📊 도서 목록 표시 완료');

    } catch (error) {
        console.error('❌ 도서 목록 표시 오류:', error);
        this.showEmptyState();
    }
}


    /**
     * 도서 카드 HTML 생성 - description 포함
     */
    createBookCard(book) {
        const discountPercent = book.discount > 0 ? Math.round(book.discount) : 0;
        const hasDiscount = discountPercent > 0;
        
        // SVG 기본 이미지
        const defaultImageSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'%3E%3Crect width='120' height='160' fill='%23f8f9fa' stroke='%23dee2e6' stroke-width='2' rx='8'/%3E%3Ccircle cx='60' cy='70' r='20' fill='%236b7280'/%3E%3Crect x='20' y='100' width='80' height='8' fill='%236b7280' rx='4'/%3E%3Crect x='30' y='120' width='60' height='6' fill='%239ca3af' rx='3'/%3E%3Ctext x='60' y='145' text-anchor='middle' font-family='system-ui' font-size='10' fill='%236b7280'%3E%EB%8F%84%EC%84%9C%3C/text%3E%3C/svg%3E";
        
        return `
            <div class="book-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative cursor-pointer" data-isbn="${book.isbn}">
                ${book.isOwned ? '<div class="status-overlay owned">보유중</div>' : ''}
                ${book.isApplied ? '<div class="status-overlay applied">신청완료</div>' : ''}
                
                <div class="relative">
                    ${hasDiscount ? `<div class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">${discountPercent}% 할인</div>` : ''}
                    
                    <div class="aspect-w-3 aspect-h-4 mb-3">
                        <img src="${book.cover && book.cover !== '/images/no-image.png' ? book.cover : defaultImageSvg}" 
                             alt="${book.title || '도서'}" 
                             class="w-full h-48 object-cover rounded-t-lg"
                             onerror="this.src='${defaultImageSvg}';">
                    </div>
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-sm text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]" title="${book.title || ''}">${book.title || '제목 없음'}</h3>
                    <p class="text-xs text-gray-600 mb-2 line-clamp-1" title="${book.author || ''}">${book.author || '저자 미상'}</p>
                    <p class="text-xs text-gray-500 mb-3 line-clamp-1" title="${book.publisher || ''}">${book.publisher || '출판사 미상'}</p>
                    
                    <div class="flex items-center justify-between mb-3">
                        ${hasDiscount ? `
                            <div class="text-right">
                                <div class="text-sm font-bold text-red-600">${(book.salePrice || 0).toLocaleString()}원</div>
                                <div class="text-xs text-gray-400 line-through">${(book.price || 0).toLocaleString()}원</div>
                            </div>
                        ` : `
                            <div class="text-sm font-bold text-gray-700">${(book.price || 0).toLocaleString()}원</div>
                        `}
                    </div>
                    
                    <button 
                        class="request-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${book.statusClass || 'bg-blue-500 hover:bg-blue-600 text-white'}"
                        ${!book.canApply ? 'disabled' : ''}
                        data-isbn="${book.isbn}"
                        onclick="event.stopPropagation(); bookRequestSystem.requestBook('${book.isbn}')"
                    >
                        ${book.statusText || '신청하기'}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 에러 카드 생성
     */
    createErrorCard(book) {
        return `
            <div class="book-card bg-gray-100 rounded-lg shadow-sm p-4">
                <div class="text-center text-gray-500">
                    <div class="text-2xl mb-2">⚠️</div>
                    <p class="text-sm">카드 생성 오류</p>
                    <p class="text-xs mt-1">${book.title || '알 수 없는 도서'}</p>
                </div>
            </div>
        `;
    }

    /**
     * 책 권수 업데이트
     */
    updateBookCount(count) {
        try {
            console.log('📊 책 권수 업데이트:', count);
            
            // 메인 요소만 업데이트
            if (this.elements.totalBooks) {
                this.elements.totalBooks.textContent = count;
                console.log('📊 메인 카운터 업데이트 완료');
            }
            
            // 추가로 업데이트할 특정 요소들
            const bookCountElements = document.querySelectorAll('.book-count, [data-book-count], .total-books');
            bookCountElements.forEach(el => {
                el.textContent = count;
            });
            
        } catch (error) {
            console.error('❌ 책 권수 업데이트 오류:', error);
        }
    }

    /**
     * 로딩 상태 표시
     */
    showLoadingState() {
        console.log('⏳ 로딩 상태 표시');
        
        if (this.elements.booksGrid) {
            this.elements.booksGrid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <div class="text-gray-600 text-center">
                        <p class="font-medium mb-1">도서 정보를 불러오고 있습니다</p>
                        <p class="text-sm text-gray-500">잠시만 기다려주세요...</p>
                    </div>
                </div>
            `;
        }
        
        // 빈 상태 숨기기
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
    }

    /**
     * 로딩 상태 숨기기
     */
    hideLoadingState() {
        // 로딩 상태는 도서 표시 시 자동으로 교체됨
    }

    /**
     * 카테고리 활성화 표시 업데이트
     */
    updateCategoryActive(categoryId) {
        // 모든 카테고리 버튼의 active 클래스 제거
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 선택된 카테고리 버튼에 active 클래스 추가
        if (categoryId) {
            const activeBtn = document.querySelector(`[data-category="${categoryId}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    }

    /**
     * 알림 표시
     */
    showNotification(message, type = 'info') {
        try {
            console.log('📢 알림 표시:', { message, type });
            
            // 기존 알림 제거
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
            
            if (!document.body) {
                console.error('❌ document.body가 없어서 알림을 표시할 수 없음');
                console.log(`📢 알림 메시지: ${message}`);
                return;
            }
            
            // 새 알림 생성
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            // 스타일 적용
            const colors = {
                error: '#ef4444',
                warning: '#f59e0b',
                success: '#10b981',
                info: '#3b82f6'
            };
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type] || colors.info};
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
                word-wrap: break-word;
                font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            
            // DOM에 추가
            document.body.appendChild(notification);
            
            // 애니메이션으로 표시
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // 클릭으로 닫기
            notification.addEventListener('click', () => {
                this.hideNotification(notification);
            });
            
            // 자동 제거 (5초 후)
            setTimeout(() => {
                this.hideNotification(notification);
            }, 5000);
            
            console.log('✅ 알림 표시 완료');
            
        } catch (error) {
            console.error('❌ 알림 표시 오류:', error);
            console.log(`📢 알림 메시지 (표시 실패): ${message}`);
        }
    }

    /**
     * 알림 숨기기
     */
    hideNotification(notification) {
        try {
            if (notification && notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('❌ 알림 숨기기 오류:', error);
        }
    }

    /**
     * 에러 메시지 표시
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 빈 상태 표시
     */
    showEmptyState() {
        console.log('📭 빈 상태 표시');
        
        if (this.elements.booksGrid) {
            this.elements.booksGrid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div class="text-6xl mb-4">📚</div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">도서를 찾을 수 없습니다</h3>
                    <p class="text-gray-500 mb-4">다른 카테고리를 선택하거나 검색어를 변경해보세요.</p>
                    <div class="flex flex-wrap gap-2 justify-center">
                        <button onclick="window.bookRequestSystem?.loadBooksByCategory('bestseller')" 
                                class="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors">
                            베스트셀러 보기
                        </button>
                        <button onclick="window.bookRequestSystem?.handleSearchFromButton('동화')" 
                                class="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors">
                            동화 검색
                        </button>
                        <button onclick="window.bookRequestSystem?.handleSearchFromButton('과학')" 
                                class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600 transition-colors">
                            과학 검색
                        </button>
                        <button onclick="window.bookRequestSystem?.loadSampleBooks()" 
                                class="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 transition-colors">
                            샘플 도서 보기
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
        }
        
        // 책 권수를 0으로 업데이트
        this.updateBookCount(0);
    }

    /**
     * 버튼에서 검색 호출용 헬퍼 메서드
     */
    handleSearchFromButton(query) {
        console.log('🔍 버튼에서 검색 호출:', query);
        
        // 검색 입력 필드에도 값 설정
        if (this.elements.searchInput) {
            this.elements.searchInput.value = query;
        }
        
        this.handleSearch(query);
    }

    /**
     * 샘플 도서 로드
     */
    async loadSampleBooks() {
        console.log('📚 샘플 도서 로드');
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // 다양한 샘플 도서 생성
            const sampleBooks = [
                ...this.generateSampleBooks('bestseller', 5),
                ...this.generateSampleBooks('new', 3),
                ...this.generateSearchSampleBooks('어린이', 4)
            ];
            
            this.currentBooks = sampleBooks;
            this.currentPage = 1;
            this.currentCategory = 'sample';
            
            await this.displayBooks(sampleBooks, true);
            this.updateCategoryActive(null);
            
            if (this.elements.currentCategory) {
                this.elements.currentCategory.textContent = '샘플 도서';
            }
            
            this.showNotification('샘플 도서를 표시합니다. 실제 도서 정보는 검색 또는 카테고리를 이용해주세요.', 'info');
            
        } catch (error) {
            console.error('❌ 샘플 도서 로드 오류:', error);
            this.showNotification('샘플 도서 로드 중 오류가 발생했습니다.', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * 통계 표시 설정 (개발 모드)
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
            <div style="font-weight: bold; margin-bottom: 4px;">시스템 상태</div>
            <div id="stats-content"></div>
        `;
        
        // 스타일 적용
        statsDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 9999;
            max-width: 200px;
            opacity: 0.7;
            cursor: pointer;
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
        `;
        
        document.body.appendChild(statsDiv);
        
        // 클릭으로 표시/숨김 토글
        let isVisible = false;
        statsDiv.addEventListener('click', () => {
            isVisible = !isVisible;
            statsDiv.style.opacity = isVisible ? '1' : '0.7';
        });
    }

    /**
     * 통계 정보 업데이트
     */
    updateStatsDisplay() {
        const statsContent = document.getElementById('stats-content');
        if (!statsContent) return;
        
        const currentBooks = this.currentBooks ? this.currentBooks.length : 0;
        const ownedBooks = window.ownedBooks ? window.ownedBooks.length : 0;
        
        statsContent.innerHTML = `
            <div>현재 도서: ${currentBooks}권</div>
            <div>보유 도서: ${ownedBooks}권</div>
            <div>보유도서 로드: ${this.ownedBooksLoaded ? '완료' : '로딩중'}</div>
            <div style="margin-top: 4px; font-size: 10px; opacity: 0.7;">클릭하여 상세보기</div>
        `;
    }

    /**
     * 유틸리티: 디바운스
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 전역 함수들
window.closeModal = function() {
    const modal = document.getElementById('bookModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
    document.body.style.overflow = 'auto';
};

// 전역 모달 닫기 함수
window.closeBookModal = function() {
    const modal = document.querySelector('#bookModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
};

// 전역 도서 신청 함수
window.requestBook = function(isbn) {
    console.log('📚 도서 신청:', isbn);
    
    if (window.bookRequestSystem) {
        const book = window.bookRequestSystem.currentBooks?.find(b => 
            (b.isbn13 || b.isbn) === isbn
        );
        
        if (book && typeof window.bookRequestSystem.requestBook === 'function') {
            window.bookRequestSystem.requestBook(isbn);
        }
    }
};

// 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 시스템 초기화 시작...');
    
    try {
        const bookRequestSystem = new BookRequestSystem();
        
        // 전역으로 접근 가능하도록 등록 (빈 상태 버튼에서 사용)
        window.bookRequestSystem = bookRequestSystem;
        
        console.log('✅ 전역 bookRequestSystem 등록 완료');
        
    } catch (error) {
        console.error('❌ 시스템 초기화 중 치명적 오류:', error);
        
        // 치명적 오류 발생 시 사용자에게 알림
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; 
                        max-width: 400px; text-align: center; z-index: 10000;">
                <div style="color: #dc2626; font-size: 18px; margin-bottom: 10px;">⚠️</div>
                <h3 style="color: #dc2626; margin: 0 0 10px 0;">시스템 초기화 실패</h3>
                <p style="color: #991b1b; margin: 0 0 15px 0; font-size: 14px;">
                    페이지를 새로고침하거나<br>브라우저를 다시 실행해주세요.
                </p>
                <button onclick="window.location.reload()" 
                        style="background: #dc2626; color: white; border: none; padding: 8px 16px; 
                               border-radius: 4px; cursor: pointer; font-size: 14px;">
                    새로고침
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});
function checkCurrentState() {
    const bookCards = document.querySelectorAll('#booksGrid .book-card');
    const titles = Array.from(bookCards).map(card => {
        const titleElement = card.querySelector('h3');
        return titleElement ? titleElement.textContent.trim() : 'No title';
    });
    
    console.log(`📊 현재 화면 상태:`, {
        카드_수: bookCards.length,
        제목_처음_5개: titles.slice(0, 5),
        제목_마지막_5개: titles.slice(-5),
        중복_검사: titles.length !== new Set(titles).size ? '중복 있음!' : '중복 없음'
    });
    
    // 중복 제목 찾기
    const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
    if (duplicates.length > 0) {
        console.warn(`⚠️ 중복 발견:`, [...new Set(duplicates)]);
    }
    
    return {
        totalCards: bookCards.length,
        uniqueTitles: new Set(titles).size,
        hasDuplicates: titles.length !== new Set(titles).size,
        duplicates: [...new Set(duplicates)]
    };
}

// 전역 함수로 노출
window.checkCurrentState = checkCurrentState;