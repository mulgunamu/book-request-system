/**
 * book-search.js - 서버 연동 도서 검색 모듈
 */

const BookSearch = (() => {
    // 서버 API 엔드포인트
    const API_BASE_URL = window.location.origin;
    const ENDPOINTS = {
        KAKAO_SEARCH: '/api/search/kakao',
        API_HEALTH: '/api/health'
    };
    
    // 캐시 관리
    let searchCache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5분
    
    /**
     * 서버 상태 확인
     */
    const checkServerHealth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${ENDPOINTS.API_HEALTH}`);
            const health = await response.json();
            
            return {
                isHealthy: health.status === 'healthy',
                hasKakaoKey: health.apiKeys?.kakao || false,
                hasAladinKey: health.apiKeys?.aladin || false
            };
        } catch (error) {
            console.error('서버 상태 확인 오류:', error);
            return {
                isHealthy: false,
                hasKakaoKey: false,
                hasAladinKey: false
            };
        }
    };
    
    /**
     * 캐시 키 생성
     */
    const createCacheKey = (query, page, size) => {
        return `${query}_${page}_${size}`.toLowerCase();
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
     * 도서 정보 정규화
     */
    const normalizeBookData = (book) => {
        return {
            title: book.title || '제목 없음',
            author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || '저자 미상'),
            publisher: book.publisher || '출판사 미상',
            thumbnail: book.thumbnail || '',
            price: parseInt(book.price) || 0,
            salePrice: parseInt(book.sale_price) || 0,
            isbn: book.isbn || '',
            url: book.url || '',
            datetime: book.datetime || '',
            translators: Array.isArray(book.translators) ? book.translators.join(', ') : (book.translators || ''),
            status: book.status || '',
            // 추가 정보
            finalPrice: parseInt(book.sale_price) || parseInt(book.price) || 0,
            publishDate: book.datetime ? new Date(book.datetime).toLocaleDateString('ko-KR') : '',
            hasDiscount: (parseInt(book.price) || 0) > (parseInt(book.sale_price) || 0)
        };
    };
    
    /**
     * 카카오 도서 검색
     */
    const searchKakaoBooks = async (query, page = 1, size = 50) => {
        try {
            // 입력 검증
            if (!query || query.trim().length === 0) {
                throw new Error('검색어를 입력해주세요.');
            }
            
            const normalizedQuery = query.trim();
            const cacheKey = createCacheKey(normalizedQuery, page, size);
            
            // 캐시에서 확인
            const cachedResult = getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }
            
            // 서버 상태 확인
            const serverHealth = await checkServerHealth();
            if (!serverHealth.isHealthy) {
                throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
            }
            
            if (!serverHealth.hasKakaoKey) {
                throw new Error('카카오 API 키가 설정되지 않았습니다. 관리자에게 문의하세요.');
            }
            
            // API 요청 URL 생성
            const url = new URL(`${API_BASE_URL}${ENDPOINTS.KAKAO_SEARCH}`);
            url.searchParams.set('query', normalizedQuery);
            url.searchParams.set('page', page.toString());
            url.searchParams.set('size', size.toString());
            
            // 서버에 검색 요청
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `검색 요청 실패: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 도서 정보 정규화
            const normalizedBooks = data.documents.map(normalizeBookData);
            
            const result = {
                books: normalizedBooks,
                meta: {
                    totalCount: data.meta.total_count || 0,
                    pageableCount: data.meta.pageable_count || 0,
                    isEnd: data.meta.is_end || false,
                    currentPage: page,
                    totalPages: Math.ceil((data.meta.pageable_count || 0) / size)
                },
                query: normalizedQuery,
                timestamp: new Date().toISOString()
            };
            
            // 캐시에 저장
            saveToCache(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error('카카오 도서 검색 오류:', error);
            throw error;
        }
    };
    
    /**
     * 인기 도서 검색 (추천 키워드)
     */
    const getPopularBooks = async () => {
        const popularKeywords = [
            '베스트셀러', '신간', '추천도서', '문학', '소설',
            '자기계발', '경제경영', '과학', '역사', '에세이'
        ];
        
        try {
            const randomKeyword = popularKeywords[Math.floor(Math.random() * popularKeywords.length)];
            const result = await searchKakaoBooks(randomKeyword, 1, 20);
            
            return {
                ...result,
                isPopular: true,
                keyword: randomKeyword
            };
        } catch (error) {
            console.error('인기 도서 조회 오류:', error);
            throw error;
        }
    };
    
    /**
     * 도서 상세 정보 가져오기 (ISBN 기반)
     */
    const getBookDetails = async (isbn) => {
        try {
            if (!isbn) {
                throw new Error('ISBN이 필요합니다.');
            }
            
            // ISBN으로 검색
            const result = await searchKakaoBooks(isbn, 1, 1);
            
            if (result.books.length > 0) {
                return result.books[0];
            } else {
                throw new Error('해당 ISBN의 도서를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('도서 상세 정보 조회 오류:', error);
            throw error;
        }
    };
    
    /**
     * 검색 제안어 생성
     */
    const getSearchSuggestions = (query) => {
        const suggestions = [];
        
        if (query && query.length >= 2) {
            // 간단한 제안어 로직
            const commonSuffixes = ['소설', '에세이', '시집', '전집', '선집'];
            const commonPrefixes = ['신간', '베스트', '추천'];
            
            commonSuffixes.forEach(suffix => {
                if (!query.includes(suffix)) {
                    suggestions.push(`${query} ${suffix}`);
                }
            });
            
            commonPrefixes.forEach(prefix => {
                if (!query.includes(prefix)) {
                    suggestions.push(`${prefix} ${query}`);
                }
            });
        }
        
        return suggestions.slice(0, 5); // 최대 5개까지
    };
    
    /**
     * 캐시 관리
     */
    const clearCache = () => {
        searchCache.clear();
    };
    
    const getCacheStats = () => {
        return {
            size: searchCache.size,
            keys: Array.from(searchCache.keys())
        };
    };
    
    // 공개 API 반환
    return {
        // 주요 검색 기능
        searchBooks: searchKakaoBooks,
        getPopularBooks,
        getBookDetails,
        
        // 유틸리티 기능
        getSearchSuggestions,
        checkServerHealth,
        
        // 캐시 관리
        clearCache,
        getCacheStats,
        
        // 상수
        CACHE_DURATION,
        API_BASE_URL
    };
})();

// 전역 사용을 위한 모듈 등록
if (typeof window !== 'undefined') {
    window.BookSearch = BookSearch;
}

// Node.js 환경에서의 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookSearch;
}