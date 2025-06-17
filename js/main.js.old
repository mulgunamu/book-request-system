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
        if (this.elements.setClassBtn) {
            this.elements.setClassBtn.addEventListener('click', this.handleSetClass.bind(this));
        }
        
        // 학년 선택 시 해당 학년의 반 목록 로드
        if (this.elements.grade) {
            this.elements.grade.addEventListener('change', this.handleGradeChange.bind(this));
        }
        
        // 반 선택 시 담임교사 정보 로드
        if (this.elements.class) {
            this.elements.class.addEventListener('change', this.handleClassChange.bind(this));
        }
        
        // 검색
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
        }
        
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.handleSearch(this.elements.searchInput.value);
            });
        }
        
        // 엔터 키로 검색
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
        
        // 정렬 변경
        if (this.elements.sortBy) {
            this.elements.sortBy.addEventListener('change', this.handleSortChange.bind(this));
        }
        
        // 더보기 버튼
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
        }
        
        // 카테고리 버튼들
        if (this.elements.categoryList) {
            this.elements.categoryList.addEventListener('click', (e) => {
                const button = e.target.closest('.category-btn');
                if (button) {
                    this.handleCategoryClick(button);
                }
                
                const parentButton = e.target.closest('.category-parent-btn');
                if (parentButton) {
                    this.handleCategoryToggle(parentButton);
                }
            });
        }
        
        // 모달 관련 이벤트
        if (this.elements.modalContent) {
            this.elements.modalContent.addEventListener('click', this.handleModalClick.bind(this));
        }
        
        // 모달 닫기
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                Modal.hide('bookModal');
            });
        }
        
        // 모달 바깥 클릭으로 닫기
        if (this.elements.bookModal) {
            this.elements.bookModal.addEventListener('click', (e) => {
                if (e.target === this.elements.bookModal) {
                    Modal.hide('bookModal');
                }
            });
        }
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Modal.hide('bookModal');
            }
        });
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
     * 결과 정보 업데이트 (더보기 버튼 제어 로직 제거 - 중복 문제 해결)
     */
    updateResultsInfo(results) {
        if (this.elements.totalBooks) {
            this.elements.totalBooks.textContent = results.totalResults;
        }
        
        // 기존 중복 코드 제거:
        // const hasMore = results.books.length < results.totalResults;
        // this.elements.loadMoreBtn.classList.toggle('hidden', !hasMore);
        
        // 더보기 버튼 제어는 updateLoadMoreButton()에서만 처리
    }

    /**
     * 더보기 버튼 업데이트 (통합된 로직 - 중복 문제 해결)
     */
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;
        
        if (!searchManager.lastResults) {
            this.elements.loadMoreBtn.classList.add('hidden');
            this.resetLoadMoreButton();
            return;
        }
        
        const currentCount = this.currentBooks.length;
        const totalCount = Math.min(200, searchManager.lastResults.totalResults); // API 제한 반영
        const hasMore = currentCount < totalCount && currentCount < 200; // 최대 200개 제한
        
        // 더보기 버튼 표시/숨김 처리
        this.elements.loadMoreBtn.classList.toggle('hidden', !hasMore);
        
        if (hasMore) {
            // 정상적인 더보기 상태
            this.elements.loadMoreBtn.innerHTML = `
                <i class="fas fa-plus mr-2"></i>더 많은 도서 보기 (${currentCount}/${totalCount})
            `;
            this.resetLoadMoreButton(); // 버튼 스타일 초기화
        } else if (currentCount >= 200) {
            // API 제한에 도달한 경우
            this.elements.loadMoreBtn.innerHTML = `
                <i class="fas fa-info-circle mr-2"></i>API 제한으로 최대 200개까지만 조회 가능
            `;
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.classList.add('cursor-not-allowed', 'opacity-60');
            this.elements.loadMoreBtn.disabled = true;
        } else {
            // 더 이상 로드할 데이터가 없는 경우
            this.elements.loadMoreBtn.classList.add('hidden');
            this.resetLoadMoreButton();
        }
    }

    /**
     * 더보기 버튼 스타일 초기화
     */
    resetLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;
        
        this.elements.loadMoreBtn.classList.remove('cursor-not-allowed', 'opacity-60');
        this.elements.loadMoreBtn.disabled = false;
    }

    /**
     * 도서 목록 표시 (금지 필터 적용)
     */
    displayBooks(books) {
        try {
            // 금지 필터 적용
            let filteredBooks = books;
            if (window.banFilterManager && window.banFilterManager.isInitialized) {
                filteredBooks = window.banFilterManager.filterBooks(books);
                
                // 금지된 도서가 있다면 알림 표시
                const bannedCount = books.length - filteredBooks.filter(book => !book.isBanned).length;
                if (bannedCount > 0) {
                    console.log(`⚠️ ${bannedCount}개의 부적절한 도서가 필터링되었습니다.`);
                }
            }
            
            if (!filteredBooks || filteredBooks.length === 0) {
                this.showEmptyState();
                return;
            }

            const booksHTML = filteredBooks.map(book => this.createBookCard(book)).join('');
            if (this.elements.booksGrid) {
                this.elements.booksGrid.innerHTML = booksHTML;
            }
            
            if (this.elements.emptyState) {
                this.elements.emptyState.classList.add('hidden');
            }
            
            // 더보기 버튼은 updateLoadMoreButton()에서만 제어
            this.updateLoadMoreButton();
        } catch (error) {
            console.error('도서 표시 오류:', error);
            this.showEmptyState();
        }
    }

    /**
     * 도서 카드 생성 (금지 필터 정보 포함)
     */
    createBookCard(book) {
        const isOwned = bookStatusManager?.isBookOwned(book) || false;
        const isApplied = bookStatusManager?.isBookApplied(book) || false;
        const isBanned = book.isBanned || false;
        const banReason = book.banReason || '';
        
        // 신청 가능 여부 판단
        let canApply = true;
        let statusText = '신청하기';
        let statusClass = 'bg-blue-500 hover:bg-blue-600 text-white';
        
        if (isBanned) {
            canApply = false;
            statusText = '신청 불가';
            statusClass = 'bg-red-500 text-white cursor-not-allowed opacity-60';
        } else if (isOwned) {
            canApply = false;
            statusText = '보유중';
            statusClass = 'bg-gray-500 text-white cursor-not-allowed opacity-60';
        } else if (isApplied) {
            canApply = false;
            statusText = '신청완료';
            statusClass = 'bg-green-500 text-white cursor-not-allowed opacity-60';
        }

        const priceDisplay = book.priceStandard 
            ? `${parseInt(book.priceStandard).toLocaleString()}원`
            : (book.price ? `${parseInt(book.price).toLocaleString()}원` : '가격 정보 없음');

        const discountPercent = book.discount > 0 ? Math.round(book.discount) : 0;
        const hasDiscount = discountPercent > 0;

        return `
            <div class="book-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative ${isBanned ? 'border-2 border-red-200' : ''}" data-isbn="${book.isbn}">
                
                ${isBanned ? `
                    <div class="bg-red-100 border-b border-red-200 p-2">
                        <div class="flex items-center text-red-700 text-xs">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            <span class="font-medium">부적절한 도서</span>
                        </div>
                        ${banReason ? `<div class="text-red-600 text-xs mt-1">${banReason}</div>` : ''}
                    </div>
                ` : ''}
                
                ${isOwned ? '<div class="status-overlay owned">보유중</div>' : ''}
                ${isApplied ? '<div class="status-overlay applied">신청완료</div>' : ''}
                
                <div class="aspect-w-3 aspect-h-4 relative">
                    <img src="${book.cover}" 
                         alt="${book.title}" 
                         class="w-full h-48 object-cover"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDIwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA4MEgxNDBWMTYwSDYwVjgwWiIgZmlsbD0iI0Q1RDdEQSIvPgo8L3N2Zz4K'">
                    
                    ${book.bestRank ? `
                        <div class="absolute top-2 left-2">
                            <span class="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                베스트 ${book.bestRank}위
                            </span>
                        </div>
                    ` : ''}
                    
                    ${hasDiscount ? `
                        <div class="absolute top-2 right-2">
                            <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                ${discountPercent}% 할인
                            </span>
                        </div>
                    ` : ''}
                    
                    ${isBanned ? `
                        <div class="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                            <i class="fas fa-ban text-red-500 text-4xl opacity-80"></i>
                        </div>
                    ` : ''}
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        ${book.title}
                    </h3>
                    
                    <div class="text-sm text-gray-600 mb-3 space-y-1">
                        <div class="flex items-center">
                            <i class="fas fa-user mr-2 text-gray-400"></i>
                            <span class="truncate">${book.author}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-building mr-2 text-gray-400"></i>
                            <span class="truncate">${book.publisher}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-calendar mr-2 text-gray-400"></i>
                            <span>${book.pubDate}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-won-sign mr-2 text-gray-400"></i>
                            <span class="font-medium">${priceDisplay}</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="apply-btn flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${statusClass}"
                                data-isbn="${book.isbn}"
                                ${!canApply ? 'disabled' : ''}
                                title="${isBanned ? banReason : ''}">
                            ${statusText}
                        </button>
                        
                        ${book.link ? `
                            <a href="${book.link}" target="_blank" 
                               class="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 검색 처리 (수정된 버전)
     */
    async handleSearch(query) {
        if (!query || query.trim() === '') {
            await this.loadBooksByCategory('bestseller');
            return;
        }

        try {
            Loading.show();
            if (this.elements.emptyState) {
                this.elements.emptyState.classList.add('hidden');
            }
            
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
                this.displayBooks(this.currentBooks); // 금지 필터 적용됨
                this.updateResultsInfo(results); // 더보기 버튼 제어 코드 제거됨
                this.updateBooksStatus();
                
                // 현재 카테고리 표시 업데이트
                if (this.elements.currentCategory) {
                    this.elements.currentCategory.textContent = `"${query}" 검색 결과`;
                }
                
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
     * 카테고리별 도서 로드 (수정된 버전)
     */
    async loadBooksByCategory(categoryId) {
        try {
            if (this.elements.emptyState) {
                this.elements.emptyState.classList.add('hidden');
            }
            
            const results = await searchManager.searchByCategory(categoryId);
            if (results && results.books && results.books.length > 0) {
                this.currentBooks = results.books;
                this.displayBooks(this.currentBooks); // 금지 필터 적용됨
                this.updateResultsInfo(results); // 더보기 버튼 제어 코드 제거됨
                
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
     * 빈 상태 표시 (수정된 버전)
     */
    showEmptyState() {
        if (this.elements.booksGrid) {
            this.elements.booksGrid.innerHTML = '';
        }
        
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.remove('hidden');
        }
        
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.classList.add('hidden'); // 더보기 버튼 숨김
        }
        
        this.resetLoadMoreButton(); // 버튼 스타일 초기화
        
        if (this.elements.totalBooks) {
            this.elements.totalBooks.textContent = '0';
        }
    }

    /**
     * 더보기 버튼 클릭 처리
     */
    async handleLoadMore() {
        if (!searchManager.lastResults || (this.elements.loadMoreBtn && this.elements.loadMoreBtn.disabled)) {
            return;
        }

        try {
            Loading.show('추가 도서를 불러오는 중...');
            
            // 현재 시작 위치 계산
            const currentStart = this.currentBooks.length + 1;
            const searchOptions = {
                ...searchManager.lastSearchOptions,
                start: currentStart,
                maxResults: 50
            };

            let results;
            if (searchManager.lastQuery) {
                // 검색 결과의 다음 페이지
                results = await searchManager.search(searchManager.lastQuery, searchOptions);
            } else if (searchManager.lastCategory) {
                // 카테고리의 다음 페이지
                results = await searchManager.searchByCategory(searchManager.lastCategory, searchOptions);
            } else {
                throw new Error('로드할 수 있는 데이터가 없습니다.');
            }

            if (results && results.books && results.books.length > 0) {
                // 기존 도서에 새 도서 추가
                this.currentBooks = [...this.currentBooks, ...results.books];
                this.displayBooks(this.currentBooks); // 더보기 버튼 상태 업데이트 포함
                this.updateBooksStatus();
                
                Toast.show('완료', `${results.books.length}개의 추가 도서를 불러왔습니다.`, 'success');
            } else {
                // 더 이상 로드할 도서가 없음
                if (this.elements.loadMoreBtn) {
                    this.elements.loadMoreBtn.classList.add('hidden');
                }
                Toast.show('알림', '더 이상 불러올 도서가 없습니다.', 'info');
            }
        } catch (error) {
            console.error('더보기 로드 오류:', error);
            Toast.show('오류', '추가 도서를 불러오는 중 오류가 발생했습니다.', 'error');
        } finally {
            Loading.hide();
        }
    }

    /**
     * 카테고리 버튼 상태 업데이트
     */
    updateCategoryButtons(activeCategory) {
        if (!this.elements.categoryList) return;
        
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
     * 카테고리 클릭 처리
     */
    handleCategoryClick(button) {
        const category = button.dataset.category;
        
        // 모든 카테고리 버튼에서 active 클래스 제거
        if (this.elements.categoryList) {
            this.elements.categoryList.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        // 클릭된 버튼에 active 클래스 추가
        button.classList.add('active');
        
        // 카테고리 이름 표시
        const categoryName = button.textContent.trim().replace(/^\s*•\s*/, ''); // 불릿 포인트 제거
        if (this.elements.currentCategory) {
            this.elements.currentCategory.textContent = categoryName;
        }
        
        // 검색 입력창 초기화
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        
        // 카테고리별 도서 로드
        this.loadBooksByCategory(category);
    }

    /**
     * 카테고리 토글 처리
     */
    handleCategoryToggle(button) {
        const categoryGroup = button.closest('.category-group');
        const subcategoryList = categoryGroup?.querySelector('.subcategory-list');
        
        if (!subcategoryList) return;
        
        // 다른 카테고리 그룹들 닫기
        if (this.elements.categoryList) {
            this.elements.categoryList.querySelectorAll('.category-group').forEach(group => {
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
        }
        
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

    /**
     * 모달 클릭 처리
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

    /**
     * 도서 신청 처리 (금지 필터 확인 추가)
     */
    async handleBookApplication(book) {
        try {
            // 금지 도서 재확인
            if (window.banFilterManager && window.banFilterManager.isInitialized) {
                const banCheck = window.banFilterManager.isBookBanned(book);
                if (banCheck.isBanned) {
                    Toast.show('신청 불가', banCheck.reason, 'error');
                    return;
                }
            }

            // 학급 정보 확인
            if (!this.currentClass) {
                Toast.show('알림', '먼저 학급 정보를 설정해주세요.', 'warning');
                return;
            }

            // 중복 신청 확인
            if (bookStatusManager?.isBookApplied(book)) {
                Toast.show('중복 신청', '이미 신청한 도서입니다.', 'warning');
                return;
            }

            // 기보유 도서 확인
            if (bookStatusManager?.isBookOwned(book)) {
                Toast.show('기보유 도서', '이미 보유중인 도서입니다.', 'info');
                return;
            }

            // 예산 확인
            const currentBudget = budgetManager?.getUsedBudget() || 0;
            const totalBudget = budgetManager?.getTotalBudget() || 500000;
            const bookPrice = parseInt(book.priceStandard || book.price || 0);
            
            if (currentBudget + bookPrice > totalBudget) {
                Toast.show('예산 초과', '예산을 초과하여 신청할 수 없습니다.', 'error');
                return;
            }

            // 신청 처리
            Loading.show('도서를 신청하고 있습니다...');

            const application = {
                ...book,
                applicationDate: new Date().toISOString(),
                classInfo: this.currentClass,
                status: 'pending'
            };

            // 신청 목록에 추가
            let applications = JSON.parse(localStorage.getItem('bookApplications') || '[]');
            applications.push(application);
            localStorage.setItem('bookApplications', JSON.stringify(applications));

            // 예산 업데이트
            if (budgetManager) {
                budgetManager.addExpense(bookPrice, `도서신청: ${book.title}`);
            }

            // UI 업데이트
            this.updateBooksStatus();
            this.updateBudgetDisplay();

            Toast.show('신청 완료', `"${book.title}" 도서 신청이 완료되었습니다.`, 'success');

        } catch (error) {
            console.error('도서 신청 오류:', error);
            Toast.show('신청 오류', '도서 신청 중 오류가 발생했습니다.', 'error');
        } finally {
            Loading.hide();
        }
    }

    /**
     * 도서 상태 업데이트
     */
    async updateBooksStatus() {
        if (this.currentBooks.length === 0) return;
        
        try {
            Loading.show('도서 상태를 확인하고 있습니다...');
            if (bookStatusManager) {
                this.currentBooks = await bookStatusManager.updateBooksStatus(this.currentBooks);
                this.displayBooks(this.currentBooks);
            }
        } catch (error) {
            console.error('도서 상태 업데이트 오류:', error);
        } finally {
            Loading.hide();
        }
    }

    /**
     * 학급 정보 복원
     */
    async restoreClassInfo() {
        const savedClass = Storage.get('currentClass');
        if (savedClass) {
            this.currentClass = savedClass;
            
            // UI 업데이트
            if (this.elements.grade) this.elements.grade.value = savedClass.grade;
            if (this.elements.class) this.elements.class.value = savedClass.class;
            if (this.elements.teacher) this.elements.teacher.value = savedClass.teacher;
            
            this.loadClassInfo();
            await this.updateBudgetDisplay();
        }
    }

    /**
     * 학급 정보 표시
     */
    loadClassInfo() {
        if (this.currentClass) {
            if (this.elements.displayClass) {
                this.elements.displayClass.textContent = `${this.currentClass.grade}학년 ${this.currentClass.class}반`;
            }
            if (this.elements.displayTeacher) {
                this.elements.displayTeacher.textContent = this.currentClass.teacher;
            }
            if (this.elements.classInfo) {
                this.elements.classInfo.classList.remove('hidden');
            }
        } else {
            if (this.elements.classInfo) {
                this.elements.classInfo.classList.add('hidden');
            }
        }
    }

    /**
     * 예산 정보 업데이트
     */
    async updateBudgetDisplay() {
        try {
            if (!budgetManager) return;
            
            const budgetInfo = await budgetManager.getBudgetInfo();
            
            if (budgetInfo) {
                if (this.elements.usedBudget) {
                    this.elements.usedBudget.textContent = budgetInfo.used.toLocaleString();
                }
                if (this.elements.totalBudget) {
                    this.elements.totalBudget.textContent = budgetInfo.total.toLocaleString();
                }
                if (this.elements.budgetBar) {
                    const percentage = (budgetInfo.used / budgetInfo.total) * 100;
                    this.elements.budgetBar.style.width = `${Math.min(percentage, 100)}%`;
                }

                if (budgetInfo.used > budgetInfo.total * 0.9) {
                    Toast.show('예산 경고', '예산의 90%를 사용했습니다.', 'warning');
                }
            }
        } catch (error) {
            console.error('❌ 예산 정보 업데이트 오류:', error);
        }
    }

    /**
     * 학년 변경 처리
     */
    async handleGradeChange() {
        const grade = this.elements.grade?.value;
        
        // 반 선택 초기화
        if (this.elements.class) {
            this.elements.class.innerHTML = '<option value="">반 선택</option>';
        }
        if (this.elements.teacher) {
            this.elements.teacher.value = '';
        }
        
        // 예산 현황 숨기기
        this.currentClass = null;
        if (this.elements.classInfo) {
            this.elements.classInfo.classList.add('hidden');
        }
        
        if (!grade) {
            return;
        }

        try {
            // 해당 학년의 반 목록 로드
            const response = await fetch('/api/classes/settings');
            if (response.ok) {
                const classSettings = await response.json();
                const gradeClasses = classSettings.filter(cls => String(cls.grade) === String(grade));
                
                gradeClasses.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.class;
                    option.textContent = `${cls.class}반`;
                    if (this.elements.class) {
                        this.elements.class.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('반 목록 로드 오류:', error);
        }
    }

    /**
     * 반 변경 처리
     */
    async handleClassChange() {
        const grade = this.elements.grade?.value;
        const classNum = this.elements.class?.value;
        
        if (!grade || !classNum) {
            return;
        }

        try {
            // 해당 학급의 담임교사 정보 로드
            const response = await fetch('/api/classes/settings');
            if (response.ok) {
                const classSettings = await response.json();
                const classData = classSettings.find(cls => 
                    String(cls.grade) === String(grade) && String(cls.class) === String(classNum)
                );
                
                if (classData && this.elements.teacher) {
                    this.elements.teacher.value = classData.teacher || '';
                }
            }
        } catch (error) {
            console.error('담임교사 정보 로드 오류:', error);
        }
    }

    /**
     * 학급 설정 처리
     */
    async handleSetClass() {
        const grade = this.elements.grade?.value;
        const classNum = this.elements.class?.value;
        const teacher = this.elements.teacher?.value.trim();

        if (!grade || !classNum || !teacher) {
            Toast.show('입력 오류', '모든 정보를 입력해주세요.', 'warning');
            return;
        }

        try {
            Loading.show('학급 정보를 설정하고 있습니다...');

            this.currentClass = {
                grade: parseInt(grade),
                class: parseInt(classNum),
                teacher: teacher,
                classId: `${grade}-${classNum}`
            };

            // 로컬 스토리지에 저장
            Storage.set('currentClass', this.currentClass);

            // 세션 인증 정보 저장 (1시간)
            const authInfo = {
                classId: this.currentClass.classId,
                expiry: Date.now() + (60 * 60 * 1000)
            };
            sessionStorage.setItem('classAuth', JSON.stringify(authInfo));

            this.isAuthenticated = true;
            this.authExpiry = authInfo.expiry;

            this.loadClassInfo();
            await this.updateBudgetDisplay();

            Toast.show('설정 완료', '학급 정보가 설정되었습니다.', 'success');

        } catch (error) {
            console.error('학급 설정 오류:', error);
            Toast.show('설정 오류', '학급 정보 설정 중 오류가 발생했습니다.', 'error');
        } finally {
            Loading.hide();
        }
    }

    /**
     * 정렬 변경 처리
     */
    handleSortChange() {
        if (this.currentBooks.length > 0) {
            const sortBy = this.elements.sortBy?.value || 'salesPoint';
            this.currentBooks = this.applySortToBooks(this.currentBooks, sortBy);
            this.displayBooks(this.currentBooks);
        }
    }

    /**
     * 클라이언트 사이드 정렬 적용
     */
    applySortToBooks(books, sortBy) {
        if (!books || books.length === 0) return books;
        
        const sortedBooks = [...books];
        
        switch (sortBy) {
            case 'salesPoint':
                return sortedBooks.sort((a, b) => (b.salesPoint || 0) - (a.salesPoint || 0));
            case 'publishTime':
                return sortedBooks.sort((a, b) => {
                    const dateA = new Date(a.pubDate || '1900-01-01');
                    const dateB = new Date(b.pubDate || '1900-01-01');
                    return dateB - dateA;
                });
            case 'customerReviewRank':
                return sortedBooks.sort((a, b) => (b.customerReviewRank || 0) - (a.customerReviewRank || 0));
            case 'title':
                return sortedBooks.sort((a, b) => {
                    const titleA = (a.title || '').toLowerCase();
                    const titleB = (b.title || '').toLowerCase();
                    return titleA.localeCompare(titleB, 'ko');
                });
            case 'priceAsc':
                return sortedBooks.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'priceDesc':
                return sortedBooks.sort((a, b) => (b.price || 0) - (a.price || 0));
            default:
                return sortedBooks;
        }
    }
}

// 디바운스 함수
function debounce(func, wait) {
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

// 전역 변수
let app;
let searchManager = {};
let bookStatusManager = {};
let budgetManager = {};

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 DOM 로드 완료, 앱 초기화 시작');
        
        // 필수 매니저들 초기화 확인
        if (typeof SearchManager !== 'undefined') {
            searchManager = new SearchManager();
        }
        
        if (typeof BookStatusManager !== 'undefined') {
            bookStatusManager = new BookStatusManager();
        }
        
        if (typeof BudgetManager !== 'undefined') {
            budgetManager = new BudgetManager();
        }
        
        // 금지도서 필터 매니저 초기화 (있는 경우에만)
        if (typeof BanFilterManager !== 'undefined' && !window.banFilterManager) {
            window.banFilterManager = new BanFilterManager();
        }
        
        // 메인 앱 초기화
        app = new BookRequestApp();
        await app.init();
        
        console.log('✅ 모든 시스템 초기화 완료');
        
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        Toast?.show('초기화 오류', '애플리케이션 초기화 중 오류가 발생했습니다.', 'error');
    }
});

// 전역에서 사용할 수 있도록 window 객체에 추가
window.app = app;