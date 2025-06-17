/**
 * 관리자 페이지 애플리케이션
 */

// alert('admin/admin.js가 실행되었습니다!');

class AdminApp {
    constructor() {
        // alert('AdminApp 생성자 실행됨');
        this.elements = {};
        this.allApplications = [];
        this.classData = {};
        this.sessionTimer = null;
        this.adminSession = null;
        this.selectedGrade = '';
        this.selectedClass = '';
        
        // 인증 체크 먼저 수행
        this.checkAuthentication();
    }

    /**
     * 관리자 인증 체크
     */
    async checkAuthentication() {
        try {
            // 로컬 스토리지에서 세션 정보 확인
            const sessionData = localStorage.getItem('adminSession');
            
            if (!sessionData) {
                this.redirectToLogin();
                return;
            }

            this.adminSession = JSON.parse(sessionData);
            
            // 세션 만료 체크
            if (Date.now() > this.adminSession.expiresAt) {
                this.handleSessionExpired();
                return;
            }

            // 서버에서 관리자 정보 확인
            const response = await fetch('/api/admin/profile');
            
            if (!response.ok) {
                throw new Error('관리자 정보를 확인할 수 없습니다.');
            }

            const adminData = await response.json();
            
            // 인증 성공 - 메인 콘텐츠 표시
            this.showMainContent();
            this.updateAdminInfo(adminData);
            this.startSessionTimer();
            
            // 관리자 앱 초기화
            await this.initializeApp();
            
        } catch (error) {
            console.error('인증 확인 오류:', error);
            this.redirectToLogin();
        }
    }

    /**
     * 메인 콘텐츠 표시
     */
    showMainContent() {
        document.getElementById('authLoading').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    }

    /**
     * 관리자 정보 업데이트
     */
    updateAdminInfo(adminData) {
        const adminEmailElement = document.getElementById('adminEmail');
        if (adminEmailElement && adminData.email) {
            adminEmailElement.textContent = adminData.email;
        }
    }

    /**
     * 세션 타이머 시작
     */
    startSessionTimer() {
        this.updateSessionTimer();
        
        // 1분마다 업데이트
        this.sessionTimer = setInterval(() => {
            this.updateSessionTimer();
        }, 60000);

        // 로그아웃 버튼 이벤트
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    /**
     * 세션 타이머 업데이트
     */
    updateSessionTimer() {
        if (!this.adminSession) return;

        const remainingTime = this.adminSession.expiresAt - Date.now();
        const remainingMinutes = Math.floor(remainingTime / (1000 * 60));

        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            if (remainingMinutes <= 0) {
                this.handleSessionExpired();
                return;
            }

            timerElement.textContent = `${remainingMinutes}분 남음`;
            
            // 5분 이하일 때 경고 색상
            if (remainingMinutes <= 5) {
                timerElement.classList.add('text-red-600');
                timerElement.classList.remove('text-gray-600');
            } else {
                timerElement.classList.add('text-gray-600');
                timerElement.classList.remove('text-red-600');
            }
        }
    }

    /**
     * 세션 만료 처리
     */
    handleSessionExpired() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        localStorage.removeItem('adminSession');
        
        Toast.show('세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
        
        setTimeout(() => {
            this.redirectToLogin();
        }, 2000);
    }

    /**
     * 로그아웃
     */
    logout() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        localStorage.removeItem('adminSession');
        
        Toast.show('로그아웃되었습니다.', 'success');
        
