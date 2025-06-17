class DataManager {
    static STORAGE_KEY = 'classStructure';
    static BOOKS_KEY = 'requestedBooks';

    /**
     * 학급 구조 저장
     * @param {Array} classStructure - 저장할 학급 구조 데이터
     */
    static saveClasses(classStructure) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(classStructure));
    }

    /**
     * 학급 구조 불러오기
     * @returns {Array} 저장된 학급 구조 데이터
     */
    static loadClasses() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * app.js 호환: 학급 구조 반환
     */
    static getClasses() {
        return this.loadClasses();
    }

    /**
     * app.js 호환: 기존 신청 도서 목록 반환
     */
    static getExistingBooks() {
        const data = localStorage.getItem(this.BOOKS_KEY);
        return data ? JSON.parse(data) : [];
    }
} 