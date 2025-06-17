/**
 * kakao-api.js
 * 카카오 도서 검색 API 통신 모듈
 */

const KakaoAPI = (() => {
    /**
     * HTTP 요청을 보내는 기본 함수
     * @param {string} url - 요청 URL
     * @param {object} params - 검색 파라미터
     * @returns {Promise} - 응답 데이터
     */
    const request = async (url, params) => {
        try {
            // API 키 유효성 검사
            if (!Config.hasValidKakaoApiKey()) {
                throw new Error('카카오 API 키가 설정되지 않았습니다. 관리자 페이지에서 API 키를 설정해주세요.');
            }

            // URL 파라미터 생성
            const searchParams = new URLSearchParams(params);
            const requestUrl = `${url}?${searchParams.toString()}`;

            console.log('🔍 카카오 API 요청:', requestUrl);

            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    ...Config.getKakaoConfig().HEADERS,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('카카오 API 키가 유효하지 않습니다. 관리자 페이지에서 확인해주세요.');
                } else if (response.status === 429) {
                    throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
                } else {
                    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();
            console.log('✅ 카카오 API 응답:', data);
            
            return data;
        } catch (error) {
            console.error('❌ 카카오 API 오류:', error);
            throw error;
        }
    };

    /**
     * 도서 검색 결과를 표준 형식으로 변환
     * @param {object} book - 카카오 API 도서 데이터
     * @returns {object} - 표준화된 도서 정보
     */
    const normalizeBookData = (book) => {
        return {
            // 기본 정보
            id: book.isbn || `kakao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: book.title || '제목 없음',
            authors: Array.isArray(book.authors) ? book.authors : [book.authors || '작가 미상'],
            author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || '작가 미상'),
            publisher: book.publisher || '출판사 미상',
            
            // 가격 정보
            price: parseInt(book.price) || 0,
            salePrice: parseInt(book.sale_price) || parseInt(book.price) || 0,
            discountRate: book.price > 0 ? Math.round(((book.price - (book.sale_price || book.price)) / book.price) * 100) : 0,
            
            // 상세 정보
            thumbnail: book.thumbnail || '/images/no-image.png',
            isbn: book.isbn || '',
            datetime: book.datetime || new Date().toISOString(),
            contents: book.contents || '내용 정보가 없습니다.',
            url: book.url || '',
            
            // 분류
            category: '일반',
            
            // 메타데이터
            source: 'kakao',
            searchQuery: '', // 검색 시 설정
            searchTimestamp: new Date().toISOString()
        };
    };

    /**
     * 검색 파라미터 검증
     * @param {object} params - 검색 파라미터
     * @returns {boolean} - 유효성 여부
     */
    const validateSearchParams = (params) => {
        if (!params.query || params.query.trim().length < 2) {
            throw new Error('검색어는 2글자 이상 입력해주세요.');
        }
        
        if (params.page && (params.page < 1 || params.page > 50)) {
            throw new Error('페이지는 1~50 사이의 값이어야 합니다.');
        }
        
        if (params.size && (params.size < 1 || params.size > 50)) {
            throw new Error('페이지 크기는 1~50 사이의 값이어야 합니다.');
        }
        
        return true;
    };

    // ===== 공개 메서드 =====
    return {
        /**
         * 도서 검색
         * @param {object} params - 검색 파라미터
         * @param {string} params.query - 검색어
         * @param {string} [params.sort='accuracy'] - 정렬 방식 (accuracy, recency)
         * @param {number} [params.page=1] - 페이지 번호
         * @param {number} [params.size=20] - 페이지 크기
         * @param {string} [params.target='title'] - 검색 대상 (title, isbn, publisher, person)
         * @returns {Promise} - 검색 결과
         */
        searchBooks: async (params) => {
            try {
                // 기본값 설정
                const searchParams = {
                    query: params.query,
                    sort: params.sort || 'accuracy',
                    page: params.page || 1,
                    size: params.size || 20,
                    target: params.target || 'title'
                };

                // 파라미터 검증
                validateSearchParams(searchParams);

                // API 요청
                const response = await request(Config.getKakaoConfig().URL, searchParams);

                // 결과 정규화
                const normalizedBooks = response.documents.map(book => {
                    const normalized = normalizeBookData(book);
                    normalized.searchQuery = params.query;
                    return normalized;
                });

                return {
                    books: normalizedBooks,
                    meta: {
                        totalCount: response.meta.total_count,
                        pageableCount: response.meta.pageable_count,
                        isEnd: response.meta.is_end,
                        currentPage: searchParams.page,
                        pageSize: searchParams.size,
                        query: searchParams.query,
                        sort: searchParams.sort
                    }
                };
            } catch (error) {
                console.error('도서 검색 오류:', error);
                throw error;
            }
        },

        /**
         * 카테고리별 도서 검색
         * @param {string} categoryId - 카테고리 ID
         * @param {number} [page=1] - 페이지 번호
         * @param {number} [size=20] - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        searchByCategory: async (categoryId, page = 1, size = 20) => {
            const category = Config.getCategoryById(categoryId);
            
            if (!category) {
                throw new Error(`유효하지 않은 카테고리입니다: ${categoryId}`);
            }

            return await KakaoAPI.searchBooks({
                query: category.query,
                sort: category.sort,
                page: page,
                size: size
            });
        },

        /**
         * 인기 도서 검색 (어린이 도서 중심)
         * @param {number} [page=1] - 페이지 번호
         * @param {number} [size=20] - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        getPopularBooks: async (page = 1, size = 20) => {
            const queries = ['어린이 베스트', '초등학생 추천도서', '어린이 인기도서'];
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            
            return await KakaoAPI.searchBooks({
                query: randomQuery,
                sort: 'accuracy',
                page: page,
                size: size
            });
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

            return await KakaoAPI.searchBooks({
                query: isbn.trim(),
                target: 'isbn',
                size: 1
            });
        },

        /**
         * 저자로 도서 검색
         * @param {string} author - 저자명
         * @param {number} [page=1] - 페이지 번호
         * @param {number} [size=20] - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        searchByAuthor: async (author, page = 1, size = 20) => {
            if (!author || author.trim().length < 2) {
                throw new Error('저자명은 2글자 이상 입력해주세요.');
            }

            return await KakaoAPI.searchBooks({
                query: author.trim(),
                target: 'person',
                page: page,
                size: size,
                sort: 'recency'
            });
        },

        /**
         * 출판사로 도서 검색
         * @param {string} publisher - 출판사명
         * @param {number} [page=1] - 페이지 번호
         * @param {number} [size=20] - 페이지 크기
         * @returns {Promise} - 검색 결과
         */
        searchByPublisher: async (publisher, page = 1, size = 20) => {
            if (!publisher || publisher.trim().length < 2) {
                throw new Error('출판사명은 2글자 이상 입력해주세요.');
            }

            return await KakaoAPI.searchBooks({
                query: publisher.trim(),
                target: 'publisher',
                page: page,
                size: size,
                sort: 'recency'
            });
        },

        /**
         * API 상태 확인
         * @returns {Promise<boolean>} - API 사용 가능 여부
         */
        checkApiStatus: async () => {
            try {
                if (!Config.hasValidKakaoApiKey()) {
                    return false;
                }

                // 간단한 테스트 검색
                await KakaoAPI.searchBooks({
                    query: '테스트',
                    size: 1
                });
                
                return true;
            } catch (error) {
                console.error('카카오 API 상태 확인 실패:', error);
                return false;
            }
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.KakaoAPI = KakaoAPI;