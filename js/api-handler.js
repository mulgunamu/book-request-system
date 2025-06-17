/**
 * 알라딘 API 핸들러
 */

class AladinAPI {
    constructor() {
        this.baseUrl = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
        this.apiKey = 'ttbgujeongmo2105001'; // PRD에서 제공된 TTB 키
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5분 캐싱
    }

    /**
     * JSONP 방식으로 API 호출
     */
    async callAPI(params) {
        const cacheKey = JSON.stringify(params);
        
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        return new Promise((resolve, reject) => {
            // JSONP 콜백 함수명 생성
            const callbackName = 'aladinCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // 전역 콜백 함수 등록
            window[callbackName] = (data) => {
                // 캐시에 저장
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                // 콜백 함수 정리
                delete window[callbackName];
                document.head.removeChild(script);
                
                resolve(data);
            };

            // 스크립트 태그 생성
            const script = document.createElement('script');
            const url = new URL(this.baseUrl);
            
            // 기본 파라미터 설정
            const defaultParams = {
                ttbkey: this.apiKey,
                output: 'js',
                Version: '20131101',
                callback: callbackName,
                ...params
            };

            // URL 파라미터 추가
            Object.keys(defaultParams).forEach(key => {
                url.searchParams.append(key, defaultParams[key]);
            });

            script.src = url.toString();
            script.onerror = () => {
                delete window[callbackName];
                document.head.removeChild(script);
                reject(new Error('API 호출 실패'));
            };

            // 타임아웃 설정 (10초)
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    reject(new Error('API 호출 타임아웃'));
                }
            }, 10000);

            document.head.appendChild(script);
        });
    }

    /**
     * 도서 검색
     */
    async searchBooks(query, options = {}) {
        try {
            const params = {
                Query: query,
                QueryType: 'Title',
                MaxResults: options.maxResults || 20,
                start: options.start || 1,
                SearchTarget: 'Book',
                Sort: options.sort || 'Accuracy'
            };

            // 카테고리 필터 추가
            if (options.categoryId && options.categoryId !== 'bestseller') {
                params.CategoryId = options.categoryId;
            }

            const response = await this.callAPI(params);
            return this.formatResponse(response);
        } catch (error) {
            console.error('도서 검색 오류:', error);
            throw error;
        }
    }

    /**
     * 베스트셀러 조회
     */
    async getBestsellers(options = {}) {
        try {
            const params = {
                QueryType: 'Bestseller',
                MaxResults: options.maxResults || 20,
                start: options.start || 1,
                SearchTarget: 'Book',
                CategoryId: '1108' // 어린이 카테고리
            };

            const response = await this.callAPI(params);
            return this.formatResponse(response);
        } catch (error) {
            console.error('베스트셀러 조회 오류:', error);
            throw error;
        }
    }

    /**
     * 카테고리별 도서 조회
     */
    async getBooksByCategory(categoryId, options = {}) {
        try {
            if (categoryId === 'bestseller') {
                return await this.getBestsellers(options);
            }

            const params = {
                QueryType: 'ItemNewAll',
                MaxResults: options.maxResults || 20,
                start: options.start || 1,
                SearchTarget: 'Book',
                CategoryId: categoryId,
                Sort: options.sort || 'PublishTime'
            };

            const response = await this.callAPI(params);
            return this.formatResponse(response);
        } catch (error) {
            console.error('카테고리별 도서 조회 오류:', error);
            throw error;
        }
    }

    /**
     * API 응답 데이터 포맷팅
     */
    formatResponse(response) {
        if (!response || !response.item) {
            return {
                books: [],
                totalResults: 0,
                startIndex: 1,
                itemsPerPage: 20
            };
        }

        const books = response.item.map(item => this.formatBookData(item));
        
        return {
            books: books,
            totalResults: response.totalResults || books.length,
            startIndex: response.startIndex || 1,
            itemsPerPage: response.itemsPerPage || 20,
            searchCategoryId: response.searchCategoryId,
            searchCategoryName: response.searchCategoryName
        };
    }

    /**
     * 개별 도서 데이터 포맷팅
     */
    formatBookData(item) {
        return {
            isbn: item.isbn13 || item.isbn,
            isbn10: item.isbn,
            isbn13: item.isbn13,
            title: this.cleanTitle(item.title),
            author: item.author,
            publisher: item.publisher,
            pubDate: item.pubDate,
            description: item.description,
            price: item.priceStandard || 0,
            salePrice: item.priceSales || item.priceStandard || 0,
            discount: item.discount || 0,
            cover: item.cover,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            link: item.link,
            
            // 추가 메타데이터
            customerReviewRank: item.customerReviewRank || 0,
            subInfo: item.subInfo,
            
            // 내부 상태 (나중에 설정됨)
            isOwned: false,
            isApplied: false,
            canApply: true
        };
    }

    /**
     * 도서 제목 정리 (부제목 제거 등)
     */
    cleanTitle(title) {
        if (!title) return '';
        
        // 부제목 구분자 제거
        return title.split(' - ')[0].split(' : ')[0].trim();
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * API 상태 확인
     */
    async checkStatus() {
        try {
            const response = await this.callAPI({
                QueryType: 'Bestseller',
                MaxResults: 1,
                SearchTarget: 'Book'
            });
            return response && response.item && response.item.length > 0;
        } catch (error) {
            console.error('API 상태 확인 오류:', error);
            return false;
        }
    }
}

