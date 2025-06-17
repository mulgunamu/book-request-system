/**
 * 수정된 알라딘 API 핸들러 - 페이지네이션 문제 해결
 * 알라딘 오픈API v2.0 기준 구현
 */

class AladinAPI {
    constructor() {
        this.apiKey = 'ttbgujeongmo2105001'; // 기본 API 키
        this.baseUrl = 'http://www.aladin.co.kr/ttb/api';
        this.version = '20131101';
        this.output = 'JS'; // JSON 출력
        this.maxResults = 50; // 한 번에 최대 50개 (알라딘 제한)
        this.requestDelay = 1000; // API 요청 간격 (1초)
        this.lastRequestTime = 0;
    }

    /**
     * API 요청 전 딜레이 처리
     */
    async enforceDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const delay = this.requestDelay - timeSinceLastRequest;
            console.log(`⏳ API 요청 딜레이: ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * 베스트셀러 목록 조회
     */
    async getBestSellers(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'Bestseller',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`📊 베스트셀러 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemList.aspx', params);
    }

    /**
     * 주목할 만한 신간 조회
     */
    async getSpecialBooks(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'ItemNewSpecial',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`✨ 주목할 만한 신간 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemList.aspx', params);
    }

    /**
     * 신간 전체 리스트 조회
     */
    async getNewBooks(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'ItemNewAll',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`🆕 신간 전체 리스트 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemList.aspx', params);
    }

    /**
     * 편집자 추천 도서 조회
     */
    async getEditorChoice(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'ItemEditorChoice',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`👨‍💼 편집자 추천 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemList.aspx', params);
    }

    /**
     * 블로거 베스트셀러 조회
     */
    async getBlogBest(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'BlogBest',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`📱 블로거 베스트 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemList.aspx', params);
    }

    /**
     * 카테고리별 도서 조회
     */
    async getCategoryBooks(categoryId, start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'Bestseller',
            CategoryId: categoryId,
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`📚 카테고리 도서 API 요청: categoryId=${categoryId}, start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemList.aspx', params);
    }

    /**
     * 도서 검색
     */
    async searchBooks(query, options = {}) {
        await this.enforceDelay();
        
        const {
            start = 1,
            maxResults = 50,
            queryType = 'Title',
            sort = 'SalesPoint',
            searchTarget = 'Book'
        } = options;
        
        const params = {
            ttbkey: this.apiKey,
            Query: encodeURIComponent(query),
            QueryType: queryType,
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: searchTarget,
            Sort: sort,
            output: this.output,
            Version: this.version
        };
        
        console.log(`🔍 도서 검색 API 요청: query="${query}", start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('/ItemSearch.aspx', params);
    }

