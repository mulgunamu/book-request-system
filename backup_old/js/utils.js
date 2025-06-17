/**
 * utils.js - 유틸리티 함수 모음
 * 공통으로 사용되는 헬퍼 함수들을 정의
 */

const Utils = (() => {
    'use strict';

    /**
     * 날짜 포맷팅 함수
     */
    const formatDate = (date, format = 'YYYY-MM-DD') => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        switch (format) {
            case 'YYYY.MM.DD':
                return `${year}.${month}.${day}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            default:
                return `${year}-${month}-${day}`;
        }
    };

    /**
     * 가격 포맷팅 함수
     */
    const formatPrice = (price, currency = '원') => {
        if (typeof price !== 'number' || isNaN(price)) return '가격 정보 없음';
        return `${price.toLocaleString()}${currency}`;
    };

    /**
     * 문자열 정규화 함수
     */
    const normalizeString = (str) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\s+/g, '').replace(/[^\w가-힣]/g, '').trim();
    };

    /**
     * 학급 정보 포맷팅 함수
     */
    const formatGradeClass = (grade, classNumber) => {
        return `${grade}-${classNumber}`;
    };

    /**
     * 학급 정보 파싱 함수
     */
    const parseGradeClass = (gradeClass) => {
        if (!gradeClass || typeof gradeClass !== 'string') {
            return { grade: '', classNumber: '' };
        }
        const [grade, classNumber] = gradeClass.split('-');
        return { grade: grade || '', classNumber: classNumber || '' };
    };

    /**
     * 요소 내용 지우기 함수
     */
    const clearElement = (element) => {
        if (element) {
            element.innerHTML = '';
        }
    };

    /**
     * 요소 표시/숨김 토글 함수
     */
    const toggleVisibility = (element, show) => {
        if (!element) return;
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    };

    /**
     * 로딩 상태 토글 함수
     */
    const toggleLoading = (show) => {
        const loading = document.getElementById('loading');
        const booksGrid = document.getElementById('books-grid');
        
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
                if (booksGrid) booksGrid.style.opacity = '0.5';
            } else {
                loading.classList.add('hidden');
                if (booksGrid) booksGrid.style.opacity = '1';
            }
        }
    };

    /**
     * 토스트 알림 표시 함수
     */
    const showToast = (message, type = 'info', duration = 3000) => {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const messageEl = document.getElementById('toast-message');

        if (!toast || !icon || !messageEl) return;

        const config = {
            success: { icon: 'fas fa-check-circle', color: 'text-green-500', border: 'border-green-500' },
            error: { icon: 'fas fa-exclamation-circle', color: 'text-red-500', border: 'border-red-500' },
            warning: { icon: 'fas fa-exclamation-triangle', color: 'text-yellow-500', border: 'border-yellow-500' },
            info: { icon: 'fas fa-info-circle', color: 'text-blue-500', border: 'border-blue-500' }
        };

        const currentConfig = config[type] || config.info;
        icon.className = `${currentConfig.icon} ${currentConfig.color}`;
        
        const toastContainer = toast.querySelector('.bg-white');
        if (toastContainer) {
            toastContainer.className = `bg-white rounded-lg shadow-lg border-l-4 ${currentConfig.border} p-4 max-w-sm`;
        }
        messageEl.textContent = message;

        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), duration);
    };

    /**
     * 각종 알림 함수들
     */
    const showError = (message) => {
        showToast(message, 'error');
        console.error('Error:', message);
    };

    const showSuccess = (message) => {
        showToast(message, 'success');
    };

    const showWarning = (message) => {
        showToast(message, 'warning');
    };

    const showInfo = (message) => {
        showToast(message, 'info');
    };

    /**
     * 확인 대화상자 표시 함수
     */
    const showConfirm = (message, callback, cancelCallback) => {
        if (confirm(message)) {
            if (typeof callback === 'function') callback();
        } else {
            if (typeof cancelCallback === 'function') cancelCallback();
        }
    };

    /**
     * 디바운스 함수
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * 배열을 CSV 형식으로 변환하는 함수
     */
    const arrayToCSV = (data, headers) => {
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] || '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });
        return [csvHeaders, ...csvRows].join('\n');
    };

    /**
     * 도서 데이터를 CSV로 다운로드하는 함수
     */
    const downloadBooksAsCSV = (books, filename = 'books.csv') => {
        if (!books || books.length === 0) {
            showWarning('다운로드할 데이터가 없습니다.');
            return;
        }

        const headers = ['title', 'author', 'publisher', 'price', 'isbn', 'grade', 'classNumber', 'teacher', 'requestDate', 'status'];
        const csvContent = arrayToCSV(books, headers);
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    };

    /**
     * 파일 다운로드 함수
     */
    const downloadFile = (content, filename, contentType = 'text/plain') => {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    /**
     * ISBN 유효성 검사 함수
     */
    const isValidISBN = (isbn) => {
        if (!isbn) return false;
        const isbn10Regex = /^(?:\d{9}[\dX])$/;
        const isbn13Regex = /^(?:97[89]\d{10})$/;
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        return isbn10Regex.test(cleanISBN) || isbn13Regex.test(cleanISBN);
    };

    /**
     * 로컬 스토리지 안전 저장 함수
     */
    const safeLocalStorageSet = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('LocalStorage 저장 실패:', error);
            showError('데이터 저장에 실패했습니다.');
            return false;
        }
    };

    /**
     * 로컬 스토리지 안전 읽기 함수
     */
    const safeLocalStorageGet = (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('LocalStorage 읽기 실패:', error);
            return defaultValue;
        }
    };

    /**
     * 모바일 디바이스 감지 함수
     */
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Public API 반환
    return {
        formatDate,
        formatPrice,
        normalizeString,
        formatGradeClass,
        parseGradeClass,
        clearElement,
        toggleVisibility,
        toggleLoading,
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        showConfirm,
        debounce,
        arrayToCSV,
        downloadBooksAsCSV,
        downloadFile,
        isValidISBN,
        safeLocalStorageSet,
        safeLocalStorageGet,
        isMobile
    };
})();

// 전역 스코프에 Utils 객체 노출
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}