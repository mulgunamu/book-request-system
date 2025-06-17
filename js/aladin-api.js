/**
 * aladin-api.js
 * 알라딘 도서 검색 API 연동 모듈
 */

const AladinAPI = (() => {
    // 캐시 관리
    let searchCache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5분

    /**
     * 캐시 키 생성
     */
    const createCacheKey = (query, options) => {
        return `${query}_${options.start || 1}_${options.maxResults || 20}_${options.categoryId || '0'}`;
    };

    /**
     * 캐시에서 검색 결과 가져오기
     */
    const getFromCache = (cacheKey) => {
        const cached = searchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }
        return null;
    };

    /**
     * 캐시에 검색 결과 저장
     */
    const saveToCache = (cacheKey, data) => {
        searchCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        // 캐시 크기 제한 (최대 50개)
        if (searchCache.size > 50) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }
    };

    /**
     * 알라딘 API URL 생성
     */
    const buildApiUrl = (query, options = {}) => {
        const config = Config.getAladinConfig();
        const ttbKey = Config.getAladinApiKey();
        
        if (!ttbKey) {
            throw new Error(Config.getErrorMessages().API_KEY_REQUIRED);
        }

        const params = new URLSearchParams({
            ttbkey: ttbKey,
            Query: query,
            QueryType: options.queryType || 'Keyword',
            MaxResults: options.maxResults || 20,
            start: options.start || 1,
            SearchTarget: config.SEARCH_TARGET,
            output: config.OUTPUT,
            Version: config.VERSION,
            Cover: config.COVER,
            Sort: options.sort || 'Accuracy'
        });

        // 카테고리 ID가 있으면 추가
        if (options.categoryId && options.categoryId !== '0') {
            params.append('CategoryId', options.categoryId);
        }

        return `${config.BASE_URL}?${params.toString()}`;
    };

    /**
     * 도서 정보 정규화
     */
    const normalizeBookData = (book) => {
        return {
            id: book.isbn13 || book.isbn || `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: book.title || '제목 없음',
            author: book.author || '저자 미상',
            authors: book.author ? book.author.split(',').map(a => a.trim()) : ['저자 미상'],
            publisher: book.publisher || '출판사 미상',
            thumbnail: book.cover || '',
            price: parseInt(book.priceStandard) || 0,
            salePrice: parseInt(book.priceSales) || parseInt(book.priceStandard) || 0,
            isbn: book.isbn13 || book.isbn || '',
            isbn13: book.isbn13 || '',
            url: book.link || '',
            pubDate: book.pubDate || '',
            description: book.description || '',
            categoryName: book.categoryName || '',
            // 추가 정보
            finalPrice: parseInt(book.priceSales) || parseInt(book.priceStandard) || 0,
            publishDate: book.pubDate || '',
            hasDiscount: (parseInt(book.priceStandard) || 0) > (parseInt(book.priceSales) || 0),
            discountRate: book.priceStandard && book.priceSales ? 
                Math.round((1 - parseInt(book.priceSales) / parseInt(book.priceStandard)) * 100) : 0,
            source: 'aladin'
        };
    };

    /**
     * 알라딘 API 응답 파싱 (JSONP 방식)
     */
    const parseAladinResponse = (jsCode) => {
        return new Promise((resolve, reject) => {
            try {
                // 전역 콜백 함수 생성
                window.aladinCallback = (data) => {
                    delete window.aladinCallback;
                    resolve(data);
                };
                
                // JS 코드 실행 (알라딘은 콜백 함수 호출 형태로 응답)
                const modifiedJs = jsCode.replace(/^[^(]*\(/, 'aladinCallback(');
                eval(modifiedJs);
            } catch (error) {
                delete window.aladinCallback;
                reject(new Error('API 응답 파싱 오류: ' + error.message));
            }
        });
    };

    return {
        /**
         * 도서 검색
         * @param {string} query - 검색어
         * @param {object} options - 검색 옵션
         * @returns {Promise} - 검색 결과
         */
        searchBooks: async (query, options = {}) => {
            try {
                if (!query || query.trim().length < 2) {
                    throw new Error('검색어는 2글자 이상 입력해주세요.');
                }

                const normalizedQuery = query.trim();
                const cacheKey = createCacheKey(normalizedQuery, options);

                // 캐시 확인
                const cachedResult = getFromCache(cacheKey);
                if (cachedResult) {
                    return cachedResult;
                }

                // API 요청
                const url = buildApiUrl(normalizedQuery, options);
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API 요청 실패: ${response.status}`);
                }

                const jsCode = await response.text();
                const data = await parseAladinResponse(jsCode);

                if (!data || !data.item) {
                    return {
                        books: [],
                        meta: {
                            totalCount: 0,
                            pageableCount: 0,
                            isEnd: true,
                            currentPage: 1,
                            totalPages: 1,
                            pageSize: options.maxResults || 20
                        },
                        query: normalizedQuery,
                        timestamp: new Date().toISOString()
                    };
                }

                // 도서 정보 정규화
                const normalizedBooks = data.item
                    .filter(book => book && book.isbn13) // 유효한 도서만 필터링
                    .map(normalizeBookData);

                const result = {
                    books: normalizedBooks,
                    meta: {
                        totalCount: data.totalResults || 0,
                        pageableCount: Math.min(data.totalResults || 0, 1000), // 알라딘 최대 1000개
                        isEnd: (options.start || 1) + normalizedBooks.length >= (data.totalResults || 0),
                        currentPage: Math.ceil((options.start || 1) / (options.maxResults || 20)),
                        totalPages: Math.ceil((data.totalResults || 0) / (options.maxResults || 20)),
                        pageSize: options.maxResults || 20
                    },
                    query: normalizedQuery,
                    timestamp: new Date().toISOString()
                };

                // 캐시에 저장
                if (normalizedBooks.length > 0) {
                    saveToCache(cacheKey, result);
                }

                return result;

            } catch (error) {
                console.error('알라딘 도서 검색 오류:', error);
                throw error;
            }
        },

        /**
         * 카테고리별 도서 검색
         * @param {string} categoryId - 카테고리 ID
         * @param {number} page - 페이지 번호
         * @param {number} size - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        searchByCategory: async (categoryId, page = 1, size = 20) => {
            try {
                const category = Config.getCategoryById(categoryId);
                
                if (!category) {
                    throw new Error(`유효하지 않은 카테고리입니다: ${categoryId}`);
                }

                const options = {
                    start: (page - 1) * size + 1,
                    maxResults: size,
                    sort: category.sort || 'Accuracy',
                    categoryId: category.categoryId,
                    queryType: 'Keyword'
                };

                const result = await AladinAPI.searchBooks(category.query, options);
                return {
                    ...result,
                    categoryId: categoryId,
                    categoryName: category.name
                };
            } catch (error) {
                console.error('카테고리별 도서 검색 오류:', error);
                throw error;
            }
        },

        /**
         * 인기 도서 검색 (어린이 도서 중심)
         * @param {number} page - 페이지 번호
         * @param {number} size - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        getPopularBooks: async (page = 1, size = 20) => {
            const options = {
                start: (page - 1) * size + 1,
                maxResults: size,
                sort: 'SalesPoint', // 판매량순
                categoryId: '0', // 전체 카테고리
                queryType: 'Keyword'
            };

            const result = await AladinAPI.searchBooks('어린이', options);
            
            return {
                ...result,
                isPopular: true,
                keyword: '어린이',
                category: 'children'
            };
        },

        /**
         * ISBN으로 도서 검색
         * @param {string} isbn - ISBN 번호
         * @returns {Promise} - 검색 결과
         */
        searchByISBN: async (isbn) => {
            if (!isbn || isbn.trim().length < 10) {
                throw new Error('유효한 ISBN을 입력해주세요.');
            }

            const options = {
                queryType: 'ISBN',
                maxResults: 1
            };

            return await AladinAPI.searchBooks(isbn.trim(), options);
        },

        /**
         * 베스트셀러 조회
         * @param {string} categoryId - 카테고리 ID
         * @param {number} page - 페이지 번호
         * @param {number} size - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        getBestsellers: async (categoryId = '0', page = 1, size = 20) => {
            const options = {
                start: (page - 1) * size + 1,
                maxResults: size,
                sort: 'SalesPoint',
                categoryId: categoryId,
                queryType: 'Bestseller'
            };

            return await AladinAPI.searchBooks('', options);
        },

        /**
         * 신간 도서 조회
         * @param {string} categoryId - 카테고리 ID
         * @param {number} page - 페이지 번호
         * @param {number} size - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        getNewBooks: async (categoryId = '0', page = 1, size = 20) => {
            const options = {
                start: (page - 1) * size + 1,
                maxResults: size,
                sort: 'PublishTime',
                categoryId: categoryId,
                queryType: 'Keyword'
            };

            return await AladinAPI.searchBooks('어린이', options);
        },

        /**
         * API 상태 확인
         * @returns {Promise<boolean>} - API 사용 가능 여부
         */
        checkApiStatus: async () => {
            try {
                const ttbKey = Config.getAladinApiKey();
                if (!ttbKey) {
                    return false;
                }

                // 간단한 테스트 검색
                await AladinAPI.searchBooks('테스트', { maxResults: 1 });
                return true;
            } catch (error) {
                console.error('알라딘 API 상태 확인 오류:', error);
                return false;
            }
        },

        /**
         * 캐시 초기화
         */
        clearCache: () => {
            searchCache.clear();
        },

        /**
         * 캐시 통계
         */
        getCacheStats: () => {
            return {
                size: searchCache.size,
                keys: Array.from(searchCache.keys())
            };
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.AladinAPI = AladinAPI; 