    /**
     * 도서 상세 정보 조회
     */
    async getBookDetail(isbn) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            ItemId: isbn,
            ItemIdType: 'ISBN13',
            output: this.output,
            Version: this.version,
            OptResult: 'ebookList,usedList,reviewList'
        };
        
        console.log(`📖 도서 상세 API 요청: ISBN=${isbn}`);
        
        return await this.makeRequest('/ItemLookUp.aspx', params);
    }

    /**
     * API 요청 실행
     */
    async makeRequest(endpoint, params) {
        try {
            // URL 파라미터 생성
            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            
            const url = `${this.baseUrl}${endpoint}?${queryString}`;
            
            console.log(`🌐 API 요청 URL: ${url}`);
            
            // JSONP 방식으로 요청 (CORS 문제 해결)
            const response = await this.makeJSONPRequest(url);
            
            if (!response) {
                throw new Error('API 응답이 없습니다.');
            }
            
            // 응답 데이터 파싱 및 정리
            const books = this.parseResponse(response);
            
            const result = {
                books: books,
                meta: {
                    totalCount: response.totalResults || books.length,
                    currentPage: Math.ceil((params.start || 1) / (params.MaxResults || this.maxResults)),
                    hasMore: books.length === (params.MaxResults || this.maxResults)
                }
            };
            
            console.log(`✅ API 응답 성공: ${books.length}권 조회됨`);
            
            return result;
            
        } catch (error) {
            console.error('❌ API 요청 실패:', error);
            throw new Error(`알라딘 API 요청 실패: ${error.message}`);
        }
    }

    /**
     * JSONP 방식 API 요청
     */
    async makeJSONPRequest(url) {
        return new Promise((resolve, reject) => {
            // 콜백 함수명 생성
            const callbackName = 'aladinCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // 글로벌 콜백 함수 등록
            window[callbackName] = (data) => {
                // 스크립트 태그 제거
                document.head.removeChild(script);
                // 글로벌 함수 정리
                delete window[callbackName];
                resolve(data);
            };
            
            // 스크립트 태그 생성
            const script = document.createElement('script');
            script.src = `${url}&callback=${callbackName}`;
            script.onerror = () => {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('네트워크 오류가 발생했습니다.'));
            };
            
            // 타임아웃 설정 (10초)
            setTimeout(() => {
                if (window[callbackName]) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('API 요청 시간초과'));
                }
            }, 10000);
            
            // 스크립트 태그 추가
            document.head.appendChild(script);
        });
    }

    /**
     * API 응답 데이터 파싱
     */
    parseResponse(response) {
        try {
            const items = response.item || [];
            
            return items.map(item => ({
                // 기본 정보
                isbn: item.isbn13 || item.isbn,
                isbn13: item.isbn13,
                title: this.cleanTitle(item.title || ''),
                author: item.author || '',
                publisher: item.publisher || '',
                pubDate: item.pubDate || '',
                
                // 가격 정보
                priceStandard: parseInt(item.priceStandard) || 0,
                priceSales: parseInt(item.priceSales) || 0,
                
                // 이미지
                cover: item.cover || '',
                
                // 평점 및 리뷰
                customerReviewRank: parseFloat(item.customerReviewRank) || 0,
                reviewCount: parseInt(item.reviewCount) || 0,
                
                // 설명
                description: item.description || '',
                
                // 카테고리
                categoryId: item.categoryId || '',
                categoryName: item.categoryName || '',
                
                // 부가 정보
                ageLimit: item.ageLimit || '',
                
                // 원본 데이터 (디버깅용)
                _original: item
            }));
            
        } catch (error) {
            console.error('❌ 응답 파싱 실패:', error);
            return [];
        }
    }

    /**
     * 도서 제목 정리
     */
    cleanTitle(title) {
        return title
            .replace(/\s*\([^)]*\)\s*/g, '') // 괄호와 내용 제거
            .replace(/\s*\[[^\]]*\]\s*/g, '') // 대괄호와 내용 제거
            .replace(/\s+/g, ' ') // 연속된 공백 정리
            .trim();
    }

    /**
     * API 상태 확인
     */
    async checkApiStatus() {
        try {
            console.log('🔍 알라딘 API 상태 확인 중...');
            
            const result = await this.getBestSellers(1, 1);
            
            if (result && result.books && result.books.length > 0) {
                console.log('✅ 알라딘 API 정상 작동');
                return true;
            } else {
                console.warn('⚠️ 알라딘 API 응답이 비어있습니다.');
                return false;
            }
            
        } catch (error) {
            console.error('❌ 알라딘 API 상태 확인 실패:', error);
            return false;
        }
    }

    /**
     * API 키 설정
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        console.log(`🔑 알라딘 API 키가 설정되었습니다: ${apiKey.substring(0, 10)}...`);
    }

    /**
     * 디버그 모드 활성화
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log('🐛 알라딘 API 디버그 모드 활성화');
    }
}

// 전역 인스턴스 생성
const AladinAPI = new AladinAPI();

// 개발 환경에서는 디버그 모드 활성화
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    AladinAPI.enableDebugMode();
}

// API 상태 확인 (페이지 로드 시)
document.addEventListener('DOMContentLoaded', async () => {
    const isWorking = await AladinAPI.checkApiStatus();
    if (!isWorking) {
        console.warn('⚠️ 알라딘 API 연결에 문제가 있습니다. 관리자에게 문의하세요.');
    }
});

// 전역으로 내보내기
window.AladinAPI = AladinAPI;
