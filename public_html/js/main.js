/**
 * 수정된 메인 애플리케이션 로직 - 페이지네이션 문제 해결
 * 알라딘 API 정책: 50개씩 최대 200개까지 조회 가능
 */

class BookRequestApp {
    constructor() {
        // 페이지네이션 상태 관리
        this.currentCategory = 'bestseller';
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMoreBooks = true;
        this.totalBooksLoaded = 0;
        this.maxBooksPerCategory = 200; // 알라딘 API 제한
        this.booksPerPage = 50; // 페이지당 도서 수
        
        // 검색 상태
        this.isSearchMode = false;
        this.currentSearchQuery = '';
        
        // 금지도서 목록 (학교 정책에 따라 조정)
        this.bannedKeywords = [
            '성인', '야설', '에로', '19금', '성교육', '섹스',
            '폭력', '살인', '공포', '호러', '잔혹', '고어',
            '자살', '우울', '죽음', '마약', '담배', '술',
            '정치', '종교', '이념', '극우', '극좌'
        ];
        
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialBooks();
    }

    /**
     * DOM 요소 초기화
     */
    initializeElements() {
        this.elements = {
            booksGrid: document.getElementById('booksGrid'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            categoryButtons: document.querySelectorAll('.category-btn'),
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            loading: document.getElementById('loading'),
            totalBooks: document.getElementById('totalBooks'),
            currentCategory: document.getElementById('currentCategory')
        };
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 카테고리 버튼 클릭
        this.elements.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = btn.dataset.category;
                this.loadCategoryBooks(categoryId);
            });
        });

        // 더보기 버튼 클릭
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => {
                this.handleLoadMore();
            });
        }

        // 검색 이벤트
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }
    }

    /**
     * 초기 도서 로드
     */
    async loadInitialBooks() {
        await this.loadCategoryBooks('bestseller');
    }

    /**
     * 카테고리별 도서 로드 (새로 시작)
     */
    async loadCategoryBooks(categoryId) {
        try {
            // 상태 초기화
            this.currentCategory = categoryId;
            this.currentPage = 1;
            this.totalBooksLoaded = 0;
            this.hasMoreBooks = true;
            this.isSearchMode = false;
            
            // UI 초기화
            this.clearBookGrid();
            this.updateCategoryButtons(categoryId);
            this.showLoading(true);

            // 첫 페이지 로드
            const books = await this.fetchBooksFromAPI(categoryId, 1);
            
            if (books && books.length > 0) {
                const filteredBooks = this.filterBannedBooks(books);
                this.renderBooks(filteredBooks);
                this.totalBooksLoaded = filteredBooks.length;
                this.updateLoadMoreButton();
                this.updateBookCount();
                
                console.log(`✅ 카테고리 "${categoryId}" 첫 페이지 로드 완료: ${filteredBooks.length}권`);
            } else {
                this.showEmptyState();
            }

        } catch (error) {
            console.error('❌ 카테고리 도서 로드 실패:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 더보기 버튼 클릭 처리
     */
    async handleLoadMore() {
        if (this.isLoading || !this.hasMoreBooks) {
            return;
        }

        try {
            this.isLoading = true;
            this.showLoading(true, '더 많은 도서를 불러오는 중...');
            
            // 다음 페이지의 시작 위치 계산 (순위 기반)
            const nextStart = (this.currentPage * this.booksPerPage) + 1;
            
            console.log(`📖 더보기 요청: 카테고리=${this.currentCategory}, start=${nextStart}, 현재까지=${this.totalBooksLoaded}권`);

            let books;
            if (this.isSearchMode) {
                books = await this.fetchSearchResults(this.currentSearchQuery, nextStart);
            } else {
                books = await this.fetchBooksFromAPI(this.currentCategory, nextStart);
            }

            if (books && books.length > 0) {
                const filteredBooks = this.filterBannedBooks(books);
                
                // 기존 도서에 추가
                this.renderBooks(filteredBooks, true); // append = true
                
                // 상태 업데이트
                this.currentPage++;
                this.totalBooksLoaded += filteredBooks.length;
                
                console.log(`✅ 페이지 ${this.currentPage} 로드 완료: +${filteredBooks.length}권 (총 ${this.totalBooksLoaded}권)`);
                
                // API 제한 확인
                if (this.totalBooksLoaded >= this.maxBooksPerCategory || filteredBooks.length < this.booksPerPage) {
                    this.hasMoreBooks = false;
                    console.log(`📚 더 이상 불러올 도서가 없습니다. (총 ${this.totalBooksLoaded}권)`);
                }
                
            } else {
                this.hasMoreBooks = false;
                console.log('📚 더 이상 불러올 도서가 없습니다.');
            }

            this.updateLoadMoreButton();
            this.updateBookCount();
            
        } catch (error) {
            console.error('❌ 더보기 로드 실패:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * API에서 도서 목록 가져오기
     */
    async fetchBooksFromAPI(categoryId, start) {
        try {
            console.log(`🔍 API 요청: 카테고리=${categoryId}, 페이지=${this.currentPage}, start=${start}, maxResults=${this.booksPerPage}`);
            
            let result;
            switch (categoryId) {
                case 'bestseller':
                    result = await window.AladinAPI.getBestSellers(start, this.booksPerPage);
                    break;
                case 'new':
                    result = await window.AladinAPI.getNewBooks(start, this.booksPerPage);
                    break;
                case 'special':
                    result = await window.AladinAPI.getSpecialBooks(start, this.booksPerPage);
                    break;
                case 'editor':
                    result = await window.AladinAPI.getEditorChoice(start, this.booksPerPage);
                    break;
                case 'blog':
                    result = await window.AladinAPI.getBlogBest(start, this.booksPerPage);
                    break;
                default:
                    result = await window.AladinAPI.getCategoryBooks(categoryId, start, this.booksPerPage);
            }
            
            return result.books;
            
        } catch (error) {
            console.error('❌ API 요청 실패:', error);
            throw new Error(`도서 목록을 가져오는데 실패했습니다: ${error.message}`);
        }
    }

    /**
     * 검색 결과 가져오기
     */
    async fetchSearchResults(query, page) {
        try {
            const start = (page - 1) * this.booksPerPage + 1;
            console.log(`🔍 검색 API 요청: query="${query}", 페이지=${page}, start=${start}`);
            
            const result = await window.AladinAPI.searchBooks(query, {
                start: start,
                maxResults: this.booksPerPage
            });

            return result?.books || [];

        } catch (error) {
            console.error('❌ 검색 API 실패:', error);
            throw new Error(`검색 결과를 불러올 수 없습니다: ${error.message}`);
        }
    }

    /**
     * 금지도서 필터링
     */
    filterBannedBooks(books) {
        return books.filter(book => {
            const title = (book.title || '').toLowerCase();
            const author = (book.author || '').toLowerCase();
            const description = (book.description || '').toLowerCase();
            
            // 금지 키워드 검사
            const hasBannedKeyword = this.bannedKeywords.some(keyword => 
                title.includes(keyword) || 
                author.includes(keyword) || 
                description.includes(keyword)
            );
            
            if (hasBannedKeyword) {
                console.log(`🚫 금지도서 필터링: "${book.title}"`);
                return false;
            }
            
            // 연령등급 확인 (있다면)
            if (book.ageLimit && parseInt(book.ageLimit) > 15) {
                console.log(`🚫 연령제한 필터링: "${book.title}" (${book.ageLimit}세 이상)`);
                return false;
            }
            
            return true;
        });
    }

    /**
     * 도서 그리드에 렌더링
     */
    renderBooks(books, append = false) {
        if (!append) {
            this.clearBookGrid();
        }

        books.forEach(book => {
            const bookCard = this.createBookCard(book);
            this.elements.booksGrid.appendChild(bookCard);
        });
    }

    /**
     * 도서 카드 생성
     */
    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200';
        
        const price = book.priceStandard ? `${book.priceStandard.toLocaleString()}원` : '가격 정보 없음';
        const discount = book.priceSales && book.priceStandard ? 
            Math.round((1 - book.priceSales / book.priceStandard) * 100) : 0;
        
        card.innerHTML = `
            <div class="relative">
                <img src="${book.cover || '/images/no-image.png'}" 
                     alt="${book.title}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='/images/no-image.png'">
                ${discount > 0 ? `<span class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">${discount}% 할인</span>` : ''}
                ${book.rank ? `<span class="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">${book.rank}위</span>` : ''}
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-sm text-gray-800 mb-2 line-clamp-2" title="${book.title}">
                    ${book.title}
                </h3>
                <p class="text-xs text-gray-600 mb-2" title="${book.author}">
                    ${book.author || '저자 정보 없음'}
                </p>
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-blue-600">${price}</span>
                    ${book.customerReviewRank ? `
                        <div class="flex items-center">
                            <span class="text-yellow-400 mr-1">★</span>
                            <span class="text-xs text-gray-600">${book.customerReviewRank}</span>
                        </div>
                    ` : ''}
                </div>
                <button onclick="bookApp.handleBookRequest('${book.isbn13 || book.isbn}')" 
                        class="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors">
                    신청하기
                </button>
            </div>
        `;
        
        return card;
    }

    /**
     * 더보기 버튼 상태 업데이트
     */
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;

        if (this.hasMoreBooks && this.totalBooksLoaded < this.maxBooksPerCategory) {
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.innerHTML = `
                <i class="fas fa-plus mr-2"></i>더 많은 도서 보기 (${this.totalBooksLoaded}/${this.maxBooksPerCategory})
            `;
            this.elements.loadMoreBtn.disabled = false;
            this.elements.loadMoreBtn.className = 'bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition';
        } else {
            this.elements.loadMoreBtn.innerHTML = `
                <i class="fas fa-info-circle mr-2"></i>모든 도서를 불러왔습니다 (${this.totalBooksLoaded}권)
            `;
            this.elements.loadMoreBtn.disabled = true;
            this.elements.loadMoreBtn.className = 'bg-gray-400 text-white px-8 py-3 rounded-lg cursor-not-allowed';
        }
    }

    /**
     * 도서 수 업데이트
     */
    updateBookCount() {
        if (this.elements.totalBooks) {
            this.elements.totalBooks.textContent = this.totalBooksLoaded.toLocaleString();
        }
    }

    /**
     * 카테고리 버튼 상태 업데이트
     */
    updateCategoryButtons(activeCategory) {
        this.elements.categoryButtons.forEach(btn => {
            if (btn.dataset.category === activeCategory) {
                btn.classList.add('active', 'bg-blue-600', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });

        // 카테고리 이름 업데이트
        if (this.elements.currentCategory) {
            const categoryNames = {
                'bestseller': '베스트셀러',
                'itemnewspecial': '주목할 만한 신간',
                'itemnewall': '신간 전체 리스트',
                'itemeditorchoice': '편집자 추천',
                'blogbest': '블로거 베스트셀러'
            };
            this.elements.currentCategory.textContent = categoryNames[activeCategory] || '도서 목록';
        }
    }

    /**
     * 검색 처리
     */
    async handleSearch() {
        const query = this.elements.searchInput.value.trim();
        if (!query) return;

        try {
            // 검색 모드로 전환
            this.isSearchMode = true;
            this.currentSearchQuery = query;
            this.currentPage = 1;
            this.totalBooksLoaded = 0;
            this.hasMoreBooks = true;

            this.clearBookGrid();
            this.showLoading(true);

            const books = await this.fetchSearchResults(query, 1);
            
            if (books && books.length > 0) {
                const filteredBooks = this.filterBannedBooks(books);
                this.renderBooks(filteredBooks);
                this.totalBooksLoaded = filteredBooks.length;
                this.updateLoadMoreButton();
                this.updateBookCount();
                
                // 카테고리 표시 업데이트
                if (this.elements.currentCategory) {
                    this.elements.currentCategory.textContent = `"${query}" 검색 결과`;
                }
                
                console.log(`🔍 검색 완료: "${query}" - ${filteredBooks.length}권 발견`);
            } else {
                this.showEmptyState();
            }

        } catch (error) {
            console.error('❌ 검색 실패:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 도서 신청 처리
     */
    handleBookRequest(isbn) {
        console.log(`📚 도서 신청: ISBN=${isbn}`);
        // 여기에 도서 신청 로직 구현
        alert(`도서 신청이 완료되었습니다! (ISBN: ${isbn})`);
    }

    /**
     * UI 유틸리티 메서드들
     */
    clearBookGrid() {
        if (this.elements.booksGrid) {
            this.elements.booksGrid.innerHTML = '';
        }
    }

    showLoading(show, message = '도서 정보를 불러오는 중...') {
        if (this.elements.loading) {
            if (show) {
                this.elements.loading.classList.remove('hidden');
                this.elements.loading.innerHTML = `
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">${message}</p>
                `;
            } else {
                this.elements.loading.classList.add('hidden');
            }
        }
    }

    showEmptyState() {
        this.clearBookGrid();
        this.elements.booksGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-book-open text-gray-300 text-6xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">도서를 찾을 수 없습니다</h3>
                <p class="text-gray-600">다른 카테고리를 선택하거나 검색어를 바꿔보세요.</p>
            </div>
        `;
        
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.classList.add('hidden');
        }
    }

    showError(message) {
        this.clearBookGrid();
        this.elements.booksGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-300 text-6xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
                <p class="text-gray-600">${message}</p>
                <button onclick="location.reload()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    새로고침
                </button>
            </div>
        `;
    }
}

// 전역 변수로 앱 인스턴스 생성
let bookApp;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    bookApp = new BookRequestApp();
    window.bookApp = bookApp;
    console.log('📚 도서 신청 시스템이 초기화되었습니다.');
});
