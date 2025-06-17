/**
 * admin.js
 * 관리자 페이지 기능 구현
 */

// API 엔드포인트 설정
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
    API_KEYS: `${API_BASE_URL}/api/config/api-keys`,
    STATS: `${API_BASE_URL}/api/stats/usage`
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 (pages/admin.html의 실제 ID에 맞게 수정)
    const elements = {
        // API 키 관련
        aladinApiKeyInput: document.getElementById('aladinApiKey'),
        saveApiKeyBtn: document.getElementById('saveApiKey'),
        testApiKeyBtn: document.getElementById('testApiKey'),
        deleteApiKeyBtn: document.getElementById('deleteApiKey'),
        toggleApiKeyVisibilityBtn: document.getElementById('toggleApiKeyVisibility'),
        
        // 상태 표시 요소들
        apiKeyStatus: document.getElementById('apiKeyStatus'),
        statusIcon: document.getElementById('statusIcon'),
        statusText: document.getElementById('statusText'),
        
        // 학급 관리 관련
        newGrade: document.getElementById('newGrade'),
        newClass: document.getElementById('newClass'),
        newTeacher: document.getElementById('newTeacher'),
        newBudget: document.getElementById('newBudget'),
        addClassBtn: document.getElementById('addClassBtn'),
        classList: document.getElementById('classList'),
        
        // 통계 관련
        totalClasses: document.getElementById('totalClasses'),
        totalBooks: document.getElementById('totalBooks'),
        totalBudget: document.getElementById('totalBudget'),
        budgetUsage: document.getElementById('budgetUsage'),
        
        // 알림 관련
        notification: document.getElementById('notification'),
        notificationIcon: document.getElementById('notificationIcon'),
        notificationTitle: document.getElementById('notificationTitle'),
        notificationMessage: document.getElementById('notificationMessage'),
        closeNotification: document.getElementById('closeNotification')
    };

    /**
     * API 상태 표시 업데이트
     */
    const updateApiStatus = (success, message) => {
        if (!elements.apiKeyStatus || !elements.statusIcon || !elements.statusText) return;

        // 기존 클래스 제거
        elements.apiKeyStatus.classList.remove('hidden', 'bg-green-50', 'bg-red-50', 'bg-blue-50', 'border-green-200', 'border-red-200', 'border-blue-200');
        elements.statusIcon.classList.remove('fas', 'fa-check-circle', 'fa-exclamation-circle', 'fa-info-circle', 'text-green-500', 'text-red-500', 'text-blue-500');

        if (success) {
            elements.apiKeyStatus.classList.add('bg-green-50', 'border-green-200');
            elements.statusIcon.classList.add('fas', 'fa-check-circle', 'text-green-500');
        } else {
            elements.apiKeyStatus.classList.add('bg-red-50', 'border-red-200');
            elements.statusIcon.classList.add('fas', 'fa-exclamation-circle', 'text-red-500');
        }

        elements.statusText.textContent = message;
        elements.apiKeyStatus.classList.remove('hidden');
    };

    /**
     * 알림 표시
     */
    const showNotification = (title, message, type = 'info') => {
        if (!elements.notification) {
            // 알림 요소가 없으면 alert 사용
            alert(`${title}: ${message}`);
            return;
        }

        const iconClasses = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            info: 'fas fa-info-circle text-blue-500'
        };

        if (elements.notificationIcon) {
            elements.notificationIcon.className = iconClasses[type] || iconClasses.info;
        }
        if (elements.notificationTitle) {
            elements.notificationTitle.textContent = title;
        }
        if (elements.notificationMessage) {
            elements.notificationMessage.textContent = message;
        }
        
        elements.notification.classList.remove('hidden');

        // 3초 후 자동 숨김
        setTimeout(() => {
            elements.notification.classList.add('hidden');
        }, 3000);
    };

    /**
     * 서버에 API 키 저장
     */
    const saveApiKeyToServer = async (apiKey) => {
        try {
            await ApiClient.request('/config/api-keys', {
                method: 'POST',
                body: JSON.stringify({
                    aladin: apiKey
                })
            });
            return true;
        } catch (error) {
            console.error('서버 저장 오류:', error);
            throw error;
        }
    };

    /**
     * 서버에서 API 키 불러오기
     */
    const loadApiKeyFromServer = async () => {
        try {
            const data = await ApiClient.request('/config/api-keys');
            return data.aladin;
        } catch (error) {
            console.error('서버 로드 오류:', error);
            throw error;
        }
    };

    /**
     * 알라딘 API 키 저장
     */
    const saveAladinApiKey = async () => {
        try {
            const apiKey = elements.aladinApiKeyInput?.value?.trim();
            
            if (!apiKey) {
                throw new Error('API 키를 입력해주세요.');
            }

            // 서버에 API 키 저장
            await saveApiKeyToServer(apiKey);
            
            // Config에도 API 키 설정
            if (typeof Config !== 'undefined' && Config.setAladinApiKey) {
                Config.setAladinApiKey(apiKey);
            }
            
            updateApiStatus(true, 'API 키가 저장되었습니다.');
            showNotification('성공', '알라딘 API 키가 저장되었습니다.', 'success');
            
        } catch (error) {
            console.error('API 키 저장 오류:', error);
            updateApiStatus(false, error.message);
            showNotification('오류', error.message, 'error');
        }
    };

    /**
     * 알라딘 API 키 테스트
     */
    const testAladinApiKey = async () => {
        try {
            const apiKey = elements.aladinApiKeyInput?.value?.trim();
            
            if (!apiKey) {
                throw new Error('API 키를 입력해주세요.');
            }

            // Config에 임시로 API 키 설정
            if (typeof Config !== 'undefined' && Config.setAladinApiKey) {
                Config.setAladinApiKey(apiKey);
            }
            
            // API 상태 확인
            if (typeof AladinAPI !== 'undefined' && AladinAPI.checkApiStatus) {
                const isApiWorking = await AladinAPI.checkApiStatus();
                
                if (isApiWorking) {
                    updateApiStatus(true, 'API 키가 정상적으로 작동합니다.');
                    showNotification('성공', 'API 키 테스트가 성공했습니다.', 'success');
                } else {
                    updateApiStatus(false, 'API 키가 유효하지 않습니다.');
                    showNotification('오류', 'API 키가 유효하지 않습니다.', 'error');
                }
            } else {
                throw new Error('AladinAPI 모듈을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('API 키 테스트 오류:', error);
            updateApiStatus(false, 'API 테스트 중 오류가 발생했습니다.');
            showNotification('오류', 'API 테스트 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * API 키 삭제
     */
    const deleteAladinApiKey = () => {
        if (confirm('정말로 API 키를 삭제하시겠습니까?')) {
            if (elements.aladinApiKeyInput) {
                elements.aladinApiKeyInput.value = '';
            }
            
            // 로컬 스토리지에서 삭제
            if (typeof Config !== 'undefined' && Config.getStorageKeys) {
                localStorage.removeItem(Config.getStorageKeys().ALADIN_API_KEY);
            }
            
            updateApiStatus(false, 'API 키가 삭제되었습니다.');
            showNotification('정보', 'API 키가 삭제되었습니다.', 'info');
        }
    };

    /**
     * API 키 가시성 토글
     */
    const toggleApiKeyVisibility = () => {
        if (!elements.aladinApiKeyInput || !elements.toggleApiKeyVisibilityBtn) return;

        const input = elements.aladinApiKeyInput;
        const button = elements.toggleApiKeyVisibilityBtn;
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    };

    /**
     * 저장된 API 키 불러오기
     */
    const loadSavedApiKey = async () => {
        try {
            // 서버에서 API 키 불러오기 시도
            try {
                const apiKey = await loadApiKeyFromServer();
                
                if (apiKey && elements.aladinApiKeyInput) {
                    elements.aladinApiKeyInput.value = apiKey;
                    
                    if (typeof Config !== 'undefined' && Config.setAladinApiKey) {
                        Config.setAladinApiKey(apiKey);
                    }
                    
                    updateApiStatus(true, 'API 키가 로드되었습니다.');
                    return;
                }
            } catch (serverError) {
                console.log('서버에서 API 키 로드 실패, 로컬 스토리지 확인 중...');
            }

            // 로컬 스토리지에서 API 키 불러오기
            if (typeof Config !== 'undefined' && Config.getAladinApiKey) {
                const localApiKey = Config.getAladinApiKey();
                if (localApiKey && elements.aladinApiKeyInput) {
                    elements.aladinApiKeyInput.value = localApiKey;
                    updateApiStatus(true, 'API 키가 로드되었습니다.');
                }
            }
        } catch (error) {
            console.error('API 키 불러오기 오류:', error);
            updateApiStatus(false, '저장된 API 키를 불러올 수 없습니다.');
        }
    };

    /**
     * 학급 목록 로드
     */
    const loadClassList = () => {
        if (!elements.classList) return;

        const classes = JSON.parse(localStorage.getItem('school_classes') || '[]');
        const container = elements.classList;

        container.innerHTML = '';

        if (classes.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">등록된 학급이 없습니다.</p>';
            return;
        }

        classes.forEach(classInfo => {
            const classElement = document.createElement('div');
            classElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            classElement.innerHTML = `
                <div>
                    <span class="font-medium">${classInfo.grade}학년 ${classInfo.classNumber}반</span>
                    <span class="text-sm text-gray-600 ml-2">${classInfo.teacher}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">${typeof Config !== 'undefined' && Config.formatPrice ? Config.formatPrice(classInfo.budget) : classInfo.budget + '원'}</span>
                    <button onclick="deleteClass('${classInfo.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            `;
            container.appendChild(classElement);
        });
    };

    /**
     * 통계 업데이트
     */
    const updateStatistics = () => {
        const classes = JSON.parse(localStorage.getItem('school_classes') || '[]');
        const books = JSON.parse(localStorage.getItem('book_requests') || '[]');

        if (elements.totalClasses) {
            elements.totalClasses.textContent = classes.length;
        }
        if (elements.totalBooks) {
            elements.totalBooks.textContent = books.length;
        }

        const totalBudget = classes.reduce((sum, c) => sum + c.budget, 0);
        const usedBudget = books.reduce((sum, b) => sum + (b.price || 0), 0);
        const usageRate = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;

        if (elements.totalBudget) {
            elements.totalBudget.textContent = typeof Config !== 'undefined' && Config.formatPrice ? Config.formatPrice(totalBudget) : totalBudget + '원';
        }
        if (elements.budgetUsage) {
            elements.budgetUsage.textContent = `${usageRate}%`;
        }
    };

    // 이벤트 리스너 등록
    if (elements.saveApiKeyBtn) {
        elements.saveApiKeyBtn.addEventListener('click', saveAladinApiKey);
    }

    if (elements.testApiKeyBtn) {
        elements.testApiKeyBtn.addEventListener('click', testAladinApiKey);
    }

    if (elements.deleteApiKeyBtn) {
        elements.deleteApiKeyBtn.addEventListener('click', deleteAladinApiKey);
    }

    if (elements.toggleApiKeyVisibilityBtn) {
        elements.toggleApiKeyVisibilityBtn.addEventListener('click', toggleApiKeyVisibility);
    }

    if (elements.addClassBtn) {
        elements.addClassBtn.addEventListener('click', () => {
            const grade = elements.newGrade?.value;
            const classNum = elements.newClass?.value;
            const teacher = elements.newTeacher?.value?.trim();
            const budget = parseInt(elements.newBudget?.value) || 500000;

            if (!grade || !classNum || !teacher) {
                showNotification('오류', '모든 필드를 입력해주세요.', 'error');
                return;
            }

            // 임시로 로컬 스토리지에 저장
            const classes = JSON.parse(localStorage.getItem('school_classes') || '[]');
            const classId = `${grade}-${classNum}`;
            
            // 중복 확인
            if (classes.find(c => c.id === classId)) {
                showNotification('오류', '이미 등록된 학급입니다.', 'error');
                return;
            }

            classes.push({
                id: classId,
                grade: parseInt(grade),
                classNumber: parseInt(classNum),
                teacher: teacher,
                budget: budget,
                createdAt: new Date().toISOString()
            });

            localStorage.setItem('school_classes', JSON.stringify(classes));
            
            // 폼 초기화
            if (elements.newGrade) elements.newGrade.value = '';
            if (elements.newClass) elements.newClass.value = '';
            if (elements.newTeacher) elements.newTeacher.value = '';
            if (elements.newBudget) elements.newBudget.value = '500000';

            loadClassList();
            updateStatistics();
            showNotification('성공', '학급이 추가되었습니다.', 'success');
        });
    }

    if (elements.closeNotification) {
        elements.closeNotification.addEventListener('click', () => {
            elements.notification.classList.add('hidden');
        });
    }

    // 학급 삭제 함수를 전역으로 노출
    window.deleteClass = (classId) => {
        if (confirm('정말로 이 학급을 삭제하시겠습니까?')) {
            const classes = JSON.parse(localStorage.getItem('school_classes') || '[]');
            const filteredClasses = classes.filter(c => c.id !== classId);
            localStorage.setItem('school_classes', JSON.stringify(filteredClasses));
            
            loadClassList();
            updateStatistics();
            showNotification('정보', '학급이 삭제되었습니다.', 'info');
        }
    };

    // 페이지 로드 시 초기화
    loadSavedApiKey();
    loadClassList();
    updateStatistics();
}); 