        setTimeout(() => {
            this.redirectToLogin();
        }, 1000);
    }

    /**
     * 로그인 페이지로 리다이렉트
     */
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    /**
     * 관리자 앱 초기화
     */
    async initializeApp() {
        // 알라딘 API 인스턴스를 전역으로 설정
        if (!window.aladinAPI) {
            window.aladinAPI = new AladinAPI();
        }
        
        // API 클라이언트 및 booksAPI 초기화
        if (!window.apiClient) {
            window.apiClient = new APIClient();
        }
        if (!window.booksAPI) {
            window.booksAPI = new BooksAPI(window.apiClient);
        }
        
        console.log('AdminApp 초기화 완료, booksAPI:', window.booksAPI);

        this.apiClient = new APIClient();
        this.applicationsAPI = new ApplicationsAPI();
        this.classesAPI = new ClassesAPI();
        this.booksAPI = new BooksAPI();
        this.aladinAPI = new AladinAPI();
        
        this.currentTab = 'overview';
        this.classSettings = {};
        this.budgetStatus = {};
        
        this.initializeEventListeners();
        
        // 초기 데이터 로드
        await this.loadTabData('overview');

        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 이메일 설정 로드
        this.loadEmailConfig();
    }

    /**
     * 초기화 메서드 (외부에서 호출용)
     */
    async init() {
        // 이미 initializeApp에서 모든 초기화가 완료됨
        console.log('AdminApp init 호출됨');
    }

    /**
     * 이벤트 리스너 초기화
     */
    async initializeEventListeners() {
        // 학년/반 선택 이벤트
        const gradeSelect = document.getElementById('gradeSelect');
        const classSelect = document.getElementById('classSelect');
        
        if (gradeSelect && classSelect) {
            gradeSelect.addEventListener('change', () => this.handleGradeClassChange());
            classSelect.addEventListener('change', () => this.handleGradeClassChange());
        }

        // 탭 전환 이벤트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // 학급 추가 폼 제출
        const classForm = document.getElementById('classForm');
        if (classForm) {
            classForm.addEventListener('submit', (e) => this.handleClassFormSubmit(e));
        }

        // CSV 업로드/다운로드
        const csvUploadBtn = document.getElementById('csvUploadBtn');
        const csvDownloadBtn = document.getElementById('csvDownloadBtn');
        const csvTemplateBtn = document.getElementById('csvTemplateBtn');
        
        if (csvUploadBtn) {
            csvUploadBtn.addEventListener('click', () => this.handleCsvImport());
        }
        if (csvDownloadBtn) {
            csvDownloadBtn.addEventListener('click', () => this.handleCsvExport());
        }
        if (csvTemplateBtn) {
            csvTemplateBtn.addEventListener('click', () => this.downloadCsvTemplate());
        }

        // 예산 분배
        const budgetDistributeBtn = document.getElementById('budgetDistributeBtn');
        if (budgetDistributeBtn) {
            budgetDistributeBtn.addEventListener('click', (e) => this.handleBudgetDistribute(e));
        }

        // 전체 신청 도서 다운로드 버튼
        const downloadAllBooksBtn = document.getElementById('downloadAllBooksBtn');
        if (downloadAllBooksBtn) {
            downloadAllBooksBtn.addEventListener('click', () => this.handleAllBooksDownload());
        }
    }

    /**
     * 학년/반 선택 변경 처리
     */
    handleGradeClassChange() {
        const grade = document.getElementById('gradeSelect').value;
        const classNum = document.getElementById('classSelect').value;
        
        console.log('🔄 학년/반 선택 변경:', grade, classNum);
        
        if (grade && classNum) {
            const classId = `${grade}-${classNum}`;
            console.log('🔍 찾는 학급 ID:', classId);
            
            // 현재 로드된 학급 설정에서 해당 학급 찾기
            if (this.classSettings && this.classSettings[classId]) {
                const classData = this.classSettings[classId];
                console.log('📋 찾은 학급 데이터:', classData);
                
                // 기존 데이터로 폼 채우기 (실제 저장된 값 사용)
                document.getElementById('teacherInput').value = classData.teacher || '';
                document.getElementById('passwordInput').value = classData.password || `class${grade}${classNum}^^`;
                document.getElementById('budgetInput').value = classData.budget || '';
                
                // 자동 계산 플래그 해제
                document.getElementById('budgetInput').removeAttribute('data-auto-calculated');
                
                console.log('✅ 기존 학급 데이터로 폼 업데이트 완료');
                console.log('💰 실제 예산:', classData.budget);
                
                // 사용자에게 알림
                if (classData.teacher) {
                    Toast.show(`${grade}학년 ${classNum}반 기존 정보를 불러왔습니다. (담임: ${classData.teacher})`, 'info');
                } else {
                    Toast.show(`${grade}학년 ${classNum}반을 선택했습니다. 기존 학급 정보를 수정하세요.`, 'info');
                }
            } else {
                console.log('📝 새로운 학급 - 자동 예산 계산 시작');
                
                // 새로운 학급인 경우 자동 균등분배 예산 계산
                const currentTotalBudget = Object.values(this.classSettings || {})
                    .reduce((sum, cls) => sum + (cls.budget || 0), 0);
                const currentClassCount = Object.keys(this.classSettings || {}).length;
                
                let suggestedBudget;
                let budgetMessage;
                
                if (currentTotalBudget > 0 && currentClassCount > 0) {
                    // 기존 예산이 있으면 균등분배 계산
                    suggestedBudget = Math.floor(currentTotalBudget / (currentClassCount + 1));
                    budgetMessage = `💡 자동 계산: 전체 예산 ${Utils.formatPrice(currentTotalBudget)}원을 ${currentClassCount + 1}개 학급으로 균등분배`;
                    console.log('⚖️ 자동 균등분배 예산 계산:', suggestedBudget);
                } else {
                    // 첫 번째 학급이거나 기존 예산이 없으면 기본값
                    suggestedBudget = 500000;
                    budgetMessage = `🆕 첫 번째 학급 기본 예산`;
                    console.log('🔧 기본 예산 적용:', suggestedBudget);
                }
                
                // 새로운 학급 폼 설정
                document.getElementById('teacherInput').value = '';
                document.getElementById('passwordInput').value = `class${grade}${classNum}^^`;
                
                const budgetInput = document.getElementById('budgetInput');
                budgetInput.value = suggestedBudget;
                
                // 자동 계산 플래그 설정 (중요!)
                budgetInput.setAttribute('data-auto-calculated', 'true');
                budgetInput.setAttribute('title', budgetMessage);
                
                Toast.show(
                    `🆕 ${grade}학년 ${classNum}반은 새로운 학급입니다.\n` +
                    `${budgetMessage} (${Utils.formatPrice(suggestedBudget)}원)\n` +
                    `원하시면 예산을 수정할 수 있습니다.`, 
                    'info'
                );
                
                console.log('✅ 새 학급 자동 예산 설정 완료:', suggestedBudget);
            }
        } else {
            console.log('🧹 학년 또는 반이 선택되지 않음 - 폼 초기화');
            
            // 학년 또는 반이 선택되지 않은 경우 관련 필드 초기화
            if (!grade || !classNum) {
                document.getElementById('teacherInput').value = '';
                document.getElementById('passwordInput').value = '';
                document.getElementById('budgetInput').value = '';
                document.getElementById('budgetInput').removeAttribute('data-auto-calculated');
            }
        }
    }

    /**
     * 탭 전환
     */
    switchTab(tabName) {
        // 탭 버튼 활성화 상태 변경
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-blue-500', 'text-blue-600');
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
        }

        // 탭 패널 표시/숨김
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.add('hidden');
            panel.classList.remove('active');
        });

        const activePanel = document.getElementById(`${tabName}-tab`);
        if (activePanel) {
            activePanel.classList.remove('hidden');
            activePanel.classList.add('active');
        }

        this.currentTab = tabName;

        // 탭별 데이터 로드
        this.loadTabData(tabName);
    }

    /**
     * 탭별 데이터 로드
     */
    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'overview':
                    await this.loadOverviewData();
                    break;
                case 'classes':
                    await this.loadClassesData();
                    break;
                case 'class-settings':
                    await this.loadClassSettings();
                    break;
                case 'budget':
                    await this.loadBudgetData();
                    break;
                case 'books':
                    await this.loadOwnedBooks();
                    break;
                case 'settings':
                    await this.loadSystemSettings();
                    break;
            }
        } catch (error) {
            console.error(`탭 데이터 로드 오류 (${tabName}):`, error);
            Toast.show(`데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * 학급 설정 폼 제출 처리
     */
    async handleClassFormSubmit(e) {
        e.preventDefault();
        
        const grade = document.getElementById('gradeSelect').value;
        const classNum = document.getElementById('classSelect').value;
        const teacher = document.getElementById('teacherInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim() || `class${grade}${classNum}^^`;
        const budgetInput = document.getElementById('budgetInput').value.trim();
        
        if (!grade || !classNum || !teacher) {
            Toast.show('학년, 반, 담임교사는 필수 입력 항목입니다.', 'error');
            return;
        }
        
        const classId = `${grade}-${classNum}`;
        const isNewClass = !this.classSettings || !this.classSettings[classId];
        
        // 새 학급 생성 시 예산 처리 안내
        if (isNewClass && !budgetInput) {
            // 현재 전체 예산 계산
            const currentTotalBudget = Object.values(this.classSettings || {})
                .reduce((sum, cls) => sum + (cls.budget || 0), 0);
            const currentClassCount = Object.keys(this.classSettings || {}).length;
            
            if (currentTotalBudget > 0 && currentClassCount > 0) {
                const newBudgetPerClass = Math.floor(currentTotalBudget / (currentClassCount + 1));
                const confirmed = confirm(
                    `새로운 학급을 추가하시겠습니까?\n\n` +
                    `🔄 자동 예산 재분배 안내:\n` +
                    `• 현재 전체 예산: ${Utils.formatPrice(currentTotalBudget)}원\n` +
                    `• 기존 학급 수: ${currentClassCount}개\n` +
                    `• 새 학급 포함: ${currentClassCount + 1}개\n` +
                    `• 재분배 후 학급당 예산: ${Utils.formatPrice(newBudgetPerClass)}원\n\n` +
                    `모든 학급의 예산이 균등하게 재조정됩니다.\n계속하시겠습니까?`
                );
                
                if (!confirmed) {
                    return;
                }
            }
        }
        
        // 기존 학급 예산 변경 시 경고
        if (!isNewClass && budgetInput) {
            const budget = parseInt(budgetInput);
            if (isNaN(budget) || budget <= 0) {
                Toast.show('올바른 예산을 입력해주세요. (0보다 큰 숫자)', 'error');
                return;
            }
            
            if (this.classSettings && this.classSettings[classId]) {
                const existingBudget = this.classSettings[classId].budget;
                if (existingBudget && existingBudget !== budget) {
                    const confirmed = confirm(
                        `기존 예산 ${Utils.formatPrice(existingBudget)}원에서 ${Utils.formatPrice(budget)}원으로 변경됩니다.\n` +
                        `이는 전체 예산 합계에 영향을 줄 수 있습니다.\n계속하시겠습니까?`
                    );
                    if (!confirmed) {
                        return;
                    }
                    console.log('⚠️ 예산 변경:', existingBudget, '→', budget);
                }
            }
        }

        try {
            // 자동 계산 여부 확인
            const budgetInputElement = document.getElementById('budgetInput');
            const isAutoCalculated = budgetInputElement.hasAttribute('data-auto-calculated');
            const budgetValue = budgetInput ? parseInt(budgetInput) : null;
            
            console.log('💡 자동 계산 여부:', isAutoCalculated);
            console.log('💰 예산 값:', budgetValue);
            
            // 새 학급이든 기존 학급이든 동일한 API 사용
            const requestData = {
                classId,
                grade: parseInt(grade),
                classNum: parseInt(classNum),
                teacher,
                password,
                budget: isAutoCalculated ? null : budgetValue,  // 자동 계산된 경우 null로 전송
                autoRedistribute: isNewClass && isAutoCalculated  // 새 학급이면서 자동 계산된 경우
            };
            
            console.log('📤 서버로 전송할 데이터:', requestData);
            
            const response = await this.classesAPI.saveClassSettings(requestData);

            if (isNewClass) {
                if (response.autoRedistributed) {
                    Toast.show(
                        `새 학급이 생성되었습니다! 🎉\n` +
                        `전체 예산이 ${response.totalClasses}개 학급으로 균등분배되어 ` +
                        `학급당 ${Utils.formatPrice(response.newBudgetPerClass)}원이 할당되었습니다.`, 
                        'success'
                    );
                } else {
                    Toast.show('새 학급이 생성되었습니다!', 'success');
                }
            } else {
                Toast.show('학급 정보가 저장되었습니다.', 'success');
            }

            this.resetClassForm();
            await this.loadClassSettings();
            
            // 예산 탭도 새로고침 (재분배가 발생했을 수 있으므로)
            if (this.currentTab === 'budget' || (isNewClass && response.autoRedistributed)) {
                await this.loadBudgetData();
            }
            
        } catch (error) {
            console.error('학급 설정 저장 오류:', error);
            Toast.show(`학급 정보 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * 학급 설정 폼 초기화
     */
    resetClassForm() {
        // 드롭다운 선택 초기화
        const gradeSelect = document.getElementById('gradeSelect');
        const classSelect = document.getElementById('classSelect');
        const teacherInput = document.getElementById('teacherInput');
        const passwordInput = document.getElementById('passwordInput');
        const budgetInput = document.getElementById('budgetInput');
        
        if (gradeSelect) {
            gradeSelect.value = '';
            gradeSelect.selectedIndex = 0;
        }
        if (classSelect) {
            classSelect.value = '';
            classSelect.selectedIndex = 0;
        }
        if (teacherInput) {
            teacherInput.value = '';
        }
        if (passwordInput) {
            passwordInput.value = '';
        }
        if (budgetInput) {
            budgetInput.value = '';
            // 자동 계산 플래그 제거
            budgetInput.removeAttribute('data-auto-calculated');
        }
        
        console.log('📝 학급 추가/수정 폼이 초기화되었습니다.');
    }

    /**
     * CSV 가져오기 처리
     */
    async handleCsvImport() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];

        if (!file) {
            Toast.show('CSV 파일을 선택해주세요.', 'error');
            return;
        }

        try {
            const csvText = await this.readFileAsText(file);
            const csvData = this.parseCsv(csvText);

            const response = await this.classesAPI.importCsv(csvData);
            
            Toast.show(`${response.importedCount}개 학급이 가져오기 완료되었습니다.`, 'success');
            
            if (response.errors && response.errors.length > 0) {
                console.warn('가져오기 오류:', response.errors);
                Toast.show(`일부 오류가 발생했습니다. 콘솔을 확인해주세요.`, 'warning');
            }

            fileInput.value = '';
            await this.loadClassSettings();
        } catch (error) {
            console.error('CSV 가져오기 오류:', error);
            Toast.show(`CSV 가져오기 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * CSV 내보내기 처리
     */
    async handleCsvExport() {
        try {
            const settings = await this.classesAPI.getClassSettings();
            const csvData = this.convertToCsv(settings);
            
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `학급설정_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            Toast.show('학급 설정이 CSV 파일로 내보내기 완료되었습니다.', 'success');
        } catch (error) {
            console.error('CSV 내보내기 오류:', error);
            Toast.show(`CSV 내보내기 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * CSV 템플릿 다운로드
     */
    downloadCsvTemplate() {
        const template = '학년,반,담임교사,비밀번호,예산\n1,1,김영희,class2024!,500000\n2,1,이철수,class2024!,500000';
        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '학급설정_템플릿.csv';
        link.click();
        
        Toast.show('CSV 템플릿이 다운로드되었습니다.', 'success');
    }

    /**
     * 예산 분배 처리
     */
    async handleBudgetDistribute(e) {
        e.preventDefault();
        
        const totalBudget = parseInt(document.getElementById('totalBudgetInput').value);
        
        if (!totalBudget || totalBudget <= 0) {
            Toast.show('올바른 예산을 입력해주세요.', 'error');
            return;
        }

        try {
            const response = await this.classesAPI.distributeBudget(totalBudget);
            
            Toast.show(`${response.classCount}개 학급에 학급당 ${Utils.formatPrice(response.budgetPerClass)}원씩 균등 분배되었습니다.`, 'success');
            
            document.getElementById('totalBudgetInput').value = '';
            await this.loadBudgetData();
            await this.loadClassSettings();
        } catch (error) {
            console.error('예산 분배 오류:', error);
            Toast.show(`예산 분배 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * 학급 설정 로드
     */
    async loadClassSettings() {
        try {
            console.log('🔍 학급 설정 로드 시작...');
            const classSettingsArray = await this.classesAPI.getClassSettings();
            console.log('📊 로드된 학급 설정 배열:', classSettingsArray);
            
            // 배열을 객체로 변환 (classId를 키로 사용)
            this.classSettings = {};
            if (Array.isArray(classSettingsArray)) {
                classSettingsArray.forEach(classData => {
                    this.classSettings[classData.classId] = classData;
                });
            }
            
            console.log('📊 변환된 학급 설정 객체:', this.classSettings);
            console.log('📊 학급 설정 개수:', Object.keys(this.classSettings).length);
            this.renderClassSettingsTable();
            console.log('✅ 학급 설정 테이블 렌더링 완료');
        } catch (error) {
            console.error('❌ 학급 설정 로드 오류:', error);
            Toast.show('학급 설정을 불러올 수 없습니다.', 'error');
        }
    }

    /**
     * 예산 관리 탭 로드
     */
    async loadBudgetData() {
        try {
            await this.loadClassSettings();
            
            // 예산 상태도 로드
            this.budgetStatus = await this.classesAPI.getBudgetStatus();
            
            if (this.classSettings && Object.keys(this.classSettings).length > 0) {
                // 현재 전체 예산 계산
                const totalBudget = Object.values(this.classSettings)
                    .reduce((sum, classData) => sum + (classData.budget || 0), 0);
                
                // 전체 예산 입력 필드에 현재 값 설정
                const totalBudgetInput = document.getElementById('totalBudgetInput');
                if (totalBudgetInput) {
                    totalBudgetInput.value = totalBudget;
                }
                
                this.renderBudgetSummary();
                this.renderBudgetTable();
            } else {
                // 학급이 없으면 0으로 설정
                const totalBudgetInput = document.getElementById('totalBudgetInput');
                if (totalBudgetInput) {
                    totalBudgetInput.value = 0;
                }
            }
        } catch (error) {
            console.error('예산 데이터 로드 오류:', error);
            this.showToast('예산 데이터를 불러오는데 실패했습니다.', 'error');
        }
    }

    /**
     * 학급 설정 테이블 렌더링
     */
    renderClassSettingsTable() {
        console.log('🎨 학급 설정 테이블 렌더링 시작...');
        const tbody = document.getElementById('classSettingsTable');
        console.log('📋 테이블 tbody 요소:', tbody);
        
        if (!tbody) {
            console.error('❌ classSettingsTable 요소를 찾을 수 없음');
            return;
        }

        tbody.innerHTML = '';
        console.log('🧹 기존 테이블 내용 초기화 완료');

        if (!this.classSettings) {
            console.error('❌ classSettings 데이터가 없음');
            return;
        }

        // 학급을 학년-반 순서로 정렬
        const sortedEntries = Object.entries(this.classSettings).sort(([, a], [, b]) => {
            // 학년 우선 정렬, 같은 학년이면 반으로 정렬
            if (a.grade !== b.grade) {
                return a.grade - b.grade;
            }
            return a.class - b.class;
        });
        
        console.log('처리할 학급 수:', sortedEntries.length);

        sortedEntries.forEach(([classId, classData], index) => {
            console.log(`🏫 학급 ${index + 1} 처리 중:`, classId, classData);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${classData.grade}학년 ${classData.class}반
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${classData.teacher}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center space-x-2">
                        <span id="password-${classId}" class="text-gray-600 font-mono">${classData.password}</span>
                        <button onclick="adminApp.editPassword('${classId}', '${classData.password}')" 
                                class="text-blue-600 hover:text-blue-900 text-xs">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.formatPrice(classData.budget)}원
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${Utils.formatDate(classData.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onclick="adminApp.editClass('${classId}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminApp.deleteClass('${classId}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            console.log(`✅ 학급 ${classId} 행 추가 완료`);
        });
        
        console.log('🎉 학급 설정 테이블 렌더링 완료');
    }

    /**
     * 예산 요약 렌더링
     */
    renderBudgetSummary() {
        const container = document.getElementById('budgetSummary');
        if (!container || !this.budgetStatus.summary) return;

        const summary = this.budgetStatus.summary;
        
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${Utils.formatPrice(summary.totalBudget)}원</div>
                    <div class="text-sm text-gray-600">전체 예산</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${Utils.formatPrice(summary.totalUsed)}원</div>
                    <div class="text-sm text-gray-600">사용 예산</div>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">${Utils.formatPrice(summary.totalRemaining)}원</div>
                    <div class="text-sm text-gray-600">잔여 예산</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">${summary.overallUsagePercentage}%</div>
                    <div class="text-sm text-gray-600">전체 사용률</div>
                </div>
            </div>
        `;
    }

    /**
     * 예산 테이블 렌더링
     */
    renderBudgetTable() {
        const tbody = document.getElementById('budgetTable');
        if (!tbody || !this.budgetStatus.budgetStatus) return;

        tbody.innerHTML = '';

        Object.entries(this.budgetStatus.budgetStatus).forEach(([classId, status]) => {
            const row = document.createElement('tr');
            const usageColor = status.usagePercentage >= 90 ? 'text-red-600' : 
                              status.usagePercentage >= 70 ? 'text-orange-600' : 'text-green-600';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${status.grade}학년 ${status.class}반
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${status.teacher}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.formatPrice(status.budget)}원
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.formatPrice(status.usedBudget)}원
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.formatPrice(status.remainingBudget)}원
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${usageColor}">
                    ${status.usagePercentage}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onclick="adminApp.editBudget('${classId}', ${status.budget})" class="text-blue-600 hover:text-blue-900">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * 학급 편집
     */
    async editClass(classId) {
        console.log('✏️ 학급 편집 시작:', classId);
        console.log('📊 현재 classSettings:', this.classSettings);
        
        const classData = this.classSettings[classId];
        console.log('🏫 편집할 학급 데이터:', classData);
        
        if (!classData) {
            console.error('❌ 학급 데이터를 찾을 수 없음:', classId);
            return;
        }

        // 폼에 데이터 채우기
        console.log('📝 폼에 데이터 설정 중...');
        console.log('💰 현재 학급 예산 값:', classData.budget);
        console.log('💰 예산 값 타입:', typeof classData.budget);
        
        document.getElementById('gradeSelect').value = classData.grade;
        document.getElementById('classSelect').value = classData.class;
        document.getElementById('teacherInput').value = classData.teacher || '';
        document.getElementById('passwordInput').value = classData.password || '';
        
        // 예산 값 설정 전후 로그
        const budgetInput = document.getElementById('budgetInput');
        console.log('💰 예산 입력 필드 설정 전 값:', budgetInput.value);
        budgetInput.value = classData.budget || '';
        console.log('💰 예산 입력 필드 설정 후 값:', budgetInput.value);
        
        console.log('✅ 폼 데이터 설정 완료');
        console.log('👨‍🏫 담임교사:', classData.teacher);

        // 학급 설정 탭으로 이동
        this.switchTab('class-settings');
        
        Toast.show('학급 정보를 수정하고 저장 버튼을 클릭하세요.', 'info');
    }

    /**
     * 학급 삭제
     */
    async deleteClass(classId) {
        const classData = this.classSettings[classId];
        if (!classData) return;

        // 삭제 시 예산 재분배 계산
        const currentTotalBudget = Object.values(this.classSettings)
            .reduce((sum, cls) => sum + (cls.budget || 0), 0);
        const deletedClassBudget = classData.budget || 0;
        // 삭제된 학급의 예산도 재분배에 포함 (서버 로직과 동일하게)
        const totalBudgetToRedistribute = currentTotalBudget;
        const remainingClassCount = Object.keys(this.classSettings).length - 1;
        
        let confirmMessage = `${classData.grade}학년 ${classData.class}반을 삭제하시겠습니까?`;
        
        // 예산 재분배 정보 추가
        if (remainingClassCount > 0 && totalBudgetToRedistribute > 0) {
            const newBudgetPerClass = Math.floor(totalBudgetToRedistribute / remainingClassCount);
            confirmMessage += `\n\n💰 예산 재분배 안내:`;
            confirmMessage += `\n• 삭제할 학급 예산: ${Utils.formatPrice(deletedClassBudget)}원`;
            confirmMessage += `\n• 전체 예산: ${Utils.formatPrice(currentTotalBudget)}원`;
            confirmMessage += `\n• 남은 학급 수: ${remainingClassCount}개`;
            confirmMessage += `\n• 재분배 후 학급당 예산: ${Utils.formatPrice(newBudgetPerClass)}원`;
            confirmMessage += `\n\n삭제된 학급의 예산도 포함하여 모든 학급의 예산이 자동으로 재조정됩니다.`;
        } else if (remainingClassCount === 0) {
            confirmMessage += `\n\n⚠️ 마지막 학급을 삭제하시겠습니까?`;
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // DELETE API 호출
            const response = await this.apiClient.delete(`/classes/${classId}`);
            
            if (response.budgetRedistributed) {
                const redistInfo = response.redistributionInfo;
                Toast.show(
                    `${classData.grade}학년 ${classData.class}반이 삭제되었습니다! 🗑️\n` +
                    `남은 ${redistInfo.remainingClassCount}개 학급으로 ` +
                    `${Utils.formatPrice(redistInfo.newTotalBudget)}원이 균등분배되어 ` +
                    `학급당 ${Utils.formatPrice(redistInfo.newBudgetPerClass)}원이 할당되었습니다.`, 
                    'success'
                );
            } else {
                Toast.show(response.message || '학급이 삭제되었습니다.', 'success');
            }
            
            // 학급 설정과 예산 데이터 새로고침
            await this.loadClassSettings();
            if (this.currentTab === 'budget') {
                await this.loadBudgetData();
            }
            
            // 폼 초기화 - 삭제된 학급이 폼에 남아있지 않도록
            this.resetClassForm();
            
        } catch (error) {
            console.error('학급 삭제 오류:', error);
            
            if (error.message && error.message.includes('신청 내역이 있습니다')) {
                Toast.show(
                    `삭제할 수 없습니다.\n${error.message}\n\n신청 목록에서 해당 학급의 신청을 먼저 정리해주세요.`, 
                    'error'
                );
            } else {
                Toast.show(`학급 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
            }
        }
    }

    /**
     * 패스워드 편집
     */
    async editPassword(classId, currentPassword) {
        console.log('🔐 패스워드 편집 시작:', classId, currentPassword);
        
        const classData = this.classSettings[classId];
        if (!classData) {
            console.error('❌ 학급 데이터를 찾을 수 없음:', classId);
            return;
        }

        // 현재 패스워드를 기본값으로 하는 프롬프트
        const newPassword = prompt(
            `${classData.grade}학년 ${classData.class}반의 새 패스워드를 입력하세요:\n\n기본 형식 예시:\n• class${classData.grade}${classData.class}^^ (개별 패스워드)\n• class2024! (공통 패스워드)`, 
            currentPassword
        );
        
        if (newPassword === null || newPassword === currentPassword) {
            console.log('💬 패스워드 변경 취소됨');
            return;
        }

        // 패스워드 정규화 (소문자 변환 + 공백 제거)
        const normalizedPassword = newPassword.toLowerCase().replace(/\s/g, '');
        
        if (normalizedPassword.trim() === '') {
            Toast.show('패스워드가 비어있습니다.', 'error');
            return;
        }

        try {
            console.log('🔄 패스워드 업데이트 시도...');
            
            // 새로운 클래스 데이터 생성 (패스워드만 변경)
            const updatedClassData = {
                ...classData,
                password: normalizedPassword
            };

            // 서버에 업데이트 요청
            await this.classesAPI.updateClass(classId, updatedClassData);
            
            console.log('✅ 패스워드 업데이트 성공');
            
            // 로컬 데이터 업데이트
            this.classSettings[classId].password = normalizedPassword;
            
            // UI 업데이트 (해당 셀만)
            const passwordElement = document.getElementById(`password-${classId}`);
            if (passwordElement) {
                passwordElement.textContent = normalizedPassword;
            }
            
            Toast.show(`${classData.grade}학년 ${classData.class}반 패스워드가 변경되었습니다.`, 'success');
            
        } catch (error) {
            console.error('❌ 패스워드 업데이트 오류:', error);
            Toast.show(`패스워드 변경 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * 예산 편집
     */
    async editBudget(classId, currentBudget) {
        const newBudget = prompt(`새로운 예산을 입력하세요 (현재: ${Utils.formatPrice(currentBudget)}원):`, currentBudget);
        
        if (newBudget === null) return;
        
        const budget = parseInt(newBudget);
        if (isNaN(budget) || budget < 0) {
            Toast.show('올바른 예산을 입력해주세요.', 'error');
            return;
        }

        try {
            await this.classesAPI.updateClassBudget(classId, budget);
            Toast.show('예산이 수정되었습니다.', 'success');
            await this.loadBudgetData();
        } catch (error) {
            console.error('예산 수정 오류:', error);
            Toast.show(`예산 수정 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    /**
     * 파일을 텍스트로 읽기
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * CSV 파싱
     */
    parseCsv(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        });
    }

    /**
     * 객체를 CSV로 변환
     */
    convertToCsv(data) {
        const headers = ['학년', '반', '담임교사', '비밀번호', '예산'];
        const rows = [headers.join(',')];
        
        Object.values(data).forEach(classData => {
            const row = [
                classData.grade,
                classData.class,
                classData.teacher,
                classData.password,
                classData.budget
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    /**
     * 기보유 도서 CSV 업로드 버튼 클릭 처리
     */
    handleOwnedBooksCsvUpload() {
        const fileInput = document.getElementById('ownedBooksFile');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * 기보유 도서 파일 선택 처리
     */
    async handleOwnedBooksFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showToast('CSV 파일만 업로드 가능합니다.', 'error');
            return;
        }

        const uploadBtn = document.getElementById('uploadOwnedBooksBtn');
        const originalText = uploadBtn.innerHTML;

        try {
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>업로드 중...';
            uploadBtn.disabled = true;

            // FormData 생성
            const formData = new FormData();
            formData.append('csvFile', file);

            // 서버에 업로드
            const response = await fetch('/api/books/library-holdings/upload-csv', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast(result.message, 'success');
                
                // 백그라운드 처리가 시작된 경우 진행 상황 모니터링 시작
                if (result.status === 'processing') {
                    this.startProgressMonitoring();
                }
                
                // 기보유 도서 목록 새로고침
                await this.loadOwnedBooks();
            } else {
                this.showToast(result.error || 'CSV 업로드에 실패했습니다.', 'error');
            }

        } catch (error) {
            console.error('CSV 업로드 오류:', error);
            this.showToast('CSV 업로드 중 오류가 발생했습니다.', 'error');
        } finally {
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
            
            // 파일 입력 초기화
            event.target.value = '';
        }
    }

    /**
     * 진행 상황 모니터링 시작
     */
    startProgressMonitoring() {
        // 기존 모니터링이 있으면 중지
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        console.log('📊 진행 상황 모니터링 시작');
        
        // 30초마다 진행 상황 확인
        this.progressInterval = setInterval(async () => {
            try {
                await this.checkProcessingProgress();
                await this.loadOwnedBooks(); // 도서 목록도 업데이트
            } catch (error) {
                console.error('진행 상황 모니터링 오류:', error);
            }
        }, 30000);
        
        // 10분 후 자동 중지 (서버 부하 방지)
        setTimeout(() => {
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
                console.log('📊 진행 상황 모니터링 자동 중지');
            }
        }, 600000); // 10분
    }

    /**
     * 진행 상황 모니터링 중지
     */
    stopProgressMonitoring() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
            console.log('📊 진행 상황 모니터링 중지');
        }
    }

    /**
     * 기보유 도서 CSV 다운로드 처리
     */
    async handleOwnedBooksCsvDownload() {
        const downloadBtn = document.getElementById('downloadOwnedBooksBtn');
        const originalText = downloadBtn.innerHTML;

        try {
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>다운로드 중...';
            downloadBtn.disabled = true;

            const response = await fetch('/api/books/library-holdings/download-csv');
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `library-holdings-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showToast('CSV 파일이 다운로드되었습니다.', 'success');
            } else {
                const result = await response.json();
                this.showToast(result.error || 'CSV 다운로드에 실패했습니다.', 'error');
            }

        } catch (error) {
            console.error('CSV 다운로드 오류:', error);
            this.showToast('CSV 다운로드 중 오류가 발생했습니다.', 'error');
        } finally {
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }
    }

    /**
     * 기존 이벤트 리스너 초기화
     */
    initializeExistingEventListeners() {
        // 기존 코드 유지...
    }

    /**
     * 전체 현황 데이터 로드
     */
    async loadOverviewData() {
        try {
            const response = await fetch('/api/classes/admin/stats');
            if (!response.ok) throw new Error('전체 현황 데이터를 불러올 수 없습니다.');
            const stats = await response.json();
            const { overview, classStats, recentApplications } = stats;

            // 전체 신청 도서 목록(전체 데이터) 추가 호출
            const allAppsRes = await fetch('/api/classes/admin/all-applications');
            const allAppsData = await allAppsRes.json();
            const allApplications = allAppsData.applications || [];

            // classSettings 불러오기 및 드롭다운 옵션 갱신
            const classSettingsArray = await this.classesAPI.getClassSettings();
            this.classSettings = {};
            if (Array.isArray(classSettingsArray)) {
                classSettingsArray.forEach(classData => {
                    this.classSettings[classData.classId] = classData;
                });
            }
            this.updateGradeFilterOptions();
            this.updateClassFilterOptions();

            // 총 신청 도서
            const totalBooksEl = document.getElementById('totalBooks');
            if (totalBooksEl) totalBooksEl.textContent = overview.totalBooks || 0;

            // 총 신청 금액
            const totalAmountEl = document.getElementById('totalAmount');
            if (totalAmountEl) totalAmountEl.textContent = Utils.formatPrice(overview.totalAmount || 0) + '원';

            // 활성 학급
            const activeClassesEl = document.getElementById('activeClasses');
            if (activeClassesEl) activeClassesEl.textContent = overview.activeClasses || 0;

            // 평균 예산 사용률
            const avgBudgetUsageEl = document.getElementById('avgBudgetUsage');
            if (avgBudgetUsageEl) avgBudgetUsageEl.textContent = (overview.avgBudgetUsage || 0) + '%';

            // 학급별 신청 현황 테이블
            const classStatsTable = document.getElementById('classStatsTable');
            if (classStatsTable) {
                classStatsTable.innerHTML = Object.values(classStats).map(cls => `
                    <tr>
                        <td>${cls.grade}학년 ${cls.class}반</td>
                        <td>${cls.teacher || '-'}</td>
                        <td>${cls.totalBooks || 0}</td>
                        <td>${Utils.formatPrice(cls.budget.used)}원 / ${Utils.formatPrice(cls.budget.total)}원</td>
                        <td>${cls.budget.percentage}%</td>
                        <td></td>
                    </tr>
                `).join('');
            }

            // 최근 신청 도서 테이블
            const recentTable = document.getElementById('recentApplicationsTable');
            if (recentTable) {
                recentTable.innerHTML = recentApplications.map(app => `
                    <tr>
                        <td>${Utils.escapeHtml(app.title)}</td>
                        <td>${Utils.escapeHtml(app.author)}</td>
                        <td>${app.classId}</td>
                        <td>${Utils.formatPrice(app.price)}원</td>
                        <td>${Utils.formatDate(app.appliedAt)}</td>
                        <td></td>
                    </tr>
                `).join('');
            }

            // 전체 신청 도서 목록(ISBN별 집계) 테이블 렌더링 - 전체 데이터 사용
            this.renderAllApplicationsTable(allApplications);
        } catch (error) {
            console.error('전체 현황 데이터 로드 오류:', error);
            Toast.show('전체 현황 데이터를 불러올 수 없습니다.', 'error');
        }
    }

    // 전체 신청 도서 목록 페이징 관련 변수
    PAGE_SIZE = 20;
    allBooksData = [];
    currentPage = 1;

    renderAllApplicationsTablePage(page) {
        this.currentPage = page;
        const start = (page - 1) * this.PAGE_SIZE;
        const end = start + this.PAGE_SIZE;
        const pageData = this.allBooksData.slice(start, end);
        const tbody = document.getElementById('allApplicationsTable');
        if (!tbody) return;
        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-gray-400 py-8">신청 도서 데이터가 없습니다.</td></tr>`;
            // 테이블 렌더링 후 이벤트 리스너 등록
            if (typeof this.setupFilterEventListeners === 'function') {
                this.setupFilterEventListeners();
            }
            return;
        }
        tbody.innerHTML = pageData.map(book => `
            <tr>
                <td class="px-6 py-4 break-words w-80">${this.escapeHtml(book.title)}</td>
                <td class="px-6 py-4 break-words w-48">${this.escapeHtml(book.author)}</td>
                <td class="px-6 py-4 break-words">${this.escapeHtml(book.publisher)}</td>
                <td class="px-6 py-4 text-right w-10">${book.count}</td>
                <td class="px-6 py-4 text-right">${this.formatPrice(book.price)}원</td>
                <td class="px-6 py-4 text-right">${this.formatPrice(book.price * book.count)}원</td>
                <td class="px-6 py-4 text-center w-6">${book.grade}</td>
                <td class="px-6 py-4 text-center w-6">${book.class}</td>
            </tr>
        `).join('');
        // 테이블 렌더링 후 이벤트 리스너 등록
        if (typeof this.setupFilterEventListeners === 'function') {
            this.setupFilterEventListeners();
        }
    }

    renderAllBooksPagination() {
        const totalPages = Math.ceil(this.allBooksData.length / this.PAGE_SIZE);
        console.log('allBooksData.length:', this.allBooksData.length, 'totalPages:', totalPages); // 디버깅용
        const container = document.getElementById('allBooksPagination');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'px-2 py-1 rounded border text-sm ' + (i === this.currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600');
            btn.addEventListener('click', () => {
                this.renderAllApplicationsTablePage(i);
                this.renderAllBooksPagination();
            });
            container.appendChild(btn);
        }
    }

    renderAllApplicationsTable(applications) {
        this.allApplications = applications; // 전체 데이터 저장
        let filtered = applications;
        if (this.selectedGrade && this.selectedClass) {
            // 학년+반 모두 선택 시 classId로 정확히 필터
            filtered = filtered.filter(app => app.classId === `${this.selectedGrade}-${this.selectedClass}`);
        } else if (this.selectedGrade) {
            // 학년만 선택 시 (반 전체)
            filtered = filtered.filter(app => (app.classId || '').split('-')[0] === this.selectedGrade);
        }
        // 단순 리스트업: classId에서 grade/class를 파싱해서 각 반의 신청 도서를 모두 보여줌
        this.allBooksData = filtered.map(app => {
            const [grade, classNum] = (app.classId || '').split('-');
            return {
                isbn: app.isbn,
                title: app.title,
                author: app.author,
                publisher: app.publisher,
                price: app.price,
                count: app.count || 1,
                grade: grade || '',
                class: classNum || ''
            };
        });
        this.renderAllApplicationsTablePage(1);
        this.renderAllBooksPagination();
    }

    // 가격 포맷팅 함수
    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * 학급 관리 데이터 로드
     */
    async loadClassesData() {
        try {
            console.log('🏫 학급 관리 데이터 로드 시작...');
            // 학급 설정과 예산 현황 데이터 로드
            const [classSettingsRaw, budgetStatus] = await Promise.all([
                this.classesAPI.getClassSettings(),
                this.classesAPI.getBudgetStatus()
            ]);
            console.log('📊 학급 설정 데이터:', classSettingsRaw);
            console.log('💰 예산 현황 데이터:', budgetStatus);
            // classSettings가 배열이면 객체로 변환
            let classSettings = classSettingsRaw;
            if (Array.isArray(classSettingsRaw)) {
                const obj = {};
                classSettingsRaw.forEach(cls => {
                    obj[`${cls.grade}-${cls.class}`] = cls;
                });
                classSettings = obj;
            }
            // this.classSettings에 데이터 저장 (editClass에서 사용하기 위해)
            this.classSettings = classSettings;
            this.budgetStatus = budgetStatus;
            this.renderClassDetailsList(classSettings, budgetStatus);
            console.log('✅ 학급 상세 현황 렌더링 완료');
        } catch (error) {
            console.error('❌ 학급 관리 데이터 로드 오류:', error);
            Toast.show('학급 관리 데이터를 불러올 수 없습니다.', 'error');
        }
    }

    /**
     * 학급별 상세 현황 렌더링
     */
    renderClassDetailsList(classSettings, budgetStatus) {
        const container = document.getElementById('classDetailsList');
        if (!container) {
            console.error('❌ classDetailsList 컨테이너를 찾을 수 없음');
            return;
        }

        if (!classSettings || Object.keys(classSettings).length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-school text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">등록된 학급이 없습니다</h3>
                    <p class="text-gray-500">학급 설정 탭에서 학급을 추가해주세요.</p>
                </div>
            `;
            return;
        }

        // 학급을 학년-반 순서로 정렬
        const sortedClasses = Object.entries(classSettings).sort(([, a], [, b]) => {
            // 학년 우선 정렬, 같은 학년이면 반으로 정렬
            if (a.grade !== b.grade) {
                return a.grade - b.grade;
            }
            return a.class - b.class;
        });

        const classCards = sortedClasses.map(([classId, classData]) => {
            const budget = budgetStatus?.budgetStatus?.[classId] || {
                budget: classData.budget || 0,
                usedBudget: 0,
                remainingBudget: classData.budget || 0,
                usagePercentage: 0
            };

            const usageColor = budget.usagePercentage >= 90 ? 'text-red-600' : 
                              budget.usagePercentage >= 70 ? 'text-orange-600' : 'text-green-600';
            
            const progressColor = budget.usagePercentage >= 90 ? 'bg-red-500' : 
                                 budget.usagePercentage >= 70 ? 'bg-orange-500' : 'bg-blue-500';

            return `
                <div class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-900">
                                ${classData.grade}학년 ${classData.class}반
                            </h4>
                            <p class="text-sm text-gray-600">
                                담임: ${classData.teacher || '미설정'}
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                classData.teacher ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }">
                                ${classData.teacher ? '활성' : '미설정'}
                            </span>
                        </div>
                    </div>

                    <!-- 예산 현황 -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">예산 사용 현황</span>
                            <span class="text-sm ${usageColor} font-medium">${budget.usagePercentage}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="${progressColor} h-2 rounded-full transition-all duration-300" 
                                 style="width: ${budget.usagePercentage}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>사용: ${Utils.formatPrice(budget.usedBudget)}원</span>
                            <span>잔여: ${Utils.formatPrice(budget.remainingBudget)}원</span>
                        </div>
                    </div>

                    <!-- 상세 정보 -->
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">할당 예산:</span>
                            <span class="font-medium text-gray-900 ml-1">${Utils.formatPrice(budget.budget)}원</span>
                        </div>
                        <div>
                            <span class="text-gray-600">등록일:</span>
                            <span class="font-medium text-gray-900 ml-1">${Utils.formatDate(classData.createdAt)}</span>
                        </div>
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                        <button onclick="adminApp.editClass('${classId}')" 
                                class="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                            <i class="fas fa-edit mr-1"></i>편집
                        </button>
                        <button onclick="adminApp.viewClassApplications('${classId}')" 
                                class="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
                            <i class="fas fa-list mr-1"></i>신청 목록
                        </button>
                        <button onclick="adminApp.deleteClass('${classId}')" 
                                class="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${classCards}
            </div>
        `;
    }

    /**
     * 학급 신청 목록 보기
     */
    async viewClassApplications(classId) {
        try {
            // 해당 학급의 신청 목록을 새 창에서 열기
            const classData = this.classSettings[classId];
            if (classData) {
                // 새 창에서 열 때 현재 인증된 학급 정보를 무시하고 클릭한 학급의 정보를 사용
                const url = `/applications.html?grade=${classData.grade}&class=${classData.class}&force=true`;
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('학급 신청 목록 보기 오류:', error);
            Toast.show('신청 목록을 열 수 없습니다.', 'error');
        }
    }

    /**
     * 기보유 도서 로드
     */
    async loadOwnedBooks() {
        try {
            const response = await fetch('/api/books/library-holdings');
            
            if (response.ok) {
                const ownedBooks = await response.json();
                this.renderOwnedBooksTable(ownedBooks);
                
                // 진행 상황도 확인
                await this.checkProcessingProgress();
            } else {
                console.error('기보유 도서 로드 실패:', response.statusText);
                this.showToast('기보유 도서 목록을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('기보유 도서 로드 오류:', error);
            this.showToast('기보유 도서 목록을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 처리 진행 상황 확인
     */
    async checkProcessingProgress() {
        try {
            const response = await fetch('/api/books/library-holdings/progress');
            const progress = await response.json();
            
            this.displayProgressInfo(progress);
        } catch (error) {
            console.error('진행 상황 확인 오류:', error);
        }
    }

    /**
     * 진행 상황 정보 표시
     */
    displayProgressInfo(progress) {
        const progressContainer = document.getElementById('processingProgress');
        if (!progressContainer) {
            // 진행 상황 표시 영역 생성
            const booksTab = document.getElementById('books-tab');
            if (booksTab) {
                const progressDiv = document.createElement('div');
                progressDiv.id = 'processingProgress';
                progressDiv.className = 'mb-6';
                booksTab.insertBefore(progressDiv, booksTab.firstChild);
            }
        }
        
        const container = document.getElementById('processingProgress');
        if (!container) return;
        
        if (progress.isProcessing) {
            container.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-lg font-medium text-blue-900">
                            <i class="fas fa-cog fa-spin mr-2"></i>도서 처리 진행 중
                        </h4>
                        <button onclick="adminApp.cancelProcessing()" class="text-red-600 hover:text-red-800 text-sm">
                            <i class="fas fa-times mr-1"></i>취소
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-blue-700">처리 완료:</span>
                            <span class="font-medium ml-1">${progress.processedCount}권</span>
                        </div>
                        <div>
                            <span class="text-blue-700">오늘 API 호출:</span>
                            <span class="font-medium ml-1">${progress.apiCallsToday}/${progress.dailyLimit}회</span>
                        </div>
                    </div>
                    ${progress.lastProcessedDate ? `
                        <div class="mt-2 text-sm text-blue-600">
                            마지막 처리: ${progress.lastProcessedDate}
                        </div>
                    ` : ''}
                    <div class="mt-3">
                        <button onclick="adminApp.resumeProcessing()" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                            작업 재개 안내
                        </button>
                    </div>
                </div>
            `;
        } else if (progress.apiCallsToday > 0) {
            container.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="text-lg font-medium text-green-900 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>오늘 작업 현황
                    </h4>
                    <div class="text-sm text-green-700">
                        오늘 API 호출: <span class="font-medium">${progress.apiCallsToday}/${progress.dailyLimit}회</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    }

    /**
     * 작업 재개 안내
     */
    async resumeProcessing() {
        try {
            const response = await fetch('/api/books/library-holdings/resume', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast(result.message, 'info');
            } else {
                this.showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('작업 재개 안내 오류:', error);
            this.showToast('작업 재개 안내 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 진행 중인 작업 취소
     */
    async cancelProcessing() {
        if (!confirm('진행 중인 작업을 취소하시겠습니까? 지금까지의 처리 결과는 유지되지만 진행 상황이 초기화됩니다.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/books/library-holdings/progress', {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast(result.message, 'success');
                await this.checkProcessingProgress();
            } else {
                this.showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('작업 취소 오류:', error);
            this.showToast('작업 취소 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 기보유 도서 테이블 렌더링
     */
    renderOwnedBooksTable(books) {
        const tableBody = document.getElementById('ownedBooksTable');
        if (!tableBody) return;

        if (!books || books.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-book text-4xl mb-2 block"></i>
                        등록된 기보유 도서가 없습니다.
                        <br>
                        <span class="text-sm">CSV 파일을 업로드하여 도서를 추가해보세요.</span>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = books.map(book => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(book.title || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(book.author || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(book.publisher || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <button onclick="adminApp.deleteOwnedBook('${this.escapeHtml(book.title)}', '${this.escapeHtml(book.author || '')}')" 
                            class="text-red-600 hover:text-red-900 text-sm">
                        <i class="fas fa-trash mr-1"></i>삭제
                    </button>
                </td>
            </tr>
        `).join('');

        // 도서 수 표시
        const countElement = document.querySelector('#books-tab .px-6.py-4 h3');
        if (countElement) {
            countElement.innerHTML = `기보유 도서 관리 <span class="text-sm text-gray-500">(총 ${books.length}권)</span>`;
        }
    }

    /**
     * 기보유 도서 삭제 (제목+저자 기반)
     */
    async deleteOwnedBook(title, author = '') {
        if (!confirm(`"${title}" 도서를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            // 제목+저자를 정규화하여 식별자 생성
            const normalizeText = (text) => {
                if (!text) return '';
                return text.replace(/[^\w가-힣]/g, '').toLowerCase().trim();
            };
            
            const identifier = `${normalizeText(title)}_${normalizeText(author)}`;
            
            const response = await fetch(`/api/books/owned/${encodeURIComponent(identifier)}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('도서가 삭제되었습니다.', 'success');
                await this.loadOwnedBooks(); // 목록 새로고침
            } else {
                this.showToast(result.error || '도서 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('도서 삭제 오류:', error);
            this.showToast('도서 삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * HTML 이스케이프 처리
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 시스템 설정 로드
     */
    async loadSystemSettings() {
        // 기존 코드 유지...
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 이메일 연결 테스트
        document.getElementById('testEmailBtn')?.addEventListener('click', this.testEmailConnection.bind(this));
        
        // 개발 모드 토글
        document.getElementById('toggleDevModeBtn')?.addEventListener('click', this.toggleDevMode.bind(this));
        
        // 이메일 설정 폼
        document.getElementById('emailConfigForm')?.addEventListener('submit', this.saveEmailConfig.bind(this));
    }

    /**
     * 이메일 연결 테스트
     */
    async testEmailConnection() {
        const btn = document.getElementById('testEmailBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>테스트 중...';
            btn.disabled = true;
            
            const response = await fetch('/api/admin/test-email', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('이메일 서버 연결 성공!', 'success');
            } else {
                this.showToast(result.error || '이메일 서버 연결 실패', 'error');
            }
            
        } catch (error) {
            console.error('이메일 연결 테스트 실패:', error);
            this.showToast('이메일 연결 테스트 중 오류가 발생했습니다.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    /**
     * 개발 모드 토글
     */
    async toggleDevMode() {
        const btn = document.getElementById('toggleDevModeBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>변경 중...';
            btn.disabled = true;
            
            const response = await fetch('/api/admin/toggle-dev-mode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast(result.message, 'success');
                await this.loadEmailConfig(); // 설정 다시 로드
            } else {
                this.showToast(result.error || '개발 모드 변경 실패', 'error');
            }
            
        } catch (error) {
            console.error('개발 모드 토글 실패:', error);
            this.showToast('개발 모드 변경 중 오류가 발생했습니다.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    /**
     * 이메일 설정 저장
     */
    async saveEmailConfig(event) {
        event.preventDefault();
        
        const service = document.getElementById('emailService').value;
        const user = document.getElementById('emailUser').value;
        const pass = document.getElementById('emailPass').value;
        const devMode = document.getElementById('emailDevMode').checked;
        
        if (!user || !pass) {
            this.showToast('이메일 주소와 비밀번호를 입력해주세요.', 'error');
            return;
        }
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...';
            submitBtn.disabled = true;
            
            const response = await fetch('/api/admin/email-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service,
                    user,
                    pass,
                    devMode
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast('이메일 설정이 저장되었습니다.', 'success');
                await this.loadEmailConfig(); // 설정 다시 로드
                
                // 폼 초기화
                document.getElementById('emailUser').value = '';
                document.getElementById('emailPass').value = '';
                document.getElementById('emailDevMode').checked = false;
            } else {
                this.showToast(result.error || '이메일 설정 저장 실패', 'error');
            }
            
        } catch (error) {
            console.error('이메일 설정 저장 실패:', error);
            this.showToast('이메일 설정 저장 중 오류가 발생했습니다.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3초 후 제거
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * 이메일 설정 로드
     */
    async loadEmailConfig() {
        try {
            const response = await fetch('/api/admin/email-config');
            if (response.ok) {
                const config = await response.json();
                
                // 현재 설정 표시
                document.getElementById('currentDevMode').textContent = config.devMode ? 'ON' : 'OFF';
                document.getElementById('currentFromEmail').textContent = config.fromEmail || '설정되지 않음';
                document.getElementById('currentFromName').textContent = config.fromName || '설정되지 않음';
                
                // 개발 모드 버튼 텍스트 업데이트
                const toggleBtn = document.getElementById('toggleDevModeBtn');
                if (toggleBtn) {
                    toggleBtn.innerHTML = `<i class="fas fa-toggle-${config.devMode ? 'off' : 'on'} mr-2"></i>${config.devMode ? '개발 모드 끄기' : '개발 모드 켜기'}`;
                }
            }
        } catch (error) {
            console.error('이메일 설정 로드 실패:', error);
        }
    }

    // 반 옵션 동적 생성 함수 추가
    updateClassFilterOptions() {
        const classFilter = document.getElementById('classFilter');
        console.log('[updateClassFilterOptions] classSettings:', this.classSettings);
        console.log('[updateClassFilterOptions] selectedGrade:', this.selectedGrade);
        classFilter.innerHTML = '<option value="">전체</option>';
        if (!this.selectedGrade || !this.classSettings) {
            console.log('[updateClassFilterOptions] 조건 미충족, 옵션 추가 안함');
            return;
        }
        const classSet = new Set(Object.values(this.classSettings)
            .filter(cls => String(cls.grade) === this.selectedGrade)
            .map(cls => String(cls.class)));
        Array.from(classSet).sort().forEach(cls => {
            classFilter.innerHTML += `<option value="${cls}">${cls}반</option>`;
        });
        console.log('[updateClassFilterOptions] 반 옵션 개수:', classFilter.options.length);
    }

    // 학년 드롭다운 옵션 동적 생성 함수
    updateGradeFilterOptions() {
        const gradeFilter = document.getElementById('gradeFilter');
        if (!gradeFilter || !this.classSettings) return;
        const gradeSet = new Set(Object.values(this.classSettings).map(cls => String(cls.grade)));
        gradeFilter.innerHTML = '<option value="">전체</option>';
        Array.from(gradeSet).sort().forEach(grade => {
            gradeFilter.innerHTML += `<option value="${grade}">${grade}학년</option>`;
        });
    }

    // 반 드롭다운 옵션 동적 생성 함수 (전체 학급 정보 기준)
    updateClassFilterOptions() {
        const classFilter = document.getElementById('classFilter');
        classFilter.innerHTML = '<option value="">전체</option>';
        if (!this.selectedGrade || !this.classSettings) return;
        // 전체 학급 정보에서 해당 학년의 반 목록 추출
        const classSet = new Set(Object.values(this.classSettings)
            .filter(cls => String(cls.grade) === this.selectedGrade)
            .map(cls => String(cls.class)));
        Array.from(classSet).sort().forEach(cls => {
            classFilter.innerHTML += `<option value="${cls}">${cls}반</option>`;
        });
    }

    // initializeApp 또는 loadOverviewData 이후에 드롭다운 옵션 동적 생성 호출
    // 예시: this.updateGradeFilterOptions(); this.updateClassFilterOptions();

    setupFilterEventListeners() {
        const gradeFilter = document.getElementById('gradeFilter');
        const classFilter = document.getElementById('classFilter');
        if (gradeFilter && classFilter) {
            gradeFilter.addEventListener('change', (e) => {
                this.selectedGrade = e.target.value;
                console.log('[gradeFilter change] selectedGrade:', this.selectedGrade);
                this.updateClassFilterOptions();
                this.selectedClass = '';
                classFilter.value = '';
                this.renderAllApplicationsTable(this.allApplications);
            });
            classFilter.addEventListener('change', (e) => {
                this.selectedClass = e.target.value;
                this.renderAllApplicationsTable(this.allApplications);
            });
        } else {
            console.log('gradeFilter/classFilter 요소를 찾을 수 없음');
        }
    }

    /**
     * 전체 신청 도서 목록(필터 적용) CSV 다운로드
     */
    handleAllBooksDownload() {
        if (!this.allBooksData || this.allBooksData.length === 0) {
            this.showToast('다운로드할 데이터가 없습니다.', 'warning');
            return;
        }
        // CSV 헤더
        const header = ['도서명','저자','출판사','신청수량','정가','최종가','학년','반'];
        // CSV 데이터
        const rows = this.allBooksData.map(book => [
            book.title,
            book.author,
            book.publisher,
            book.count,
            book.price,
            book.price * book.count,
            book.grade,
            book.class
        ]);
        // CSV 문자열 생성 (BOM 추가)
        const csvBody = [header, ...rows].map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',')).join('\n');
        const csvContent = '\uFEFF' + csvBody;
        // 파일명 동적 생성
        let filterName = '전체';
        if (this.selectedGrade && this.selectedClass) {
            filterName = `${this.selectedGrade}학년_${this.selectedClass}반`;
        } else if (this.selectedGrade) {
            filterName = `${this.selectedGrade}학년`;
        }
        const fileName = `전체신청도서목록_${filterName}_${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        this.showToast('CSV 파일이 다운로드되었습니다.', 'success');
    }

    async initialize() {
        // ... 기존 코드 ...
        this.loadAllApplications();
        // ... 기존 코드 ...
    }
}

// 관리자 앱 인스턴스 생성 (전역)
let adminApp;

// DOM이 로드되면 관리자 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
    window.adminApp = adminApp; // 전역 접근 가능하도록 설정
}); 