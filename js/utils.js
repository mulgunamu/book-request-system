/**
 * 유틸리티 함수들
 */

// 디바운싱 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 가격 포맷팅
function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR').format(price);
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// UUID 생성
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 로컬 스토리지 관리
const Storage = {
    // 데이터 저장
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    // 데이터 조회
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    // 데이터 삭제
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    // 전체 삭제
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

// 토스트 알림 표시
const Toast = {
    show(title, message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');

        // 아이콘 설정
        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };

        toastIcon.className = icons[type] || icons.info;
        toastTitle.textContent = title;
        toastMessage.textContent = message;

        // 토스트 표시
        toast.classList.remove('hidden');
        toast.classList.add('toast-enter');

        // 자동 숨김
        setTimeout(() => {
            Toast.hide();
        }, duration);
    },

    hide() {
        const toast = document.getElementById('toast');
        toast.classList.add('toast-exit');
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('toast-enter', 'toast-exit');
        }, 300);
    }
};

// 로딩 상태 관리
const Loading = {
    show(message = '로딩 중...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    },

    hide() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
};

// 모달 관리
const Modal = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('modal-enter');
            document.body.style.overflow = 'hidden';
        }
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal-exit');
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('modal-enter', 'modal-exit');
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
};

// 입력 검증
const Validator = {
    // 학급 정보 검증
    validateClassInfo(grade, classNum, teacher) {
        const errors = [];

        if (!grade || grade < 1 || grade > 6) {
            errors.push('올바른 학년을 선택해주세요.');
        }

        if (!classNum || classNum < 1 || classNum > 2) {
            errors.push('올바른 반을 선택해주세요.');
        }

        if (!teacher || teacher.trim().length < 2) {
            errors.push('담임교사명을 2글자 이상 입력해주세요.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // 검색어 검증
    validateSearchQuery(query) {
        if (!query || query.trim().length < 2) {
            return {
                isValid: false,
                error: '검색어는 2글자 이상 입력해주세요.'
            };
        }

        return { isValid: true };
    },

    // HTML 이스케이프 (XSS 방지)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 예산 관리
const Budget = {
    // 학급 예산 조회
    getClassBudget(classId) {
        const budgets = Storage.get('classBudgets', {});
        return budgets[classId] || 500000; // 기본 50만원
    },

    // 학급 예산 설정
    setClassBudget(classId, amount) {
        const budgets = Storage.get('classBudgets', {});
        budgets[classId] = amount;
        return Storage.set('classBudgets', budgets);
    },

    // 사용된 예산 계산
    getUsedBudget(classId) {
        const applications = Storage.get('applications', []);
        return applications
            .filter(app => app.classId === classId)
            .reduce((total, app) => total + (app.price || 0), 0);
    },

    // 예산 초과 여부 확인
    checkBudgetExceeded(classId, additionalAmount = 0) {
        const totalBudget = Budget.getClassBudget(classId);
        const usedBudget = Budget.getUsedBudget(classId);
        return (usedBudget + additionalAmount) > totalBudget;
    },

    // 예산 현황 조회
    getBudgetStatus(classId) {
        const total = Budget.getClassBudget(classId);
        const used = Budget.getUsedBudget(classId);
        const remaining = total - used;
        const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

        return {
            total,
            used,
            remaining,
            percentage
        };
    }
};

// 도서 신청 관리
const Applications = {
    // 신청 목록 조회
    getAll() {
        return Storage.get('applications', []);
    },

    // 학급별 신청 목록 조회
    getByClass(classId) {
        const applications = Applications.getAll();
        return applications.filter(app => app.classId === classId);
    },

    // 신청 추가
    add(application) {
        const applications = Applications.getAll();
        const newApplication = {
            id: generateUUID(),
            ...application,
            appliedAt: new Date().toISOString()
        };
        applications.push(newApplication);
        return Storage.set('applications', applications);
    },

    // 신청 삭제
    remove(applicationId) {
        const applications = Applications.getAll();
        const filtered = applications.filter(app => app.id !== applicationId);
        return Storage.set('applications', filtered);
    },

    // 중복 신청 확인
    checkDuplicate(classId, isbn) {
        const applications = Applications.getByClass(classId);
        return applications.some(app => app.isbn === isbn);
    },

    // 기보유 도서 확인
    checkOwnedBook(isbn) {
        const ownedBooks = Storage.get('ownedBooks', []);
        return ownedBooks.some(book => book.isbn === isbn);
    }
};

// 기보유 도서 관리
const OwnedBooks = {
    // 전체 목록 조회
    getAll() {
        return Storage.get('ownedBooks', []);
    },

    // 도서 추가
    add(book) {
        const books = OwnedBooks.getAll();
        const exists = books.some(b => b.isbn === book.isbn);
        
        if (!exists) {
            books.push({
                isbn: book.isbn,
                title: book.title,
                addedAt: new Date().toISOString()
            });
            return Storage.set('ownedBooks', books);
        }
        
        return false;
    },

    // 도서 삭제
    remove(isbn) {
        const books = OwnedBooks.getAll();
        const filtered = books.filter(book => book.isbn !== isbn);
        return Storage.set('ownedBooks', filtered);
    },

    // 일괄 업로드 (CSV 데이터)
    bulkUpload(csvData) {
        try {
            const books = OwnedBooks.getAll();
            let addedCount = 0;

            csvData.forEach(row => {
                if (row.isbn && row.title) {
                    const exists = books.some(b => b.isbn === row.isbn);
                    if (!exists) {
                        books.push({
                            isbn: row.isbn,
                            title: row.title,
                            addedAt: new Date().toISOString()
                        });
                        addedCount++;
                    }
                }
            });

            Storage.set('ownedBooks', books);
            return { success: true, addedCount };
        } catch (error) {
            console.error('Bulk upload error:', error);
            return { success: false, error: error.message };
        }
    }
};

// CSV 파일 처리
const CSV = {
    // CSV 파일 읽기
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const data = CSV.parse(csv);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'UTF-8');
        });
    },

    // CSV 파싱
    parse(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV 파일에 데이터가 없습니다.');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }

        return data;
    },

    // 데이터를 CSV로 변환
    stringify(data, headers) {
        if (!data || data.length === 0) {
            return '';
        }

        const csvHeaders = headers || Object.keys(data[0]);
        const csvRows = [csvHeaders.join(',')];

        data.forEach(row => {
            const values = csvHeaders.map(header => {
                const value = row[header] || '';
                // 쉼표가 포함된 값은 따옴표로 감싸기
                return value.toString().includes(',') ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    },

    // CSV 파일 다운로드
    download(data, filename, headers) {
        const csv = CSV.stringify(data, headers);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

// 이벤트 리스너 등록 헬퍼
function addEventListeners() {
    // 토스트 닫기 버튼
    const closeToast = document.getElementById('closeToast');
    if (closeToast) {
        closeToast.addEventListener('click', () => Toast.hide());
    }

    // 모달 닫기 버튼
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => Modal.hide('bookModal'));
    }

    // 모달 배경 클릭으로 닫기
    const bookModal = document.getElementById('bookModal');
    if (bookModal) {
        bookModal.addEventListener('click', (e) => {
            if (e.target === bookModal) {
                Modal.hide('bookModal');
            }
        });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            Modal.hide('bookModal');
        }
    });
}

// DOM 로드 완료 시 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', addEventListeners); 