/**
 * 도서 상태 관리 클래스
 */
class BookStatusManager {
    constructor() {
        this.ownedBooks = new Set();
        this.appliedBooks = new Set();
        this.currentClassId = null;
    }

    /**
     * 현재 학급 설정
     */
    setCurrentClass(classId) {
        this.currentClassId = classId;
        this.updateAppliedBooks();
    }

    /**
     * 기보유 도서 목록 업데이트
     */
    updateOwnedBooks() {
        const owned = OwnedBooks.getAll();
        this.ownedBooks = new Set(owned.map(book => book.isbn));
    }

    /**
     * 신청 도서 목록 업데이트
     */
    updateAppliedBooks() {
        if (!this.currentClassId) return;
        
        const applied = Applications.getByClass(this.currentClassId);
        this.appliedBooks = new Set(applied.map(app => app.isbn));
    }

    /**
     * 도서 상태 확인 및 설정
     */
    updateBookStatus(book) {
        const isbn = book.isbn13 || book.isbn;
        
        book.isOwned = this.ownedBooks.has(isbn);
        book.isApplied = this.appliedBooks.has(isbn);
        
        // 신청 가능 여부 결정
        if (book.isOwned) {
            book.canApply = false;
            book.statusText = '보유중';
            book.statusClass = 'owned';
        } else if (book.isApplied) {
            book.canApply = false;
            book.statusText = '신청완료';
            book.statusClass = 'applied';
        } else if (this.currentClassId && Budget.checkBudgetExceeded(this.currentClassId, book.salePrice)) {
            book.canApply = false;
            book.statusText = '예산초과';
            book.statusClass = 'budget-exceeded';
        } else {
            book.canApply = true;
            book.statusText = '신청하기';
            book.statusClass = 'available';
        }

        return book;
    }

    /**
     * 도서 목록의 모든 상태 업데이트
     */
    updateBooksStatus(books) {
        this.updateOwnedBooks();
        this.updateAppliedBooks();
        
        return books.map(book => this.updateBookStatus(book));
    }
}

/**
 * 검색 관리 클래스
 */
class SearchManager {
    constructor(apiHandler, statusManager) {
        this.api = apiHandler;
        this.status = statusManager;
        this.currentQuery = '';
        this.currentCategory = 'bestseller';
        this.currentPage = 1;
        this.isLoading = false;
        this.lastResults = null;
    }

    /**
     * 검색 실행
     */
    async search(query, options = {}) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            Loading.show('도서를 검색하고 있습니다...');

            this.currentQuery = query;
            this.currentPage = options.page || 1;

            const searchOptions = {
                maxResults: 20,
                start: this.currentPage,
                sort: options.sort || 'Accuracy',
                ...options
            };

            const results = await this.api.searchBooks(query, searchOptions);
            results.books = this.status.updateBooksStatus(results.books);
            
            this.lastResults = results;
            return results;
        } catch (error) {
            console.error('검색 오류:', error);
            Toast.show('검색 오류', '도서 검색 중 오류가 발생했습니다.', 'error');
            throw error;
        } finally {
            this.isLoading = false;
            Loading.hide();
        }
    }

    /**
     * 카테고리별 조회
     */
    async searchByCategory(categoryId, options = {}) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            Loading.show('도서를 불러오고 있습니다...');

            this.currentCategory = categoryId;
            this.currentQuery = '';
            this.currentPage = options.page || 1;

            const searchOptions = {
                maxResults: 20,
                start: this.currentPage,
                sort: options.sort || 'PublishTime',
                ...options
            };

            const results = await this.api.getBooksByCategory(categoryId, searchOptions);
            results.books = this.status.updateBooksStatus(results.books);
            
            this.lastResults = results;
            return results;
        } catch (error) {
            console.error('카테고리 조회 오류:', error);
            Toast.show('조회 오류', '도서 목록을 불러오는 중 오류가 발생했습니다.', 'error');
            throw error;
        } finally {
            this.isLoading = false;
            Loading.hide();
        }
    }

    /**
     * 다음 페이지 로드
     */
    async loadNextPage() {
        if (this.isLoading || !this.lastResults) return;

        const nextPage = this.currentPage + 1;
        const maxPage = Math.ceil(this.lastResults.totalResults / 20);
        
        if (nextPage > maxPage) {
            Toast.show('알림', '더 이상 불러올 도서가 없습니다.', 'info');
            return;
        }

        try {
            let results;
            if (this.currentQuery) {
                results = await this.search(this.currentQuery, { page: nextPage });
            } else {
                results = await this.searchByCategory(this.currentCategory, { page: nextPage });
            }

            // 기존 결과에 추가
            this.lastResults.books = [...this.lastResults.books, ...results.books];
            this.lastResults.startIndex = results.startIndex;
            
            return this.lastResults;
        } catch (error) {
            console.error('다음 페이지 로드 오류:', error);
            throw error;
        }
    }

    /**
     * 검색 상태 초기화
     */
    reset() {
        this.currentQuery = '';
        this.currentCategory = 'bestseller';
        this.currentPage = 1;
        this.lastResults = null;
    }
}

// 전역 인스턴스 생성
const aladinAPI = new AladinAPI();
const bookStatusManager = new BookStatusManager();
const searchManager = new SearchManager(aladinAPI, bookStatusManager); 