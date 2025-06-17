/**
 * app.js
 * 메인 애플리케이션 진입점 및 전체 제어 로직
 */

const App = (() => {
    // 애플리케이션 상태
    let currentCategory = 'popular';
    let currentPage = 1;
    let currentSearchQuery = '';
    let isSearchMode = false;

    // DOM 요소들
    let elements = {};

    /**
     * DOM 요소들 초기화
     */
    const initializeElements = () => {
        elements = {
            // 학급 선택 관련
            gradeSelect: document.getElementById('grade-select'),
            classSelect: document.getElementById('class-select'),
            teacherName: document.getElementById('teacher-name'),
            classConfirmBtn: document.getElementById('class-confirm-btn'),
            selectedClassInfo: document.getElementById('selected-class-info'),

            // 검색 관련
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),

            // 카테고리 관련
            categoryBtns: document.querySelectorAll('.category-btn'),
            currentCategoryTitle: document.getElementById('current-category-title'),

            // 도서 목록 관련
            booksGrid: document.getElementById('books-grid'),
            loadMoreBtn: document.getElementById('load-more-btn'),
            totalBooksCount: document.getElementById('total-books-count'),

            // 모달 관련
            bookDetailModal: document.getElementById('book-detail-modal'),
            closeModalBtn: document.getElementById('close-modal-btn'),

            // 모바일 메뉴
            mobileMenuBtn: document.getElementById('mobile-menu-btn'),
            mobileMenu: document.getElementById('mobile-menu')
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

        if (elements.classConfirmBtn) {
            elements.classConfirmBtn.addEventListener('click', handleClassConfirm);
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
                        // 검색어가 없으면 인기도서로 돌아가기
                        isSearchMode = false;
                        loadBooksByCategory('popular');
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

        // 더보기 버튼 이벤트
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.addEventListener('click', handleLoadMore);
        }

        // 모달 닫기 이벤트
        if (elements.closeModalBtn) {
            elements.closeModalBtn.addEventListener('click', UIComponents.closeModal);
        }

        if (elements.bookDetailModal) {
            elements.bookDetailModal.addEventListener('click', (e) => {
                if (e.target === elements.bookDetailModal) {
                    UIComponents.closeModal();
                }
            });
        }

        // 모바일 메뉴 토글
        if (elements.mobileMenuBtn && elements.mobileMenu) {
            elements.mobileMenuBtn.addEventListener('click', () => {
                elements.mobileMenu.classList.toggle('hidden');
            });
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UIComponents.closeModal();
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
        
        // 반 선택 초기화
        elements.classSelect.innerHTML = '<option value="">반 선택</option>';

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
            const teacher = elements.teacherName.value.trim();

            // 입력 검증
            if (!grade) {
                UIComponents.showError('학년을 선택해주세요.');
                return;
            }

            if (!classNumber) {
                UIComponents.showError('반을 선택해주세요.');
                return;
            }

            if (!teacher) {
                UIComponents.showError('담임교사 이름을 입력해주세요.');
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
            UIComponents.updateClassDisplay();
            UIComponents.showSuccess(Config.getSuccessMessages().CLASS_SELECTED);

        } catch (error) {
            UIComponents.showError(error.message);
        }
    };

    /**
     * 검색 처리
     */
    const handleSearch = async () => {
        try {
            const query = elements.searchInput.value.trim();
            
            if (query.length < 2) {
                UIComponents.showError('검색어는 2글자 이상 입력해주세요.');
                return;
            }

            UIComponents.showLoading(true, '도서 검색 중...');

            currentSearchQuery = query;
            currentPage = 1;
            isSearchMode = true;

            const result = await BookService.searchBooks(query);
            
            UIComponents.showLoading(false);
            UIComponents.renderBookGrid(result.books);
            UIComponents.updateBookCount(result.meta.totalCount);
            UIComponents.renderPagination(result.meta, loadMoreSearchResults);

            // 카테고리 비활성화
            elements.categoryBtns.forEach(btn => btn.classList.remove('active'));
            
            // 제목 업데이트
            elements.currentCategoryTitle.textContent = `"${query}" 검색 결과`;

        } catch (error) {
            UIComponents.showLoading(false);
            UIComponents.showError(error.message);
        }
    };

    /**
     * 카테고리 변경 처리
     * @param {string} categoryId - 카테고리 ID
     */
    const handleCategoryChange = (categoryId) => {
        if (categoryId === currentCategory && !isSearchMode) return;

        currentCategory = categoryId;
        currentPage = 1;
        isSearchMode = false;
        
        // 검색어 초기화
        if (elements.searchInput) {
            elements.searchInput.value = '';
        }

        UIComponents.setActiveCategory(categoryId);
        loadBooksByCategory(categoryId);
    };

    /**
     * 카테고리별 도서 로드
     * @param {string} categoryId - 카테고리 ID
     */
    const loadBooksByCategory = async (categoryId) => {
        try {
            UIComponents.showLoading(true, '도서 목록을 불러오는 중...');

            let result;
            if (categoryId === 'popular') {
                result = await BookService.getPopularBooks(currentPage);
            } else {
                result = await BookService.getBooksByCategory(categoryId, currentPage);
            }

            UIComponents.showLoading(false);
            UIComponents.renderBookGrid(result.books);
            UIComponents.updateBookCount(result.meta.totalCount);
            UIComponents.renderPagination(result.meta, (page) => loadMoreBooks(categoryId, page));

        } catch (error) {
            UIComponents.showLoading(false);
            UIComponents.showError(error.message);
        }
    };

    /**
     * 더보기 처리
     */
    const handleLoadMore = () => {
        if (isSearchMode) {
            loadMoreSearchResults(currentPage + 1);
        } else {
            loadMoreBooks(currentCategory, currentPage + 1);
        }
    };

    /**
     * 검색 결과 더보기
     * @param {number} page - 페이지 번호
     */
    const loadMoreSearchResults = async (page) => {
        try {
            UIComponents.showLoading(true, '더 많은 검색 결과를 불러오는 중...');

            const result = await BookService.searchBooks(currentSearchQuery, { page });
            
            // 기존 도서에 새 도서 추가
            const existingBooks = Array.from(elements.booksGrid.children)
                .filter(child => !child.classList.contains('col-span-full'));
            
            result.books.forEach(book => {
                const card = UIComponents.createBookCard(book);
                elements.booksGrid.appendChild(card);
            });

            currentPage = page;
            UIComponents.showLoading(false);
            UIComponents.renderPagination(result.meta, loadMoreSearchResults);

        } catch (error) {
            UIComponents.showLoading(false);
            UIComponents.showError(error.message);
        }
    };

    /**
     * 카테고리 도서 더보기
     * @param {string} categoryId - 카테고리 ID
     * @param {number} page - 페이지 번호
     */
    const loadMoreBooks = async (categoryId, page) => {
        try {
            UIComponents.showLoading(true, '더 많은 도서를 불러오는 중...');

            let result;
            if (categoryId === 'popular') {
                result = await BookService.getPopularBooks(page);
            } else {
                result = await BookService.getBooksByCategory(categoryId, page);
            }

            // 기존 도서에 새 도서 추가
            result.books.forEach(book => {
                const card = UIComponents.createBookCard(book);
                elements.booksGrid.appendChild(card);
            });

            currentPage = page;
            UIComponents.showLoading(false);
            UIComponents.renderPagination(result.meta, (nextPage) => loadMoreBooks(categoryId, nextPage));

        } catch (error) {
            UIComponents.showLoading(false);
            UIComponents.showError(error.message);
        }
    };

    /**
     * 시스템 상태 확인
     */
    const checkSystemStatus = async () => {
        try {
            // 백엔드 API 연결 확인
            const backendStatus = await ApiClient.testConnection();
            
            // 카카오 API 연결 확인
            const kakaoStatus = await KakaoAPI.checkApiStatus();

            if (!backendStatus) {
                UIComponents.showError('백엔드 서버와 연결할 수 없습니다. 관리자에게 문의하세요.');
                return false;
            }

            if (!kakaoStatus) {
                UIComponents.showError('카카오 도서 검색 서비스를 사용할 수 없습니다. 관리자 페이지에서 API 키를 확인해주세요.');
                // 카카오 API가 없어도 기본 기능은 사용 가능하므로 계속 진행
            }

            return true;
        } catch (error) {
            console.error('시스템 상태 확인 오류:', error);
            return false;
        }
    };

    /**
     * 애플리케이션 초기화
     */
    const initialize = async () => {
        try {
            console.log('🚀 교내 희망도서 신청시스템 초기화 시작...');

            // DOM 요소 초기화
            initializeElements();

            // 이벤트 리스너 등록
            registerEventListeners();

            // 시스템 상태 확인
            const systemOk = await checkSystemStatus();
            if (!systemOk) {
                return;
            }

            // 저장된 학급 정보 복원
            const savedClass = BookService.getCurrentClass();
            if (savedClass) {
                // 폼에 값 설정
                if (elements.gradeSelect) {
                    elements.gradeSelect.value = savedClass.grade;
                    handleGradeChange();
                }
                if (elements.classSelect) {
                    elements.classSelect.value = savedClass.classNumber;
                }
                if (elements.teacherName) {
                    elements.teacherName.value = savedClass.teacher;
                }
                
                // UI 업데이트
                UIComponents.updateClassDisplay();
            }

            // 초기 도서 목록 로드 (인기도서)
            await loadBooksByCategory('popular');

            console.log('✅ 시스템 초기화 완료!');

        } catch (error) {
            console.error('❌ 시스템 초기화 오류:', error);
            UIComponents.showError('시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
    };

    // 공개 메서드
    return {
        /**
         * 애플리케이션 시작
         */
        start: initialize,

        /**
         * 현재 상태 정보
         */
        getState: () => ({
            currentCategory,
            currentPage,
            currentSearchQuery,
            isSearchMode,
            selectedClass: BookService.getCurrentClass()
        }),

        /**
         * 카테고리 강제 변경
         * @param {string} categoryId - 카테고리 ID
         */
        changeCategory: (categoryId) => {
            handleCategoryChange(categoryId);
        },

        /**
         * 검색 실행
         * @param {string} query - 검색어
         */
        search: (query) => {
            if (elements.searchInput) {
                elements.searchInput.value = query;
            }
            currentSearchQuery = query;
            handleSearch();
        },

        /**
         * 캐시 초기화 및 새로고침
         */
        refresh: () => {
            BookService.clearCache();
            if (isSearchMode) {
                handleSearch();
            } else {
                loadBooksByCategory(currentCategory);
            }
        }
    };
})();

// DOM 로드 완료 시 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    App.start();
});

// 전역에서 사용할 수 있도록 window 객체에 추가
window.App = App;