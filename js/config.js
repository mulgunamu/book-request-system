/**
 * config.js
 * 시스템 전체 설정 모듈
 */

const Config = (() => {
    // ===== API 설정 =====
    const API_CONFIG = {
        ALADIN: {
            BASE_URL: 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx',
            TTB_KEY: '', // 관리자 페이지에서 설정
            VERSION: '20131101',
            OUTPUT: 'js',
            COVER: 'Big',
            SEARCH_TARGET: 'Book'
        },
        BACKEND_URL: 'http://localhost:3000/api'
    };
    
    // ===== 시스템 설정 =====
    const SYSTEM_CONFIG = {
        // 학교 정보
        SCHOOL: {
            NAME: '입실초등학교',
            GRADES: [1, 2, 3, 4, 5, 6],
            CLASSES_PER_GRADE: 6
        },
        
        // 학급 설정
        GRADES: [1, 2, 3, 4, 5, 6],
        CLASSES_PER_GRADE: 4, // 학년당 반 수
        
        // 예산 설정
        BUDGET: {
            DEFAULT_PER_CLASS: 500000, // 학급당 기본 예산 (원)
            WARNING_THRESHOLD: 50000,  // 예산 부족 경고 기준
            CRITICAL_THRESHOLD: 10000  // 예산 위험 기준
        },
        
        // 페이징 설정
        PAGINATION: {
            BOOKS_PER_PAGE: 20,        // 페이지당 도서 수
            MAX_RESULTS: 50
        },
        
        // 검색 설정
        SEARCH: {
            MIN_QUERY_LENGTH: 2,       // 최소 검색어 길이
            DEBOUNCE_DELAY: 500        // 검색 디바운스 딜레이 (ms)
        }
    };
    
    // ===== 알라딘 어린이 도서 카테고리 설정 =====
    const BOOK_CATEGORIES = [
        {
            id: 'popular',
            name: '인기도서',
            icon: 'fas fa-star',
            color: 'text-yellow-500',
            query: '어린이',
            categoryId: '0', // 전체
            sort: 'Accuracy'
        },
        {
            id: 'picture-book',
            name: '그림책',
            icon: 'fas fa-palette',
            color: 'text-pink-500',
            query: '그림책',
            categoryId: '13789', // 유아(0~7세)
            sort: 'PublishTime'
        },
        {
            id: 'fairy-tale',
            name: '동화/창작',
            icon: 'fas fa-dragon',
            color: 'text-purple-500',
            query: '동화',
            categoryId: '13790', // 어린이(초등)
            sort: 'PublishTime'
        },
        {
            id: 'learning',
            name: '학습만화',
            icon: 'fas fa-graduation-cap',
            color: 'text-blue-500',
            query: '학습만화',
            categoryId: '13791', // 어린이 학습
            sort: 'SalesPoint'
        },
        {
            id: 'science',
            name: '과학/자연',
            icon: 'fas fa-flask',
            color: 'text-green-500',
            query: '어린이 과학',
            categoryId: '13792', // 어린이 과학
            sort: 'PublishTime'
        },
        {
            id: 'history',
            name: '역사/문화',
            icon: 'fas fa-landmark',
            color: 'text-red-500',
            query: '어린이 역사',
            categoryId: '13793', // 어린이 역사
            sort: 'PublishTime'
        },
        {
            id: 'novel',
            name: '어린이소설',
            icon: 'fas fa-book',
            color: 'text-indigo-500',
            query: '어린이 소설',
            categoryId: '13794', // 어린이 소설
            sort: 'PublishTime'
        }
    ];
    
    // ===== 메시지 설정 =====
    const MESSAGES = {
        SUCCESS: {
            CLASS_SELECTED: '학급 정보가 설정되었습니다.',
            BOOK_REQUESTED: '도서 신청이 완료되었습니다.',
            API_KEY_SAVED: 'API 키가 저장되었습니다.'
        },
        ERROR: {
            CLASS_NOT_SELECTED: '먼저 학급 정보를 입력해주세요.',
            DUPLICATE_BOOK: '이미 신청된 도서이거나 보유 중인 도서입니다.',
            BUDGET_EXCEEDED: '예산을 초과하여 신청할 수 없습니다.',
            BOOK_ON_LOAN: '현재 대출 중인 도서입니다.',
            API_KEY_REQUIRED: '알라딘 API 키가 필요합니다. 관리자 페이지에서 설정해주세요.',
            SEARCH_FAILED: '도서 검색에 실패했습니다. 잠시 후 다시 시도해주세요.'
        },
        CONFIRM: {
            REQUEST_BOOK: '이 도서를 신청하시겠습니까?',
            DELETE_REQUEST: '신청을 취소하시겠습니까?'
        }
    };
    
    // ===== 스타일 설정 =====
    const STYLES = {
        COLORS: {
            PRIMARY: '#3B82F6',
            SUCCESS: '#10B981',
            WARNING: '#F59E0B',
            ERROR: '#EF4444',
            INFO: '#6366F1'
        },
        ANIMATIONS: {
            FADE_DURATION: 300,
            SLIDE_DURATION: 400,
            HOVER_SCALE: 1.05
        }
    };
    
    // ===== 로컬 스토리지 키 =====
    const STORAGE_KEYS = {
        SELECTED_CLASS: 'selected_class',
        RECENT_SEARCHES: 'recent_searches',
        ALADIN_API_KEY: 'aladin_ttb_key'
    };
    
    // ===== 공개 메서드 =====
    return {
        // API 설정
        getApiConfig: () => API_CONFIG,
        getAladinConfig: () => API_CONFIG.ALADIN,
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
        isValidGrade: (grade) => SYSTEM_CONFIG.SCHOOL.GRADES.includes(parseInt(grade)),
        isValidClass: (classNum) => classNum >= 1 && classNum <= SYSTEM_CONFIG.CLASSES_PER_GRADE,
        formatPrice: (price) => new Intl.NumberFormat('ko-KR').format(price) + '원',
        
        // 알라딘 API 키 설정
        setAladinApiKey: (apiKey) => {
            API_CONFIG.ALADIN.TTB_KEY = apiKey;
            localStorage.setItem(STORAGE_KEYS.ALADIN_API_KEY, btoa(apiKey));
        },
        
        // 알라딘 API 키 조회
        getAladinApiKey: () => {
            if (API_CONFIG.ALADIN.TTB_KEY) {
                return API_CONFIG.ALADIN.TTB_KEY;
            }
            try {
                const saved = localStorage.getItem(STORAGE_KEYS.ALADIN_API_KEY);
                if (saved) {
                    API_CONFIG.ALADIN.TTB_KEY = atob(saved);
                    return API_CONFIG.ALADIN.TTB_KEY;
                }
            } catch (error) {
                console.error('API 키 복원 실패:', error);
            }
            return null;
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.Config = Config;

// 페이지 로드 시 저장된 API 키 자동 로드
document.addEventListener('DOMContentLoaded', () => {
    Config.getAladinApiKey();
});

// 개발 모드에서 콘솔에 설정 정보 출력
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    console.log('🔧 Config Module Loaded:', Config.getSystemConfig());
}