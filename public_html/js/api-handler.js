/**
 * 수정된 알라딘 API 핸들러 - 페이지네이션 문제 해결
 * 알라딘 오픈API v2.0 기준 구현
 */

class AladinAPI {
    constructor() {
        this.apiKey = 'ttbgujeongmo2105001'; // 기본 API 키
        this.baseUrl = '/api/books/aladin-proxy'; // 백엔드 프록시 엔드포인트
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
        
        // 현재 날짜 기준으로 주간 계산
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentWeek = Math.ceil((now.getDate() + (new Date(now.getFullYear(), now.getMonth(), 1).getDay())) / 7);
        
        // 이전 주간 계산
        const prevWeek = Math.max(1, currentWeek - 1);
        const prevMonth = currentWeek === 1 ? Math.max(1, currentMonth - 1) : currentMonth;
        const prevYear = currentWeek === 1 && currentMonth === 1 ? currentYear - 1 : currentYear;
        
        // 현재 주간 데이터 조회
        const currentParams = {
            ttbkey: this.apiKey,
            QueryType: 'Bestseller',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version,
            Year: currentYear,
            Month: currentMonth,
            Week: currentWeek
        };
        
        console.log(`📊 현재 주간 베스트셀러 API 요청: start=${start}, maxResults=${maxResults}, Year=${currentYear}, Month=${currentMonth}, Week=${currentWeek}`);
        
        const currentResult = await this.makeRequest('ItemList.aspx', currentParams);
        
        // 현재 주간 데이터가 100권 미만이면 이전 주간 데이터도 조회
        if (currentResult.meta.totalCount < 100 && start > 100) {
            console.log(`📊 이전 주간 베스트셀러 조회: Year=${prevYear}, Month=${prevMonth}, Week=${prevWeek}`);
            
            const prevParams = {
                ...currentParams,
                Year: prevYear,
                Month: prevMonth,
                Week: prevWeek,
                start: start - 100 // 이전 주간에서의 시작 위치 조정
            };
            
            const prevResult = await this.makeRequest('ItemList.aspx', prevParams);
            
            // 이전 주간 데이터 반환
            return {
                books: prevResult.books,
                meta: {
                    totalCount: prevResult.meta.totalCount + 100, // 현재 주간 100권 + 이전 주간 데이터
                    currentPage: Math.ceil(start / maxResults),
                    hasMore: prevResult.books.length === maxResults
                }
            };
        }
        
        // 현재 주간 데이터 반환
        return {
            books: currentResult.books,
            meta: {
                totalCount: currentResult.meta.totalCount,
                currentPage: Math.ceil(start / maxResults),
                hasMore: currentResult.books.length === maxResults
            }
        };
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
        
        return await this.makeRequest('ItemList.aspx', params);
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
        
        return await this.makeRequest('ItemList.aspx', params);
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
        
        return await this.makeRequest('ItemList.aspx', params);
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
        
        return await this.makeRequest('ItemList.aspx', params);
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
        
        return await this.makeRequest('ItemList.aspx', params);
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
        
        return await this.makeRequest('ItemSearch.aspx', params);
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
        
        return await this.makeRequest('ItemLookUp.aspx', params);
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
            
            const url = `${this.baseUrl}?endpoint=${endpoint}&${queryString}`;
            
            console.log(`🌐 API 요청 URL: ${url}`);
            
            // fetch를 사용하여 프록시를 통해 요청
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data) {
                throw new Error('API 응답이 없습니다.');
            }
            
            // 응답 데이터 파싱 및 정리
            const books = this.parseResponse(data);
            
            // 순위 정보 추가
            const startRank = parseInt(params.start) || 1;
            books.forEach((book, index) => {
                book.rank = startRank + index;
            });
            
            const result = {
                books: books,
                meta: {
                    totalCount: data.totalResults || books.length,
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
     * JSONP 방식 API 요청 (더 이상 사용하지 않음)
     */
    async makeJSONPRequest(url) {
        throw new Error('JSONP 요청은 더 이상 지원되지 않습니다.');
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

// 개발 환경에서는 디버그 모드 활성화
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    AladinAPI.enableDebugMode();
}

// API 상태 확인 (페이지 로드 시)
document.addEventListener('DOMContentLoaded', async () => {
    const isWorking = await window.AladinAPI.checkApiStatus();
    if (!isWorking) {
        console.warn('⚠️ 알라딘 API 연결에 문제가 있습니다. 관리자에게 문의하세요.');
    }
});

// 전역으로 내보내기
// 전역으로 내보내기
const AladinAPIInstance = new AladinAPI();
window.AladinAPI = AladinAPIInstance;        // 클래스 자체 (정적 메서드용)
window.aladinAPI = AladinAPIInstance; // 인스턴스 (인스턴스 메서드용)
