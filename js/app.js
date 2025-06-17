/**
 * app.js
 * 메인 애플리케이션 진입점 및 전체 제어 로직 (알라딘 API 기반)
 */

const App = (() => {
    // 애플리케이션 상태
    let currentCategory = 'popular';
    let currentPage = 1;
    let currentSearchQuery = '';
    let isSearchMode = false;
    let lastSearchResult = null;

    // DOM 요소들
    let elements = {};

    /**
     * DOM 요소들 초기화
     */
    const initializeElements = () => {
        elements = {
            // 학급 선택 관련
            gradeSelect: document.getElementById('gradeSelect'),
            classSelect: document.getElementById('classSelect'),
            teacherInput: document.getElementById('teacherInput'),
            setClassBtn: document.getElementById('setClassBtn'),
            selectedClassInfo: document.getElementById('selectedClassInfo'),
            selectedClassText: document.getElementById('selectedClassText'),
            budgetInfo: document.getElementById('budgetInfo'),

            // 검색 관련
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),

            // 카테고리 관련
            categoryBtns: document.querySelectorAll('.category-btn'),

            // 도서 목록 관련
            booksContainer: document.getElementById('booksContainer'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            emptyState: document.getElementById('emptyState'),
            paginationContainer: document.getElementById('paginationContainer'),

            // 모달 관련
            bookModal: document.getElementById('bookModal'),
            closeModal: document.getElementById('closeModal'),
            modalContent: document.getElementById('modalContent')
        };
    };

    /**
     * 이벤트 리스너 등록
     */
    const registerEventListeners = () => {
        // 학급 선택 이벤트
        if (elements.gradeSelect) {
            elements.gradeSelect.addEventListener('change', handleGradeChange);
        }

        if (elements.setClassBtn) {
            elements.setClassBtn.addEventListener('click', handleClassConfirm);
        }

        // 검색 이벤트
        if (elements.searchInput) {
            elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });

            // 디바운스된 실시간 검색
            elements.searchInput.addEventListener('input', 
                UIComponents.debounce(() => {
                    const query = elements.searchInput.value.trim();
                    if (query.length >= 2) {
                        handleSearch();
                    } else if (query.length === 0) {
                        // 검색어가 없으면 현재 카테고리로 돌아가기
                        isSearchMode = false;
                        loadBooksByCategory(currentCategory);
                    }
                }, Config.getSystemConfig().SEARCH.DEBOUNCE_DELAY)
            );
        }

        if (elements.searchBtn) {
            elements.searchBtn.addEventListener('click', handleSearch);
        }

        // 카테고리 버튼 이벤트
        elements.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = btn.dataset.category;
                handleCategoryChange(categoryId);
            });
        });

        // 모달 닫기 이벤트
        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', UIComponents.hideModal);
        }

        if (elements.bookModal) {
            elements.bookModal.addEventListener('click', (e) => {
                if (e.target === elements.bookModal) {
                    UIComponents.hideModal();
                }
            });
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UIComponents.hideModal();
            }
        });

        // 페이지 새로고침 시 데이터 손실 방지
        window.addEventListener('beforeunload', (e) => {
            if (UIComponents.isLoading()) {
                e.preventDefault();
                e.returnValue = '처리 중인 작업이 있습니다. 페이지를 떠나시겠습니까?';
            }
        });
    };

    /**
     * 학년 변경 처리
     */
    const handleGradeChange = () => {
        const selectedGrade = elements.gradeSelect.value;
        
        // 반 선택 초기화 및 활성화
        elements.classSelect.innerHTML = '<option value="">반 선택</option>';
        elements.classSelect.disabled = !selectedGrade;

        if (selectedGrade) {
            // 선택된 학년에 따라 반 옵션 생성
            const classCount = Config.getSystemConfig().CLASSES_PER_GRADE;
            for (let i = 1; i <= classCount; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i}반`;
                elements.classSelect.appendChild(option);
            }
        }
    };

    /**
     * 학급 확인 처리
     */
    const handleClassConfirm = async () => {
        try {
            const grade = elements.gradeSelect.value;
            const classNumber = elements.classSelect.value;
            const teacher = elements.teacherInput.value.trim();

            // 입력 검증
            if (!grade) {
                UIComponents.showToast('학년을 선택해주세요.', 'error');
                return;
            }

            if (!classNumber) {
                UIComponents.showToast('반을 선택해주세요.', 'error');
                return;
            }

            if (!teacher) {
                UIComponents.showToast('담임교사 이름을 입력해주세요.', 'error');
                return;
            }

            // 학급 정보 설정
            const classInfo = {
                grade: parseInt(grade),
                classNumber: parseInt(classNumber),
                teacher: teacher,
                budget: Config.getBudgetConfig().DEFAULT_PER_CLASS
            };

            BookService.setCurrentClass(classInfo);
            updateClassDisplay();
            UIComponents.showToast('학급 정보가 설정되었습니다.', 'success');

        } catch (error) {
            console.error('학급 설정 오류:', error);
            UIComponents.showToast(error.message || '학급 설정 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * 학급 정보 표시 업데이트
     */
    const updateClassDisplay = async () => {
        const classInfo = BookService.getCurrentClass();
        
        if (!elements.selectedClassInfo || !elements.selectedClassText || !elements.budgetInfo) {
            return;
        }

        if (classInfo) {
            elements.selectedClassInfo.classList.remove('hidden');
            elements.selectedClassText.textContent = `${classInfo.grade}학년 ${classInfo.classNumber}반 (${classInfo.teacher})`;
            
            try {
                // 예산 정보 업데이트
                const budgetCheck = await BookService.checkBudget(0);
                elements.budgetInfo.textContent = `${Config.formatPrice(budgetCheck.remainingBudget)} / ${Config.formatPrice(budgetCheck.totalBudget)}`;
                
                // 예산 상태에 따른 색상 변경
                const usageRate = (budgetCheck.currentTotal / budgetCheck.totalBudget) * 100;
                if (usageRate >= 90) {
                    elements.budgetInfo.className = 'font-medium text-red-600';
                } else if (usageRate >= 70) {
                    elements.budgetInfo.className = 'font-medium text-yellow-600';
                } else {
                    elements.budgetInfo.className = 'font-medium text-blue-600';
                }
            } catch (error) {
                console.error('예산 정보 업데이트 오류:', error);
                elements.budgetInfo.textContent = Config.formatPrice(classInfo.budget || 500000);
            }
        } else {
            elements.selectedClassInfo.classList.add('hidden');
        }
    };

    /**
     * 검색 처리
     */
    const handleSearch = async () => {
        try {
            const query = elements.searchInput.value.trim();
            
            if (query.length < 2) {
                UIComponents.showToast('검색어는 2글자 이상 입력해주세요.', 'error');
                return;
            }

            // 검색 모드로 전환
            isSearchMode = true;
            currentSearchQuery = query;
            currentPage = 1;

            UIComponents.showLoading(true, '도서를 검색하고 있습니다...');

            // 알라딘 API로 검색
            const result = await BookService.searchBooks(query, { page: 1 });
            lastSearchResult = result;

            // 검색 결과 표시
            UIComponents.renderBookGrid(result.books);
            
            // 페이지네이션 표시
            if (result.meta) {
                UIComponents.renderPagination(result.meta, handlePageChange);
            }

            // 카테고리 버튼 비활성화
            UIComponents.setActiveCategory('');

        } catch (error) {
            console.error('검색 오류:', error);
            UIComponents.showToast(error.message || '검색 중 오류가 발생했습니다.', 'error');
            
            // 빈 상태 표시
            UIComponents.renderBookGrid([]);
        } finally {
            UIComponents.showLoading(false);
        }
    };

    /**
     * 카테고리 변경 처리
     */
    const handleCategoryChange = async (categoryId) => {
        try {
            if (currentCategory === categoryId && !isSearchMode) {
                return; // 이미 선택된 카테고리
            }

            // 검색 모드 해제
            isSearchMode = false;
            currentSearchQuery = '';
            currentCategory = categoryId;
            currentPage = 1;

            // 검색창 초기화
            if (elements.searchInput) {
                elements.searchInput.value = '';
            }

            UIComponents.showLoading(true, '도서를 불러오고 있습니다...');

            // 카테고리별 도서 로드
            let result;
            if (categoryId === 'popular') {
                // 인기 도서 조회
                result = await AladinAPI.getPopularBooks(1);
            } else {
                // 카테고리별 도서 조회
                const category = Config.getCategoryById(categoryId);
                if (!category) {
                    throw new Error('유효하지 않은 카테고리입니다.');
                }
                result = await AladinAPI.searchByCategory(categoryId, 1);
            }

            lastSearchResult = result;

            // 도서 목록 표시
            UIComponents.renderBookGrid(result.books);
            
            // 페이지네이션 표시
            if (result.meta) {
                UIComponents.renderPagination(result.meta, handlePageChange);
            }

            // 활성 카테고리 표시
            UIComponents.setActiveCategory(categoryId);

        } catch (error) {
            console.error('카테고리 변경 오류:', error);
            UIComponents.showToast(error.message || '도서를 불러오는 중 오류가 발생했습니다.', 'error');
            UIComponents.renderBookGrid([]);
        } finally {
            UIComponents.showLoading(false);
        }
    };

    /**
     * 카테고리별 도서 로드
     */
    const loadBooksByCategory = async (categoryId) => {
        try {
            UIComponents.showLoading(true, '도서를 불러오고 있습니다...');

            let result;
            if (categoryId === 'popular') {
                // 인기 도서 조회
                result = await BookService.getPopularBooks(1);
            } else {
                // 카테고리별 도서 조회
                result = await BookService.getBooksByCategory(categoryId, 1);
            }

            lastSearchResult = result;

            // 도서 목록 표시
            UIComponents.renderBookGrid(result.books);
            
            // 페이지네이션 표시
            if (result.meta) {
                UIComponents.renderPagination(result.meta, handlePageChange);
            }

        } catch (error) {
            console.error('카테고리 도서 로드 오류:', error);
            UIComponents.showToast(error.message || '도서를 불러오는 중 오류가 발생했습니다.', 'error');
            
            // 빈 상태 표시
            UIComponents.renderBookGrid([]);
        } finally {
            UIComponents.showLoading(false);
        }
    };

    /**
     * 페이지 변경 처리
     */
    const handlePageChange = async (page) => {
        try {
            currentPage = page;
            UIComponents.showLoading(true);

            let result;
            if (isSearchMode) {
                // 검색 결과 페이지 변경
                result = await BookService.searchBooks(currentSearchQuery, { page });
            } else {
                // 카테고리 페이지 변경
                if (currentCategory === 'popular') {
                    result = await BookService.getPopularBooks(page);
                } else {
                    result = await BookService.getBooksByCategory(currentCategory, page);
                }
            }

            lastSearchResult = result;

            // 도서 목록 업데이트
            UIComponents.renderBookGrid(result.books);
            
            // 페이지네이션 업데이트
            if (result.meta) {
                UIComponents.renderPagination(result.meta, handlePageChange);
            }

            // 페이지 상단으로 스크롤
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('페이지 변경 오류:', error);
            UIComponents.showToast('페이지를 불러오는 중 오류가 발생했습니다.', 'error');
        } finally {
            UIComponents.showLoading(false);
        }
    };

    /**
     * 시스템 상태 확인
     */
    const checkSystemStatus = async () => {
        try {
            // API 클라이언트 연결 테스트
            const isServerConnected = await ApiClient.testConnection();
            
            // 알라딘 API 상태 확인
            const aladinStatus = await AladinAPI.checkApiStatus();
            
            console.log('🔍 시스템 상태:', {
                server: isServerConnected ? '연결됨' : '연결 실패',
                aladin: aladinStatus ? '정상' : '오류'
            });
            
            return {
                server: isServerConnected,
                aladin: aladinStatus
            };
        } catch (error) {
            console.error('시스템 상태 확인 오류:', error);
            return {
                server: false,
                aladin: false
            };
        }
    };

    /**
     * 초기 데이터 로드
     */
    const loadInitialData = async () => {
        try {
            // 시스템 상태 확인
            const isSystemReady = await checkSystemStatus();
            if (!isSystemReady) {
                // API 키가 없어도 기본 UI는 표시
                UIComponents.renderBookGrid([]);
                return;
            }

            // 인기 도서 로드
            await loadBooksByCategory('popular');
            UIComponents.setActiveCategory('popular');

        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
            UIComponents.showToast('초기 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
            UIComponents.renderBookGrid([]);
        }
    };

    /**
     * 애플리케이션 초기화
     */
    const initialize = async () => {
        try {
            console.log('📚 교내 희망도서 신청시스템 시작...');

            // DOM 요소 초기화
            initializeElements();

            // 이벤트 리스너 등록
            registerEventListeners();

            // 저장된 학급 정보 복원
            const savedClass = BookService.getCurrentClass();
            if (savedClass) {
                elements.gradeSelect.value = savedClass.grade;
                handleGradeChange();
                elements.classSelect.value = savedClass.classNumber;
                elements.teacherInput.value = savedClass.teacher;
                updateClassDisplay();
            }

            // 초기 데이터 로드
            await loadInitialData();

            console.log('✅ 시스템 초기화 완료');

        } catch (error) {
            console.error('❌ 시스템 초기화 실패:', error);
            UIComponents.showToast('시스템 초기화 중 오류가 발생했습니다.', 'error');
        }
    };

    // 공개 API
    return {
        initialize,
        
        // 상태 조회
        getCurrentCategory: () => currentCategory,
        getCurrentPage: () => currentPage,
        isSearchMode: () => isSearchMode,
        getLastSearchResult: () => lastSearchResult,
        
        // 수동 제어
        loadCategory: loadBooksByCategory,
        search: handleSearch,
        refreshData: loadInitialData,
        updateClassInfo: updateClassDisplay
    };
})();

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.initialize();
});

// 전역에서 사용할 수 있도록 window 객체에 추가
window.App = App;