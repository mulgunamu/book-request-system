/**
 * 알라딘 API 핸들러 (API 문서 기준 개선)
 */

class AladinAPI {
    constructor() {
        this.baseUrl = 'https://www.aladin.co.kr/ttb/api';
        this.defaultApiKey = 'ttbdlwlrma1232001'; // 기본 TTB 키
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5분 캐싱
        this.serverApiKey = null; // 서버에서 가져온 API 키
        this.apiKeyLoaded = false;
        this.version = '20131101'; // 최신 API 버전
    }

    /**
     * 서버에서 API 키 로드
     */
    async loadServerApiKey() {
        if (this.apiKeyLoaded) return;
        
        try {
            if (window.booksAPI) {
                const response = await window.booksAPI.getActualApiKey();
                this.serverApiKey = response.apiKey;
                this.apiKeyLoaded = true;
            }
        } catch (error) {
            console.warn('서버 API 키 로드 실패, 기본 키 사용:', error);
            this.apiKeyLoaded = true;
        }
    }

    /**
     * API 키 가져오기 (서버 우선, 로컬 스토리지, 기본값 순)
     */
    async getApiKey() {
        await this.loadServerApiKey();
        
        // 서버 API 키가 있으면 사용
        if (this.serverApiKey) {
            return this.serverApiKey;
        }
        
        // 로컬 스토리지 확인 (기존 호환성)
        const localKey = Storage.get('aladinApiKey');
        if (localKey) {
            return localKey;
        }
        
        // 기본값 반환
        return this.defaultApiKey;
    }

    /**
     * API 키 설정 (서버에 저장)
     */
    async setApiKey(apiKey) {
        try {
            if (window.booksAPI) {
                const response = await window.booksAPI.setApiKey(apiKey);
                this.serverApiKey = apiKey || this.defaultApiKey;
                this.clearCache(); // 캐시 초기화
                return response;
            } else {
                // 백엔드가 없는 경우 로컬 스토리지 사용 (기존 방식)
                if (!apiKey || apiKey.trim() === '') {
                    Storage.remove('aladinApiKey');
                    return this.defaultApiKey;
                }
                Storage.set('aladinApiKey', apiKey.trim());
                this.clearCache();
                return apiKey.trim();
            }
        } catch (error) {
            console.error('API 키 설정 오류:', error);
            throw error;
        }
    }

    /**
     * API 키 초기화 (기본값으로 복원)
     */
    async resetApiKey() {
        try {
            if (window.booksAPI) {
                const response = await window.booksAPI.resetApiKey();
                this.serverApiKey = this.defaultApiKey;
                this.clearCache();
                return response;
            } else {
                Storage.remove('aladinApiKey');
                this.clearCache();
                return this.defaultApiKey;
            }
        } catch (error) {
            console.error('API 키 초기화 오류:', error);
            throw error;
        }
    }

