/**
 * 백엔드 API 클라이언트
 */

class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiURL = `${this.baseURL}/api`;
    }

    /**
     * HTTP 요청 헬퍼
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API 요청 오류 (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * GET 요청
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST 요청
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT 요청
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE 요청
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * 파일 업로드 요청
     */
    async uploadFile(endpoint, formData) {
        const url = `${this.apiURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: '파일 업로드 실패' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`파일 업로드 오류 (${endpoint}):`, error);
            throw error;
        }
    }
}

/**
 * 도서 신청 API
 */
class ApplicationsAPI {
    constructor(client) {
        this.client = client;
    }

    // 전체 신청 목록 조회
    async getAll() {
        return this.client.get('/applications');
    }

    // 학급별 신청 목록 조회
    async getByClass(classId) {
        return this.client.get(`/applications/class/${classId}`);
    }

    // 신청 추가
    async create(applicationData) {
        return this.client.post('/applications', applicationData);
    }

    // 신청 삭제
    async delete(applicationId) {
        return this.client.delete(`/applications/${applicationId}`);
    }

    // 학급별 예산 현황 조회
    async getBudgetStatus(classId) {
        return this.client.get(`/applications/budget/${classId}`);
    }

    // 중복 신청 확인
    async checkDuplicate(classId, isbn) {
        return this.client.get(`/applications/check-duplicate/${classId}/${isbn}`);
    }
}

/**
 * 학급 관리 API
 */
class ClassesAPI {
    constructor(apiClient = null) {
        this.apiClient = apiClient || new APIClient();
    }

    /**
     * 전체 학급 목록 조회
     */
    async getClasses() {
        return await this.apiClient.get('/classes');
    }

    /**
     * 특정 학급 정보 조회
     */
    async getClass(classId) {
        return await this.apiClient.get(`/classes/${classId}`);
    }

    /**
     * 학급 정보 업데이트
     */
    async updateClass(classId, data) {
        return await this.apiClient.put(`/classes/${classId}`, data);
    }

    /**
     * 학급별 예산 조회
     */
    async getClassBudget(classId) {
        return await this.apiClient.get(`/classes/${classId}/budget`);
    }

    /**
     * 학급별 예산 설정
     */
    async setClassBudget(classId, budget) {
        return await this.apiClient.put(`/classes/${classId}/budget`, { budget });
    }

    /**
     * 학급별 통계 조회
     */
    async getClassStats(classId) {
        return await this.apiClient.get(`/classes/${classId}/stats`);
    }

    /**
     * 전체 학급 통계 조회 (관리자용)
     */
    async getAllStats() {
        return await this.apiClient.get('/classes/admin/stats');
    }

    // 새로운 학급 설정 관리 메서드들

    /**
     * 학급 설정 조회
     */
    async getClassSettings() {
        return await this.apiClient.get('/classes/settings');
    }

    /**
     * 학급 설정 저장
     */
    async saveClassSettings(data) {
        return await this.apiClient.post('/classes/settings', data);
    }

    /**
     * 학급 삭제
     */
    async deleteClass(classId) {
        return await this.apiClient.delete(`/classes/settings/${classId}`);
    }

    /**
     * 전체 예산 균등 분배
     */
    async distributeBudget(totalBudget) {
        return await this.apiClient.post('/classes/budget/distribute', { totalBudget });
    }

    /**
     * 개별 학급 예산 수정
     */
    async updateClassBudget(classId, budget) {
        return await this.apiClient.put(`/classes/budget/${classId}`, { budget });
    }

    /**
     * 학급 정보 일괄 업데이트
     */
    async bulkUpdateClasses(classes) {
        return await this.apiClient.post('/classes/bulk-update', { classes });
    }

    /**
     * CSV 데이터로 학급 정보 가져오기
     */
    async importCsv(csvData) {
        return await this.apiClient.post('/classes/import-csv', { csvData });
    }

    /**
     * 예산 현황 조회
     */
    async getBudgetStatus() {
        return await this.apiClient.get('/classes/budget-status');
    }
}

/**
 * 기보유 도서 API
 */
class BooksAPI {
    constructor(client) {
        this.client = client;
    }

    // 기보유 도서 목록 조회
    async getOwned() {
        return this.client.get('/books/owned');
    }

    // 기보유 도서 목록 조회 (관리자 페이지 호환용)
    async getOwnedBooks() {
        return this.getOwned();
    }

    // 기보유 도서 추가
    async addOwned(bookData) {
        return this.client.post('/books/owned', bookData);
    }

    // 기보유 도서 삭제 (제목+저자 기반)
    async deleteOwned(title, author) {
        // 제목+저자를 정규화하여 식별자 생성
        const normalizeText = (text) => {
            if (!text) return '';
            return text.replace(/[^\w가-힣]/g, '').toLowerCase().trim();
        };
        
        const identifier = `${normalizeText(title)}_${normalizeText(author || '')}`;
        return this.client.delete(`/books/owned/${identifier}`);
    }

    // 기보유 도서 삭제 (관리자 페이지 호환용)
    async deleteOwnedBook(title, author) {
        return this.deleteOwned(title, author);
    }

    // CSV 파일로 기보유 도서 일괄 업로드
    async uploadOwnedCSV(file) {
        const formData = new FormData();
        formData.append('csvFile', file);
        return this.client.uploadFile('/books/owned/upload-csv', formData);
    }

    // CSV 파일 업로드 (관리자 페이지 호환용)
    async uploadCsv(file) {
        return this.uploadOwnedCSV(file);
    }

    // 도서 소유 여부 확인 (제목+저자 기반)
    async checkOwned(title, author) {
        const params = new URLSearchParams({ title });
        if (author) params.append('author', author);
        
        return this.client.get(`/books/owned/check?${params}`);
    }

    // 기보유 도서 통계
    async getOwnedStats() {
        return this.client.get('/books/owned/stats');
    }
    
    // API 키 관리 메서드들
    
    // 현재 API 키 조회
    async getApiKey() {
        return this.client.get('/books/api-key');
    }
    
    // 실제 API 키 조회 (내부 사용용)
    async getActualApiKey() {
        return this.client.get('/books/api-key/actual');
    }
    
    // API 키 설정
    async setApiKey(apiKey) {
        return this.client.put('/books/api-key', { apiKey });
    }
    
    // API 키 초기화 (기본값으로 복원)
    async resetApiKey() {
        const response = await fetch('/api/books/api-key', {
            method: 'DELETE'
        });
        return await response.json();
    }
    
    // API 키 연결 테스트
    async testApiKey(apiKey = null) {
        const response = await fetch('/api/books/api-key/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey })
        });
        return await response.json();
    }

    // 도서관 보유 도서 CSV 업로드
    async uploadLibraryHoldingsCsv(file) {
        const formData = new FormData();
        formData.append('csvFile', file);
        
        const response = await fetch('/api/books/library-holdings/upload-csv', {
            method: 'POST',
            body: formData
        });
        return await response.json();
    }

    // 도서관 보유 도서 검색
    async searchLibraryHoldings(title, author = null) {
        const params = new URLSearchParams({ title });
        if (author) params.append('author', author);
        
        const response = await fetch(`/api/books/library-holdings/search?${params}`);
        return await response.json();
    }

    // 도서 신청 가능 여부 확인 (제목+저자 기반)
    async checkBookAvailability(title, author, isbn = null) {
        try {
            console.log('🔍 프론트엔드: checkBookAvailability 호출', { title, author, isbn });
            
            const response = await fetch('/api/books/check-availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    books: [{ title, author, isbn }] 
                })
            });
            
            console.log('🔍 프론트엔드: 응답 상태', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('🔍 프론트엔드: 응답 오류 내용', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('🔍 프론트엔드: 파싱된 응답', result);
            
            // 단일 도서 결과 반환 (배열의 첫 번째 요소)
            if (result.results && result.results.length > 0) {
                return result.results[0];
            }
            
            return result;
        } catch (error) {
            console.error('🔍 프론트엔드: checkBookAvailability 오류', {
                error: error.message,
                stack: error.stack,
                title,
                author,
                isbn
            });
            throw error;
        }
    }

    // 도서관 보유 도서 통계
    async getLibraryHoldingsStats() {
        const response = await fetch('/api/books/library-holdings/stats');
        return await response.json();
    }
}

// 전역 API 인스턴스 생성
const apiClient = new APIClient();
const applicationsAPI = new ApplicationsAPI(apiClient);
const classesAPI = new ClassesAPI(apiClient);
const booksAPI = new BooksAPI(apiClient);

// 클래스들을 전역으로 노출
window.APIClient = APIClient;
window.ApplicationsAPI = ApplicationsAPI;
window.ClassesAPI = ClassesAPI;
window.BooksAPI = BooksAPI;

// 인스턴스들도 전역으로 노출
window.apiClient = apiClient;
window.applicationsAPI = applicationsAPI;
window.classesAPI = classesAPI;
window.booksAPI = booksAPI; 