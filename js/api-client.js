/**
 * api-client.js
 * 백엔드 API와 통신하는 클라이언트 모듈
 */

const ApiClient = (() => {
    /**
     * HTTP 요청을 보내는 기본 함수
     * @param {string} endpoint - API 엔드포인트
     * @param {object} options - fetch 옵션
     * @returns {Promise} - 응답 데이터
     */
    const request = async (endpoint, options = {}) => {
        try {
            const url = `${Config.getBackendUrl()}${endpoint}`;
            
            console.log(`🌐 API 요청: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorData.message || '알 수 없는 오류가 발생했습니다.';
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log(`✅ API 응답: ${endpoint}`, data);
            
            return data;
        } catch (error) {
            console.error(`❌ API 오류: ${endpoint}`, error);
            throw error;
        }
    };

    return {
        // 기본 요청 함수
        request,
        
        // ===== 서버 상태 =====
        
        /**
         * 서버 상태 확인
         * @returns {Promise} - 서버 상태 정보
         */
        checkStatus: () => request('/test'),
        
        // ===== 도서 관리 =====
        
        /**
         * 모든 신청 도서 조회
         * @returns {Promise} - 도서 목록 배열
         */
        getAllBooks: () => request('/books'),
        
        /**
         * 특정 학급의 신청 도서 조회
         * @param {string} gradeClass - 학급 (예: "1-2")
         * @returns {Promise} - 해당 학급 도서 목록
         */
        getBooksByClass: (gradeClass) => {
            if (!gradeClass) {
                throw new Error('학급 정보가 필요합니다.');
            }
            return request(`/books/class/${gradeClass}`);
        },
        
        /**
         * 도서 신청 추가
         * @param {object|array} bookData - 추가할 도서 정보
         * @returns {Promise} - 추가 결과
         */
        addBookRequest: (bookData) => {
            if (!bookData) {
                throw new Error('도서 정보가 필요합니다.');
            }
            
            return request('/books', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });
        },
        
        /**
         * 도서 신청 삭제
         * @param {string} bookId - 삭제할 도서 ID
         * @returns {Promise} - 삭제 결과
         */
        deleteBookRequest: (bookId) => {
            if (!bookId) {
                throw new Error('도서 ID가 필요합니다.');
            }
            
            return request(`/books/${bookId}`, {
                method: 'DELETE'
            });
        },
        
        /**
         * 도서 신청 수정
         * @param {string} bookId - 수정할 도서 ID
         * @param {object} bookData - 수정할 도서 정보
         * @returns {Promise} - 수정 결과
         */
        updateBookRequest: (bookId, bookData) => {
            if (!bookId || !bookData) {
                throw new Error('도서 ID와 수정할 정보가 필요합니다.');
            }
            
            return request(`/books/${bookId}`, {
                method: 'PUT',
                body: JSON.stringify(bookData)
            });
        },
        
        // ===== 학급 관리 =====
        
        /**
         * 학급 정보 조회
         * @returns {Promise} - 학급 구조 정보
         */
        getClasses: () => request('/classes'),
        
        /**
         * 학급 정보 저장
         * @param {array} classData - 학급 구조 데이터
         * @returns {Promise} - 저장 결과
         */
        saveClasses: (classData) => {
            if (!Array.isArray(classData)) {
                throw new Error('학급 데이터는 배열 형태여야 합니다.');
            }
            
            return request('/classes', {
                method: 'POST',
                body: JSON.stringify(classData)
            });
        },
        
        /**
         * 특정 학급 정보 조회
         * @param {string} gradeClass - 학급 (예: "1-2")
         * @returns {Promise} - 학급 정보
         */
        getClassInfo: (gradeClass) => {
            if (!gradeClass) {
                throw new Error('학급 정보가 필요합니다.');
            }
            return request(`/classes/${gradeClass}`);
        },
        
        // ===== 기존 도서 관리 =====
        
        /**
         * 기존 보유 도서 목록 조회
         * @returns {Promise} - 기존 보유 도서 목록
         */
        getExistingBooks: () => request('/existing-books'),
        
        /**
         * 기존 보유 도서 목록 저장
         * @param {array} bookData - 기존 도서 데이터
         * @returns {Promise} - 저장 결과
         */
        saveExistingBooks: (bookData) => {
            if (!Array.isArray(bookData)) {
                throw new Error('도서 데이터는 배열 형태여야 합니다.');
            }
            
            return request('/existing-books', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });
        },
        
        /**
         * 기존 도서와 중복 검사
         * @param {object} bookInfo - 검사할 도서 정보
         * @returns {Promise} - 중복 검사 결과
         */
        checkDuplicate: (bookInfo) => {
            if (!bookInfo || !bookInfo.title) {
                throw new Error('도서 정보가 필요합니다.');
            }
            
            return request('/books/check-duplicate', {
                method: 'POST',
                body: JSON.stringify(bookInfo)
            });
        },
        
        // ===== 예산 관리 =====
        
        /**
         * 학급별 예산 정보 조회
         * @param {string} gradeClass - 학급 (예: "1-2")
         * @returns {Promise} - 예산 정보
         */
        getClassBudget: (gradeClass) => {
            if (!gradeClass) {
                throw new Error('학급 정보가 필요합니다.');
            }
            return request(`/budget/${gradeClass}`);
        },
        
        /**
         * 학급별 예산 설정
         * @param {string} gradeClass - 학급 (예: "1-2")
         * @param {number} budget - 예산 금액
         * @returns {Promise} - 설정 결과
         */
        setClassBudget: (gradeClass, budget) => {
            if (!gradeClass || typeof budget !== 'number') {
                throw new Error('학급 정보와 예산 금액이 필요합니다.');
            }
            
            return request(`/budget/${gradeClass}`, {
                method: 'POST',
                body: JSON.stringify({ budget })
            });
        },
        
        /**
         * 전체 예산 현황 조회
         * @returns {Promise} - 전체 예산 현황
         */
        getAllBudgets: () => request('/budget'),
        
        // ===== 파일 업로드 =====
        
        /**
         * CSV 파일 업로드 (기존 도서 목록)
         * @param {File} file - 업로드할 파일
         * @returns {Promise} - 업로드 결과
         */
        uploadCSV: (file) => {
            if (!file || file.type !== 'text/csv') {
                throw new Error('CSV 파일만 업로드 가능합니다.');
            }
            
            const formData = new FormData();
            formData.append('csvFile', file);
            
            return request('/upload/csv', {
                method: 'POST',
                body: formData,
                headers: {} // Content-Type을 자동으로 설정하도록 비움
            });
        },
        
        // ===== 통계 및 리포트 =====
        
        /**
         * 전체 신청 통계 조회
         * @param {object} options - 옵션 (기간, 학급 등)
         * @returns {Promise} - 통계 데이터
         */
        getStatistics: (options = {}) => {
            const params = new URLSearchParams();
            
            if (options.startDate) params.append('startDate', options.startDate);
            if (options.endDate) params.append('endDate', options.endDate);
            if (options.gradeClass) params.append('gradeClass', options.gradeClass);
            
            const queryString = params.toString();
            const endpoint = queryString ? `/statistics?${queryString}` : '/statistics';
            
            return request(endpoint);
        },
        
        /**
         * 학급별 신청 현황 조회
         * @param {string} gradeClass - 학급 (선택사항)
         * @returns {Promise} - 학급별 현황
         */
        getClassStatistics: (gradeClass = null) => {
            const endpoint = gradeClass ? `/statistics/class/${gradeClass}` : '/statistics/class';
            return request(endpoint);
        },
        
        // ===== 시스템 설정 =====
        
        /**
         * 시스템 설정 조회
         * @returns {Promise} - 시스템 설정
         */
        getSystemConfig: () => request('/config'),
        
        /**
         * 시스템 설정 저장
         * @param {object} config - 시스템 설정
         * @returns {Promise} - 저장 결과
         */
        saveSystemConfig: (config) => {
            if (!config || typeof config !== 'object') {
                throw new Error('설정 정보가 필요합니다.');
            }
            
            return request('/config', {
                method: 'POST',
                body: JSON.stringify(config)
            });
        },
        
        // ===== 유틸리티 =====
        
        /**
         * 여러 API 호출을 병렬로 실행
         * @param {array} requests - API 요청 배열
         * @returns {Promise} - 모든 요청 결과
         */
        parallel: async (requests) => {
            try {
                const promises = requests.map(req => {
                    if (typeof req === 'function') {
                        return req();
                    } else if (req.method && req.endpoint) {
                        return request(req.endpoint, { method: req.method, ...req.options });
                    }
                    throw new Error('잘못된 요청 형식입니다.');
                });
                
                return await Promise.all(promises);
            } catch (error) {
                console.error('병렬 API 요청 오류:', error);
                throw error;
            }
        },
        
        /**
         * API 연결 상태 테스트
         * @returns {Promise<boolean>} - 연결 가능 여부
         */
        testConnection: async () => {
            try {
                await ApiClient.checkStatus();
                return true;
            } catch (error) {
                console.error('API 연결 테스트 실패:', error);
                return false;
            }
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.ApiClient = ApiClient;