/**
 * config.js
 * 시스템 전체 설정 모듈
 */

const Config = (() => {
    // ===== API 설정 =====
    const API_CONFIG = {
        // 백엔드 API
        BACKEND_URL: 'https://book.koowoo.kr/api',
        
        // 카카오 도서 검색 API
        KAKAO: {
            URL: 'https://dapi.kakao.com/v3/search/book',
            REST_API_KEY: '', // 관리자 페이지에서 설정
            HEADERS: {
                'Authorization': '' // 동적으로 설정됨
            }
        }
    };
    
    // ===== 시스템 설정 =====
    const SYSTEM_CONFIG = {
        // 학교 정보
        SCHOOL: {
            NAME: '입실초등학교',
            LIBRARY_NAME: '입실초 도서관'
        },
        
        // 학급 설정
        GRADES: [1, 2, 3, 4, 5, 6],
        CLASSES_PER_GRADE: 4, // 학년당 반 수
        
        // 예산 설정
        BUDGET: {
            DEFAULT_PER_CLASS: 200000, // 학급당 기본 예산 (20만원)
            MIN_BOOK_PRICE: 5000,      // 최소 도서 가격
            MAX_BOOK_PRICE: 50000      // 최대 도서 가격
        },
        
        // 페이징 설정
        PAGINATION: {
            BOOKS_PER_PAGE: 20,        // 페이지당 도서 수
            BOOKS_PER_ROW: 5           // 한 줄당 도서 수
        },
        
        // 검색 설정
        SEARCH: {
            MIN_QUERY_LENGTH: 2,       // 최소 검색어 길이
            DEBOUNCE_DELAY: 300        // 검색 디바운스 딜레이 (ms)
        }
    };
    
    // ===== 도서 카테고리 설정 =====
    const BOOK_CATEGORIES = [
        {
            id: 'popular',
            name: '인기도서',
            icon: 'fas fa-star',
            color: 'text-yellow-500',
            query: '어린이', // 카카오 API 검색어
            sort: 'accuracy' // 정확도순
        },
        {
            id: 'novel',
            name: '소설',
            icon: 'fas fa-book',
            color: 'text-blue-500',
            query: '어린이 소설',
            sort: 'recency'
        },
        {
            id: 'fairy-tale',
            name: '동화',
            icon: 'fas fa-dragon',
            color: 'text-purple-500',
            query: '동화',
            sort: 'recency'
        },
        {
            id: 'science',
            name: '과학',
            icon: 'fas fa-flask',
            color: 'text-green-500',
            query: '어린이 과학',
            sort: 'recency'
        },
        {
            id: 'history',
            name: '역사',
            icon: 'fas fa-landmark',
            color: 'text-red-500',
            query: '어린이 역사',
            sort: 'recency'
        },
        {
            id: 'art',
            name: '예술',
            icon: 'fas fa-palette',
            color: 'text-pink-500',
            query: '어린이 예술',
            sort: 'recency'
        },
        {
            id: 'comic',
            name: '만화',
            icon: 'fas fa-laugh',
            color: 'text-orange-500',
            query: '어린이 만화',
            sort: 'recency'
        }
    ];
    
    // ===== 메시지 설정 =====
    const MESSAGES = {
        SUCCESS: {
            BOOK_REQUESTED: '도서 신청이 완료되었습니다!',
            CLASS_SELECTED: '학급 정보가 설정되었습니다.',
            DATA_SAVED: '데이터가 성공적으로 저장되었습니다.'
        },
        ERROR: {
            CLASS_NOT_SELECTED: '학급을 먼저 선택해주세요.',
            BUDGET_EXCEEDED: '신청 금액이 예산을 초과했습니다.',
            DUPLICATE_BOOK: '이 도서는 이미 도서관에 있습니다.',
            BOOK_ON_LOAN: '이 도서는 현재 대출 중입니다. 도서관에서 대출하세요.',
            NETWORK_ERROR: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
            INVALID_INPUT: '입력 정보를 확인해주세요.',
            API_ERROR: 'API 요청 중 오류가 발생했습니다.'
        },
        CONFIRM: {
            REQUEST_BOOK: '이 도서를 신청하시겠습니까?',
            DELETE_REQUEST: '신청을 취소하시겠습니까?',
            RESET_DATA: '모든 데이터를 초기화하시겠습니까?'
        }
    };
    
    // ===== 스타일 설정 =====
    const STYLES = {
        COLORS: {
            PRIMARY: 'blue',
            SECONDARY: 'purple',
            SUCCESS: 'green',
            WARNING: 'yellow',
            ERROR: 'red',
            INFO: 'indigo'
        },
        ANIMATIONS: {
            FADE_DURATION: 300,
            SLIDE_DURATION: 400,
            HOVER_SCALE: 1.05
        }
    };
    
    // ===== 로컬 스토리지 키 =====
    const STORAGE_KEYS = {
        SELECTED_CLASS: 'selected_class_info',
        USER_PREFERENCES: 'user_preferences',
        RECENT_SEARCHES: 'recent_searches',
        CART: 'book_cart'
    };
    
    // ===== 공개 메서드 =====
    return {
        // API 설정
        getApiConfig: () => API_CONFIG,
        getKakaoConfig: () => API_CONFIG.KAKAO,
        getBackendUrl: () => API_CONFIG.BACKEND_URL,
        
        // 시스템 설정
        getSystemConfig: () => SYSTEM_CONFIG,
        getSchoolInfo: () => SYSTEM_CONFIG.SCHOOL,
        getBudgetConfig: () => SYSTEM_CONFIG.BUDGET,
        getPaginationConfig: () => SYSTEM_CONFIG.PAGINATION,
        
        // 카테고리 설정
        getCategories: () => BOOK_CATEGORIES,
        getCategoryById: (id) => BOOK_CATEGORIES.find(cat => cat.id === id),
        
        // 메시지
        getMessages: () => MESSAGES,
        getSuccessMessages: () => MESSAGES.SUCCESS,
        getErrorMessages: () => MESSAGES.ERROR,
        getConfirmMessages: () => MESSAGES.CONFIRM,
        
        // 스타일
        getStyles: () => STYLES,
        getColors: () => STYLES.COLORS,
        
        // 스토리지
        getStorageKeys: () => STORAGE_KEYS,
        
        // 유틸리티
        isValidGrade: (grade) => SYSTEM_CONFIG.GRADES.includes(parseInt(grade)),
        isValidClass: (classNum) => classNum >= 1 && classNum <= SYSTEM_CONFIG.CLASSES_PER_GRADE,
        formatPrice: (price) => new Intl.NumberFormat('ko-KR').format(price) + '원',
        
        // 카카오 API 키 설정 (동적으로 변경 가능)
        setKakaoApiKey: (apiKey) => {
            API_CONFIG.KAKAO.REST_API_KEY = apiKey;
            API_CONFIG.KAKAO.HEADERS.Authorization = `KakaoAK ${apiKey}`;
            // 로컬 스토리지에 암호화해서 저장
            localStorage.setItem('kakao_api_key', btoa(apiKey));
        },
        
        // 저장된 API 키 불러오기
        loadKakaoApiKey: () => {
            try {
                const savedKey = localStorage.getItem('kakao_api_key');
                if (savedKey) {
                    const apiKey = atob(savedKey);
                    API_CONFIG.KAKAO.REST_API_KEY = apiKey;
                    API_CONFIG.KAKAO.HEADERS.Authorization = `KakaoAK ${apiKey}`;
                    return true;
                }
            } catch (error) {
                console.error('API 키 로드 오류:', error);
            }
            return false;
        },
        
        // API 키 유효성 검사
        hasValidKakaoApiKey: () => {
            return API_CONFIG.KAKAO.REST_API_KEY && API_CONFIG.KAKAO.REST_API_KEY.length > 0;
        },
        
        // API 키 삭제
        clearKakaoApiKey: () => {
            API_CONFIG.KAKAO.REST_API_KEY = '';
            API_CONFIG.KAKAO.HEADERS.Authorization = '';
            localStorage.removeItem('kakao_api_key');
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.Config = Config;

// 페이지 로드 시 저장된 API 키 자동 로드
document.addEventListener('DOMContentLoaded', () => {
    Config.loadKakaoApiKey();
});

// 개발 모드에서 콘솔에 설정 정보 출력
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    console.log('🔧 Config Module Loaded:', Config.getSystemConfig());
}