    /**
     * API 연결 테스트
     */
    async testApiConnection(apiKey = null) {
        try {
            if (window.booksAPI) {
                return await window.booksAPI.testApiKey(apiKey);
            } else {
                // 클라이언트 사이드 테스트 (기존 방식)
                const testKey = apiKey || await this.getApiKey();
                const result = await this.getBestsellers({ maxResults: 1 });
                return {
                    success: result && result.books && result.books.length > 0,
                    message: result && result.books && result.books.length > 0 
                        ? 'API 키가 정상적으로 작동합니다.' 
                        : 'API 연결에 실패했습니다.'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `API 연결 테스트 실패: ${error.message}`
            };
        }
    }

    /**
     * 서버 프록시를 통한 API 호출
     */
    async callAPI(endpoint, params) {
        // queryType을 포함한 캐시 키 생성
        const cacheKey = JSON.stringify({endpoint, ...params, timestamp: Math.floor(Date.now() / (5 * 60 * 1000))}); // 5분마다 캐시 갱신
        
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                console.log('캐시에서 반환:', endpoint, params);
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            // 기본 파라미터 추가
            const fullParams = {
                ...params,
                Version: this.version,
                output: 'JS',
                Cover: 'MidBig'
            };

            // 서버 프록시를 통해 API 호출
            const queryParams = new URLSearchParams({
                endpoint: endpoint,
                ...fullParams
            });
            const response = await fetch(`/api/books/aladin-proxy?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API 응답 받음:', endpoint, params, '결과 수:', data.item?.length || 0);
            
            // 캐시에 저장
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw new Error('API 호출 실패');
        }
    }

    /**
     * 도서 검색 (ItemSearch API)
     */
    async searchBooks(query, options = {}) {
        try {
            const params = {
                Query: query,
                QueryType: options.queryType || 'Title', // Keyword, Title, Author, Publisher
                MaxResults: Math.min(options.maxResults || 50, 50), // 최대 50개
                start: options.start || 1,
                SearchTarget: options.searchTarget || 'Book', // Book, Foreign, Music, DVD, Used, eBook, All
                Sort: options.sort || 'SalesPoint', // Accuracy, PublishTime, Title, SalesPoint, CustomerRating, MyReviewCount
                outofStockfilter: options.outofStockfilter || 0, // 품절 필터링
                RecentPublishFilter: options.recentPublishFilter || 0 // 최근 출간 필터 (월 단위)
            };

            // 카테고리 필터 추가
            if (options.categoryId && options.categoryId !== 'bestseller') {
                params.CategoryId = options.categoryId;
            }

            // 부가 정보 요청
            if (options.optResult) {
                params.OptResult = Array.isArray(options.optResult) 
                    ? options.optResult.join(',') 
                    : options.optResult;
            }

            const response = await this.callAPI('ItemSearch.aspx', params);
            return this.formatResponse(response);
        } catch (error) {
            console.error('도서 검색 오류:', error);
            throw error;
        }
    }

    /**
     * 상품 리스트 조회 (ItemList API)
     */
    async getItemList(queryType, options = {}) {
        try {
            const params = {
                QueryType: queryType, // ItemNewAll, ItemNewSpecial, ItemEditorChoice, Bestseller, BlogBest
                MaxResults: Math.min(options.maxResults || 50, 50),
                start: options.start || 1,
                SearchTarget: options.searchTarget || 'Book'
            };

            // 카테고리 필터
            if (options.categoryId) {
                params.CategoryId = options.categoryId;
            }

            // 베스트셀러 주간 설정
            if (queryType === 'Bestseller' && options.year && options.month && options.week) {
                params.Year = options.year;
                params.Month = options.month;
                params.Week = options.week;
            }

            // 부가 정보 요청
            if (options.optResult) {
                params.OptResult = Array.isArray(options.optResult) 
                    ? options.optResult.join(',') 
                    : options.optResult;
            }

            const response = await this.callAPI('ItemList.aspx', params);
            return this.formatResponse(response);
        } catch (error) {
            console.error('상품 리스트 조회 오류:', error);
            throw error;
        }
    }

    /**
     * 상품 상세 조회 (ItemLookUp API)
     */
    async getBookDetail(itemId, options = {}) {
        try {
            const params = {
                ItemId: itemId,
                ItemIdType: options.itemIdType || 'ISBN13' // ISBN, ISBN13, ItemId
            };

            // 부가 정보 요청 (상세 정보용)
            const defaultOptResult = [
                'ebookList', 'usedList', 'reviewList', 'ratingInfo', 
                'bestSellerRank', 'authors', 'fulldescription', 'Toc'
            ];
            
            params.OptResult = options.optResult 
                ? (Array.isArray(options.optResult) ? options.optResult.join(',') : options.optResult)
                : defaultOptResult.join(',');

            const response = await this.callAPI('ItemLookUp.aspx', params);
            
            if (response && response.item && response.item.length > 0) {
                return this.formatBookData(response.item[0]);
            }
            
            return null;
        } catch (error) {
            console.error('상품 상세 조회 오류:', error);
            throw error;
        }
    }

    /**
     * 베스트셀러 조회 (편의 메서드)
     */
    async getBestsellers(options = {}) {
        return await this.getItemList('Bestseller', options);
    }

    /**
     * 신간 도서 조회 (편의 메서드)
     */
    async getNewBooks(options = {}) {
        return await this.getItemList('ItemNewAll', options);
    }

    /**
     * 주목할 만한 신간 조회 (편의 메서드)
     */
    async getSpecialNewBooks(options = {}) {
        return await this.getItemList('ItemNewSpecial', options);
    }

    /**
     * 편집자 추천 도서 조회 (편의 메서드)
     */
    async getEditorChoice(options = {}) {
        // ItemEditorChoice는 CategoryId가 필수 (국내도서/음반/외서만 지원)
        const defaultOptions = {
            ...options,
            categoryId: options.categoryId || '0', // 0은 국내도서 전체
            searchTarget: 'Book'
        };
        return await this.getItemList('ItemEditorChoice', defaultOptions);
    }

    /**
     * 블로거 베스트셀러 조회 (편의 메서드)
     */
    async getBlogBest(options = {}) {
        return await this.getItemList('BlogBest', options);
    }

    /**
     * 카테고리별 도서 조회 (개선된 버전)
     */
    async getBooksByCategory(categoryId, options = {}) {
        try {
            // 베스트셀러 및 특별 리스트 처리
            if (categoryId === 'bestseller') {
                return await this.getBestsellers(options);
            } else if (categoryId === 'itemnewspecial') {
                return await this.getSpecialNewBooks(options);
            } else if (categoryId === 'itemnewall') {
                return await this.getNewBooks(options);
            } else if (categoryId === 'itemeditorchoice') {
                return await this.getEditorChoice(options);
            } else if (categoryId === 'blogbest') {
                return await this.getBlogBest(options);
            }

            // 카테고리별 검색어 매핑
            const categorySearchTerms = {
                '48803': ['초등', '1학년', '2학년', '저학년', '그림책'],  // 초등1~2학년
                '48804': ['초등', '3학년', '4학년', '중학년'],          // 초등3~4학년  
                '48805': ['초등', '5학년', '6학년', '고학년'],          // 초등5~6학년
                '48810': ['동화', '명작', '고전', '전래동화'],           // 동화명작고전
                '48813': ['사회', '역사', '철학', '인물'],              // 사회역사철학
                '48812': ['문화', '예술', '음악', '미술'],              // 문화예술인물
                '112080': ['학습만화', '만화', '웹툰']                  // 학습만화
            };

            // 과학수학컴퓨터 카테고리의 하위 카테고리 ID들
            const scienceMathSubcategories = [
                '48867', // 과학 일반
                '48868', // 과학자
                '48869', // 생물과 생명
                '49609', // 우리 몸
                '48870', // 지구와 우주
                '48871', // 초등 수학
                '128216', // 컴퓨터와 코딩
                '48872'  // 환경 이야기
            ];

            const allBooks = [];
            const maxResults = options.maxResults || 50;
            
            // 과학수학컴퓨터 카테고리는 하위 카테고리별 베스트셀러 조회
            if (categoryId === '48809') {
                // 각 하위 카테고리에서 베스트셀러 조회
                for (const subcategoryId of scienceMathSubcategories) {
                    if (allBooks.length >= maxResults) break;
                    
                    try {
                        const result = await this.getBestsellers({
                            maxResults: Math.min(8, Math.ceil((maxResults - allBooks.length) / (scienceMathSubcategories.length - scienceMathSubcategories.indexOf(subcategoryId)))),
                            start: 1,
                            categoryId: subcategoryId,
                            sort: options.sort || 'SalesPoint'
                        });
                        
                        if (result && result.books) {
                            // 중복 제거
                            const existingIsbns = new Set(allBooks.map(book => book.isbn13 || book.isbn));
                            const newBooks = result.books.filter(book => 
                                !existingIsbns.has(book.isbn13 || book.isbn)
                            );
                            allBooks.push(...newBooks);
                        }
                    } catch (error) {
                        console.warn(`하위 카테고리 "${subcategoryId}" 조회 실패:`, error);
                    }
                }
            } else {
                // 다른 카테고리는 기존 로직 사용
                // 1. 베스트셀러 조회
                try {
                    const bestsellerResult = await this.getBestsellers({
                        maxResults: Math.min(20, maxResults),
                        start: options.start || 1,
                        categoryId: categoryId,
                        sort: options.sort || 'SalesPoint'
                    });
                    
                    if (bestsellerResult && bestsellerResult.books) {
                        allBooks.push(...bestsellerResult.books);
                    }
                } catch (error) {
                    console.warn('베스트셀러 조회 실패:', error);
                }
            }

            // 2. 신간 조회 (ItemNewAll)
            if (allBooks.length < maxResults) {
                try {
                    const newBooksResult = await this.getNewBooks({
                        maxResults: Math.min(20, maxResults - allBooks.length),
                        start: 1,
                        categoryId: categoryId,
                        sort: options.sort || 'PublishTime'
                    });
                    
                    if (newBooksResult && newBooksResult.books) {
                        // 중복 제거
                        const existingIsbns = new Set(allBooks.map(book => book.isbn13 || book.isbn));
                        const newBooks = newBooksResult.books.filter(book => 
                            !existingIsbns.has(book.isbn13 || book.isbn)
                        );
                        allBooks.push(...newBooks);
                    }
                } catch (error) {
                    console.warn('신간 조회 실패:', error);
                }
            }

            // 3. 검색어 기반 추가 조회 (부족한 경우)
            if (allBooks.length < maxResults) {
                const searchTerms = categorySearchTerms[categoryId] || ['어린이'];
                
                for (const term of searchTerms) {
                    if (allBooks.length >= maxResults) break;
                    
                    try {
                        const searchResult = await this.searchBooks(term, {
                            maxResults: Math.min(10, maxResults - allBooks.length),
                            start: 1,
                            categoryId: categoryId,
                            sort: options.sort || 'SalesPoint',
                            queryType: 'Keyword'
                        });
                        
                        if (searchResult && searchResult.books) {
                            // 중복 제거
                            const existingIsbns = new Set(allBooks.map(book => book.isbn13 || book.isbn));
                            const newBooks = searchResult.books.filter(book => 
                                !existingIsbns.has(book.isbn13 || book.isbn)
                            );
                            allBooks.push(...newBooks);
                        }
                    } catch (error) {
                        console.warn(`검색어 "${term}" 조회 실패:`, error);
                    }
                }
            }

            // 결과 포맷팅
            const formattedBooks = allBooks.slice(0, maxResults).map(book => 
                typeof book.isbn13 !== 'undefined' ? book : this.formatBookData(book)
            );

            return {
                books: formattedBooks,
                totalResults: formattedBooks.length,
                hasMore: false,
                category: this.getCategoryName(categoryId)
            };

        } catch (error) {
            console.error('카테고리별 도서 조회 오류:', error);
            throw error;
        }
    }

    /**
     * 카테고리 이름 반환
     */
    getCategoryName(categoryId) {
        const categoryNames = {
            // 베스트셀러 및 특별 리스트 카테고리들
            'bestseller': '베스트셀러',
            'itemnewspecial': '주목할만한신간리스트',
            'itemnewall': '신간리스트',
            'itemeditorchoice': '편집자추천리스트',
            'blogbest': '블로거 베스트셀러',
            
            // 상위 카테고리들
            '48803': '초등1~2학년',
            '48804': '초등3~4학년',
            '48805': '초등5~6학년',
            '48810': '동화명작고전',
            '48813': '사회역사철학',
            '48809': '과학수학컴퓨터',
            '48812': '문화예술인물',
            '112080': '학습만화',
            
            // 초등1~2학년 하위 카테고리들
            '54856': '1학년 입학 준비',
            '48822': '과학/수학/사회',
            '48824': '그림책',
            '48825': '동화/명작/고전',
            '48826': '문화/예술/인물',
            '48827': '상식/교양',
            '48828': '자기계발',
            '48829': '책읽기/글쓰기',
            '48830': '초등 영어',
            '48831': '학습만화',
            
            // 초등3~4학년 하위 카테고리들
            '48834': '과학/수학/사회',
            '48837': '동화/명작/고전',
            '48838': '문화/예술/인물',
            '48839': '상식/교양',
            '48840': '자기계발',
            '48841': '책읽기/글쓰기',
            '48842': '초등 영어',
            '48843': '학습만화',
            
            // 초등5~6학년 하위 카테고리들
            '48844': '과학/수학/사회',
            '48846': '동화/명작/고전',
            '48847': '문화/예술/인물',
            '48848': '상식/교양',
            '48849': '자기계발',
            '48850': '중학교 선행 학습',
            '48851': '책읽기/글쓰기',
            '48852': '초등 영어',
            '48853': '학습만화',
            
            // 동화명작고전 하위 카테고리들
            '48873': '가족 이야기',
            '48874': '국내창작동화',
            '48875': '세계명작',
            '48876': '어린이를 위한 고전',
            '49220': '역사동화',
            '48877': '외국창작동화',
            '48878': '학교 이야기',
            '49223': '학습동화',
            
            // 사회역사철학 하위 카테고리들
            '89740': '사회 일반',
            '48905': '세계사',
            '48910': '신화/종교',
            '48907': '인권/평등',
            '48908': '전쟁/평화 이야기',
            '48909': '정치/경제/법',
            '48911': '지리/지도책',
            '48912': '철학',
            '48913': '통일을 생각해요',
            '48904': '초등 한국사',
            
            // 과학수학컴퓨터 하위 카테고리들
            '48867': '과학 일반',
            '48868': '과학자',
            '48869': '생물과 생명',
            '49609': '우리 몸',
            '48870': '지구와 우주',
            '48871': '초등 수학',
            '128216': '컴퓨터와 코딩',
            '48872': '환경 이야기',
            
            // 문화예술인물 하위 카테고리들
            '48897': '다문화 이야기',
            '48898': '미술관/박물관',
            '48900': '세계문화',
            '48899': '세계인물',
            '48901': '여성인물',
            '51820': '음악/미술/예체능',
            '51822': '직업의 세계',
            '48902': '한국인물',
            '48903': '한국전통문화'
        };
        return categoryNames[categoryId] || '어린이';
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
        // 이미지 URL을 고화질로 변경
        let coverUrl = item.cover;
        if (coverUrl) {
            // 알라딘 이미지 URL에서 크기 파라미터 변경
            // coversum -> cover500 (더 큰 이미지)
            coverUrl = coverUrl.replace('/coversum/', '/cover500/');
            // 또는 _sum -> _big 변경
            coverUrl = coverUrl.replace('_sum.', '_big.');
            // 또는 sum -> big 변경  
            coverUrl = coverUrl.replace('sum.jpg', 'big.jpg');
        }

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
            cover: coverUrl,
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
        console.log('API 캐시가 초기화되었습니다.');
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
 * 도서 상태 관리 클래스 (개선된 버전)
 */
class BookStatusManager {
    constructor() {
        this.ownedBooks = new Set();
        this.appliedBooks = new Set();
        this.currentClassId = null;
        this.serverCheckCache = new Map(); // 서버 확인 결과 캐시
        this.cacheDuration = 10 * 60 * 1000; // 10분 캐시
        this.pendingChecks = new Map(); // 중복 요청 방지
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
        
        let applied = Applications.getByClass(this.currentClassId);
        if (!Array.isArray(applied)) applied = [];
        this.appliedBooks = new Set(applied.map(app => app.isbn));
    }

    /**
     * 캐시에서 서버 확인 결과 조회
     */
    getCachedServerCheck(title, author) {
        const cacheKey = `${title}_${author || ''}`.toLowerCase();
        const cached = this.serverCheckCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.result;
        }
        
        return null;
    }

    /**
     * 서버 확인 결과를 캐시에 저장
     */
    setCachedServerCheck(title, author, result) {
        const cacheKey = `${title}_${author || ''}`.toLowerCase();
        this.serverCheckCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * 도서 목록의 모든 상태 업데이트 (개선된 버전)
     */
    async updateBooksStatus(books) {
        this.updateOwnedBooks();
        this.updateAppliedBooks();
        
        // 1단계: 로컬 데이터로 빠른 처리
        const updatedBooks = books.map(book => {
            const isbn = book.isbn13 || book.isbn;
            
            // 로컬 기보유 도서 확인
            book.isOwned = this.ownedBooks.has(isbn);
            book.isApplied = this.appliedBooks.has(isbn);
            
            // 캐시된 서버 확인 결과 적용
            const cachedResult = this.getCachedServerCheck(book.title, book.author);
            if (cachedResult && cachedResult.isOwned) {
                book.isOwned = true;
                book.matchedBook = cachedResult.matchedBook;
                book.matchType = cachedResult.matchType;
            }
            
            // 신청 가능 여부 결정
            this.updateBookApplyStatus(book);
            
            return book;
        });
        
        // 2단계: 백그라운드에서 서버 보유 여부 확인 (스마트 배치 처리)
        this.checkServerOwnedBooksInBackground(updatedBooks);
        
        return updatedBooks;
    }

    /**
     * 도서 신청 가능 상태 업데이트
     */
    updateBookApplyStatus(book) {
        if (book.isOwned) {
            book.canApply = false;
            book.statusText = '보유중';
            book.statusClass = 'owned';
        } else if (book.isApplied) {
            book.canApply = false;
            book.statusText = '신청완료';
            book.statusClass = 'applied';
        } else if (this.currentClassId && Budget.checkBudgetExceeded(this.currentClassId, book.price)) {
            book.canApply = false;
            book.statusText = '예산초과';
            book.statusClass = 'budget-exceeded';
        } else {
            book.canApply = true;
            book.statusText = '신청하기';
            book.statusClass = 'available';
        }
    }

    /**
     * 백그라운드에서 서버 도서관 보유 여부 확인 (스마트 배치 처리)
     */
    async checkServerOwnedBooksInBackground(books) {
        if (!window.booksAPI) return;
        
        try {
            // 서버 확인이 필요한 도서들만 스마트 필터링
            const booksToCheck = books.filter(book => {
                // 이미 보유중으로 확인된 도서는 제외
                if (book.isOwned) return false;
                
                // 캐시된 결과가 있으면 제외
                const cached = this.getCachedServerCheck(book.title, book.author);
                if (cached) return false;
                
                // 제목이 너무 짧거나 일반적인 단어만 있으면 제외 (오탐 방지)
                if (!book.title || book.title.length < 3) return false;
                
                // 일반적인 단어만 있는 제목 제외
                const commonWords = ['책', '이야기', '동화', '그림책', '만화', '소설'];
                const titleWords = book.title.split(/\s+/);
                if (titleWords.length <= 2 && titleWords.every(word => 
                    commonWords.some(common => word.includes(common))
                )) {
                    return false;
                }
                
                // 이미 확인 중인 도서는 제외
                const checkKey = `${book.title}_${book.author || ''}`;
                if (this.pendingChecks.has(checkKey)) return false;
                
                // 저자 정보가 있는 도서 우선 (매칭 정확도 높음)
                return true;
            });
            
            if (booksToCheck.length === 0) return;
            
            console.log(`📚 서버 보유 여부 확인 대상: ${booksToCheck.length}권 (전체 ${books.length}권 중)`);
            
            // 우선순위 기반 정렬
            booksToCheck.sort((a, b) => {
                // 1순위: 저자 정보가 있는 도서
                const aHasAuthor = a.author && a.author.trim().length > 0 ? 1 : 0;
                const bHasAuthor = b.author && b.author.trim().length > 0 ? 1 : 0;
                if (aHasAuthor !== bHasAuthor) return bHasAuthor - aHasAuthor;
                
                // 2순위: 제목이 긴 도서 (더 구체적)
                const titleLengthDiff = b.title.length - a.title.length;
                if (Math.abs(titleLengthDiff) > 5) return titleLengthDiff;
                
                // 3순위: 판매량이 높은 도서
                const salesA = a.salesPoint || 0;
                const salesB = b.salesPoint || 0;
                return salesB - salesA;
            });
            
            // 배치 크기를 동적으로 조정 (최대 5개로 줄임)
            const batchSize = Math.min(5, Math.max(2, Math.ceil(booksToCheck.length / 4)));
            
            for (let i = 0; i < booksToCheck.length; i += batchSize) {
                const batch = booksToCheck.slice(i, i + batchSize);
                
                // 배치 처리
                await this.processBatch(batch);
                
                // 배치 간 지연 (서버 부하 방지) - 더 긴 지연
                if (i + batchSize < booksToCheck.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
        } catch (error) {
            console.warn('서버 도서관 보유 여부 확인 실패:', error);
        }
    }

    /**
     * 배치 단위로 서버 확인 처리
     */
    async processBatch(books) {
        const promises = books.map(book => this.checkSingleBook(book));
        await Promise.allSettled(promises); // 일부 실패해도 계속 진행
    }

    /**
     * 개별 도서 서버 확인
     */
    async checkSingleBook(book) {
        const checkKey = `${book.title}_${book.author || ''}`;
        
        try {
            // 중복 요청 방지
            this.pendingChecks.set(checkKey, true);
            
            const availabilityCheck = await window.booksAPI.checkBookAvailability(
                book.title, 
                book.author, 
                book.isbn13 || book.isbn
            );
            
            // 결과 캐싱
            this.setCachedServerCheck(book.title, book.author, availabilityCheck);
            
            if (availabilityCheck.isOwned) {
                // 도서 상태 업데이트
                book.isOwned = true;
                book.canApply = false;
                book.statusText = '보유중';
                book.statusClass = 'owned';
                book.matchedBook = availabilityCheck.matchedBook;
                book.matchType = availabilityCheck.matchType;
                
                // UI에서 해당 도서 카드 업데이트
                this.updateBookCardInUI(book);
                
                console.log(`✅ 보유중 확인: ${book.title} (${availabilityCheck.matchType})`);
            } else {
                console.log(`✅ 신청가능 확인: ${book.title}`);
            }
            
        } catch (error) {
            console.warn(`❌ 도서 "${book.title}" 확인 실패:`, error.message);
            
            // 실패한 경우 짧은 시간 후 재시도 (최대 1회)
            if (!book._retryAttempted) {
                book._retryAttempted = true;
                setTimeout(() => {
                    this.checkSingleBook(book);
                }, 2000);
            }
        } finally {
            this.pendingChecks.delete(checkKey);
        }
    }

    /**
     * UI에서 개별 도서 카드 업데이트 (애니메이션 효과 추가)
     */
    updateBookCardInUI(book) {
        const isbn = book.isbn13 || book.isbn;
        const bookCard = document.querySelector(`[data-isbn="${isbn}"]`);
        
        if (bookCard) {
            // 부드러운 전환 효과
            bookCard.style.transition = 'all 0.3s ease';
            
            // 상태 오버레이 추가/업데이트
            let statusOverlay = bookCard.querySelector('.status-overlay');
            if (!statusOverlay) {
                statusOverlay = document.createElement('div');
                statusOverlay.className = 'status-overlay owned';
                statusOverlay.textContent = '보유중';
                statusOverlay.style.opacity = '0';
                bookCard.appendChild(statusOverlay);
                
                // 페이드인 효과
                setTimeout(() => {
                    statusOverlay.style.opacity = '1';
                }, 10);
            } else {
                statusOverlay.className = 'status-overlay owned';
                statusOverlay.textContent = '보유중';
            }
            
            // 신청 버튼 업데이트
            const applyBtn = bookCard.querySelector('.apply-btn');
            if (applyBtn) {
                applyBtn.className = 'apply-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors owned cursor-not-allowed opacity-60';
                applyBtn.textContent = '보유중';
                applyBtn.disabled = true;
                
                // 버튼 색상 변경 애니메이션
                applyBtn.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    applyBtn.style.transform = 'scale(1)';
                }, 150);
            }
            
            // 카드 전체에 보유중 표시 효과
            bookCard.classList.add('book-owned');
        }
    }

    /**
     * 특정 도서의 보유 여부 즉시 확인 (신청 시 사용)
     */
    async checkBookAvailabilityNow(book) {
        if (!window.booksAPI) {
            throw new Error('API 클라이언트가 초기화되지 않았습니다.');
        }
        
        // 캐시 확인
        const cached = this.getCachedServerCheck(book.title, book.author);
        if (cached) {
            return cached;
        }
        
        try {
            const result = await window.booksAPI.checkBookAvailability(
                book.title, 
                book.author, 
                book.isbn13 || book.isbn
            );
            
            // 결과 캐싱
            this.setCachedServerCheck(book.title, book.author, result);
            
            return result;
        } catch (error) {
            console.error('도서 보유 여부 즉시 확인 실패:', error);
            throw error;
        }
    }

    /**
     * 캐시 정리
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.serverCheckCache.entries()) {
            if (now - value.timestamp > this.cacheDuration) {
                this.serverCheckCache.delete(key);
            }
        }
    }

    /**
     * 통계 정보 반환
     */
    getStats() {
        return {
            cacheSize: this.serverCheckCache.size,
            pendingChecks: this.pendingChecks.size,
            ownedBooksCount: this.ownedBooks.size,
            appliedBooksCount: this.appliedBooks.size
        };
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
        this.lastResults = null;
        this.isLoading = false;
    }

    /**
     * 검색 실행
     */
    async search(query, options = {}) {
        if (this.isLoading) return null;
        try {
            this.isLoading = true;
            Loading.show('도서를 검색하고 있습니다...');
            
            this.currentQuery = query;
            this.currentPage = 1;
            
            const results = await this.api.searchBooks(query, options);
            if (results && results.books) {
                // 도서 상태 업데이트 (비동기)
                results.books = await this.status.updateBooksStatus(results.books);
                this.lastResults = results;
                return results;
            }
            return null;
        } catch (error) {
            console.error('검색 오류:', error);
            throw error;
        } finally {
            this.isLoading = false;
            Loading.hide();
        }
    }

    /**
     * 카테고리별 검색
     */
    async searchByCategory(categoryId, options = {}) {
        if (this.isLoading) return null;
        try {
            this.isLoading = true;
            Loading.show('도서를 불러오고 있습니다...');
            
            this.currentQuery = '';
            this.currentCategory = categoryId;
            this.currentPage = 1;
            
            let results;
            if (categoryId === 'bestseller') {
                results = await this.api.getBestsellers(options);
            } else {
                results = await this.api.getBooksByCategory(categoryId, options);
            }
            
            if (results && results.books) {
                // 도서 상태 업데이트 (비동기)
                results.books = await this.status.updateBooksStatus(results.books);
                this.lastResults = results;
                return results;
            }
            return null;
        } catch (error) {
            console.error('카테고리 검색 오류:', error);
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
        if (this.isLoading || !this.lastResults) {
            return null;
        }
        const nextPage = this.currentPage + 1;
        const maxResults = 50;
        if (nextPage > 4 || this.lastResults.books.length >= 200) {
            return null;
        }
        try {
            this.isLoading = true;
            const searchOptions = {
                maxResults: maxResults,
                start: (nextPage - 1) * maxResults + 1,
                sort: this.lastResults.sort || 'SalesPoint'
            };
            if (this.currentCategory === 'bestseller') {
                const now = new Date();
                searchOptions.Year = now.getFullYear();
                searchOptions.Month = now.getMonth() + 1;
                searchOptions.Week = Math.ceil((now.getDate() + (new Date(now.getFullYear(), now.getMonth(), 1).getDay())) / 7);
            }
            let newResults;
            if (this.currentQuery) {
                newResults = await this.api.searchBooks(this.currentQuery, searchOptions);
            } else {
                if (this.currentCategory === 'bestseller') {
                    newResults = await this.api.getBestsellers(searchOptions);
                } else {
                    newResults = await this.getMoreCategoryBooks(this.currentCategory, nextPage, searchOptions);
                }
            }
            if (!newResults || !Array.isArray(newResults.books)) {
                return null;
            }
            // 단순 누적: 기존 lastResults.books에 새 books를 추가
            this.lastResults.books = [...this.lastResults.books, ...newResults.books];
            this.lastResults.startIndex = newResults.startIndex;
            this.currentPage = nextPage;
            return {
                books: newResults.books,
                totalResults: Math.min(200, this.lastResults.totalResults),
                currentCount: this.lastResults.books.length
            };
        } catch (error) {
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 카테고리별 추가 도서 조회 (더보기용)
     */
    async getMoreCategoryBooks(categoryId, page, options) {
        try {
            const categorySearchTerms = {
                '48803': ['유아', '아기', '놀이', '학습', '색칠'],
                '48804': ['어린이', '학교', '친구', '모험', '탐험'],  
                '48805': ['청소년', '성장', '꿈', '진로', '리더십'],
                '48810': ['옛날이야기', '전설', '신화', '우화', '이솝'],
                '48813': ['세계사', '한국사', '위인', '나라', '문명'],
                '48809': ['실험', '발명', '우주', '자연', '환경'],
                '48812': ['그림', '음악', '춤', '연극', '영화'],
                '112080': ['코믹', '캐릭터', '애니메이션', '게임']
            };

            const searchTerms = categorySearchTerms[categoryId] || ['책', '이야기'];
            const searchTerm = searchTerms[(page - 2) % searchTerms.length];

            const searchParams = {
                Query: searchTerm,
                QueryType: 'Title',
                MaxResults: options.maxResults || 50,
                start: (page - 1) * (options.maxResults || 50) + 1,
                SearchTarget: 'Book',
                CategoryId: categoryId,
                Sort: options.sort || 'SalesPoint'
            };

            const response = await this.api.callAPI(searchParams);
            return this.api.formatResponse(response);
        } catch (error) {
            console.error('카테고리별 추가 도서 조회 오류:', error);
            return { books: [], totalResults: 0 };
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

// 클래스들을 전역으로 노출
window.AladinAPI = AladinAPI;
window.BookStatusManager = BookStatusManager;
window.SearchManager = SearchManager;

// 인스턴스들도 전역으로 노출
window.aladinAPI = aladinAPI;
window.bookStatusManager = bookStatusManager;
window.searchManager = searchManager; 