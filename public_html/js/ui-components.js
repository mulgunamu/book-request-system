/**
 * ui-components.js
 * UI 컴포넌트와 관련 기능을 관리하는 모듈
 */

const UIComponents = (() => {
    // UI 상태 관리
    let isLoading = false;
    let currentModal = null;

    /**
     * 요소 생성 헬퍼 함수
     * @param {string} tag - HTML 태그
     * @param {object} attributes - 속성 객체
     * @param {string|Element} content - 내용
     * @returns {Element} - 생성된 요소
     */
    const createElement = (tag, attributes = {}, content = '') => {
        const element = document.createElement(tag);
        
        // 속성 설정
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        // 내용 설정
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof Element) {
            element.appendChild(content);
        }
        
        return element;
    };

    return {
        // ===== 로딩 관리 =====
        
        /**
         * 로딩 표시
         * @param {boolean} show - 표시 여부
         * @param {string} message - 로딩 메시지
         */
        showLoading: (show = true, message = '처리 중...') => {
            const loadingElement = document.getElementById('loading');
            if (!loadingElement) return;

            if (show) {
                loadingElement.classList.add('active');
                const messageElement = loadingElement.querySelector('p');
                if (messageElement) {
                    messageElement.textContent = message;
                }
                isLoading = true;
            } else {
                loadingElement.classList.remove('active');
                isLoading = false;
            }
        },

        /**
         * 로딩 상태 확인
         * @returns {boolean} - 로딩 중 여부
         */
        isLoading: () => isLoading,

        // ===== 메시지 표시 =====
        
        /**
         * 성공 메시지 표시
         * @param {string} message - 메시지 내용
         * @param {number} duration - 표시 시간 (ms)
         */
        showSuccess: (message, duration = 3000) => {
            const successElement = document.getElementById('success-message');
            const textElement = document.getElementById('success-text');
            
            if (successElement && textElement) {
                textElement.textContent = message;
                successElement.classList.remove('hidden');
                
                if (duration > 0) {
                    setTimeout(() => {
                        successElement.classList.add('hidden');
                    }, duration);
                }
            }
        },

        /**
         * 에러 메시지 표시
         * @param {string} message - 메시지 내용
         * @param {number} duration - 표시 시간 (ms)
         */
        showError: (message, duration = 5000) => {
            const errorElement = document.getElementById('error-message');
            const textElement = document.getElementById('error-text');
            
            if (errorElement && textElement) {
                textElement.textContent = message;
                errorElement.classList.remove('hidden');
                
                if (duration > 0) {
                    setTimeout(() => {
                        errorElement.classList.add('hidden');
                    }, duration);
                }
            }
        },

        /**
         * 모든 메시지 숨기기
         */
        hideAllMessages: () => {
            ['success-message', 'error-message'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.add('hidden');
                }
            });
        },

        // ===== 도서 카드 생성 =====
        
        /**
         * 도서 카드 생성
         * @param {object} book - 도서 정보
         * @returns {Element} - 도서 카드 요소
         */
        createBookCard: (book) => {
            const card = createElement('div', {
                className: 'book-cover bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer border border-gray-200',
                'data-book-id': book.id
            });

            // 가격 정보
            const priceInfo = book.salePrice && book.salePrice !== book.price ? 
                `<div class="text-red-500 font-bold">${Config.formatPrice(book.salePrice)}</div>
                 <div class="text-gray-400 line-through text-sm">${Config.formatPrice(book.price)}</div>` :
                `<div class="text-gray-700 font-bold">${Config.formatPrice(book.price || 0)}</div>`;

            // 할인율 계산
            const discountBadge = book.discountRate > 0 ? 
                `<div class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    ${book.discountRate}% 할인
                </div>` : '';

            card.innerHTML = `
                <div class="relative">
                    ${discountBadge}
                    <div class="aspect-w-3 aspect-h-4 mb-3">
                        <img src="${book.thumbnail || '/images/no-image.png'}" 
                             alt="${book.title}" 
                             class="w-full h-48 object-cover rounded-t-lg"
                             onerror="this.src='/images/no-image.png'">
                    </div>
                    <div class="p-3">
                        <h3 class="font-semibold text-sm text-gray-800 mb-1 line-clamp-2" title="${book.title}">
                            ${book.title}
                        </h3>
                        <p class="text-xs text-gray-600 mb-2 line-clamp-1" title="${book.author}">
                            ${book.author}
                        </p>
                        <p class="text-xs text-gray-500 mb-2 line-clamp-1" title="${book.publisher}">
                            ${book.publisher}
                        </p>
                        <div class="text-right">
                            ${priceInfo}
                        </div>
                    </div>
                </div>
            `;

            // 클릭 이벤트
            card.addEventListener('click', () => {
                UIComponents.showBookDetail(book);
            });

            return card;
        },

        /**
         * 도서 그리드 렌더링
         * @param {array} books - 도서 목록
         * @param {string} containerId - 컨테이너 ID
         */
        renderBookGrid: (books, containerId = 'books-grid') => {
            const container = document.getElementById(containerId);
            if (!container) return;

            // 기존 내용 초기화
            container.innerHTML = '';

            if (!books || books.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12 text-gray-500">
                        <i class="fas fa-book-open text-4xl mb-2"></i>
                        <p>검색 결과가 없습니다.</p>
                        <p class="text-sm">다른 검색어를 시도해보세요.</p>
                    </div>
                `;
                return;
            }

            // 도서 카드 생성 및 추가
            books.forEach(book => {
                const card = UIComponents.createBookCard(book);
                container.appendChild(card);
            });
        },

        // ===== 모달 관리 =====
        
        /**
         * 도서 상세정보 모달 표시
         * @param {object} book - 도서 정보
         */
        showBookDetail: (book) => {
            const modal = document.getElementById('book-detail-modal');
            const content = document.getElementById('book-detail-content');
            
            if (!modal || !content) return;

            // 가격 정보
            const priceSection = book.salePrice && book.salePrice !== book.price ? 
                `<div class="flex items-center space-x-2">
                    <span class="text-2xl font-bold text-red-600">${Config.formatPrice(book.salePrice)}</span>
                    <span class="text-lg text-gray-400 line-through">${Config.formatPrice(book.price)}</span>
                    <span class="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">${book.discountRate}% 할인</span>
                </div>` :
                `<div class="text-2xl font-bold text-gray-700">${Config.formatPrice(book.price || 0)}</div>`;

            content.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- 도서 이미지 -->
                    <div class="md:col-span-1">
                        <img src="${book.thumbnail || '/images/no-image.png'}" 
                             alt="${book.title}" 
                             class="w-full rounded-lg shadow-md"
                             onerror="this.src='/images/no-image.png'">
                    </div>
                    
                    <!-- 도서 정보 -->
                    <div class="md:col-span-2">
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">${book.title}</h1>
                        <div class="space-y-2 mb-4">
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-user w-5"></i>
                                <span>${book.author}</span>
                            </div>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-building w-5"></i>
                                <span>${book.publisher}</span>
                            </div>
                            ${book.isbn ? `
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-barcode w-5"></i>
                                <span>${book.isbn}</span>
                            </div>` : ''}
                        </div>
                        
                        <!-- 가격 -->
                        <div class="mb-6">
                            ${priceSection}
                        </div>
                        
                        <!-- 도서 소개 -->
                        <div class="mb-6">
                            <h3 class="font-semibold text-gray-800 mb-2">도서 소개</h3>
                            <p class="text-gray-600 leading-relaxed">
                                ${book.contents || '도서 소개 정보가 없습니다.'}
                            </p>
                        </div>
                        
                        <!-- 액션 버튼 -->
                        <div class="flex space-x-3">
                            <button id="request-book-btn" 
                                    class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-plus mr-2"></i>신청하기
                            </button>
                            ${book.url ? `
                            <a href="${book.url}" target="_blank" 
                               class="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition text-center">
                                <i class="fas fa-external-link-alt mr-2"></i>상세보기
                            </a>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // 신청 버튼 이벤트
            const requestBtn = content.querySelector('#request-book-btn');
            if (requestBtn) {
                requestBtn.addEventListener('click', async () => {
                    await UIComponents.handleBookRequest(book);
                });
            }

            // 모달 표시
            modal.classList.remove('hidden');
            currentModal = modal;
        },

        /**
         * 모달 닫기
         */
        closeModal: () => {
            if (currentModal) {
                currentModal.classList.add('hidden');
                currentModal = null;
            }
        },

        // ===== 도서 신청 처리 =====
        
        /**
         * 도서 신청 처리
         * @param {object} book - 신청할 도서
         */
        handleBookRequest: async (book) => {
            try {
                // 학급 선택 확인
                if (!BookService.hasSelectedClass()) {
                    UIComponents.showError(Config.getErrorMessages().CLASS_NOT_SELECTED);
                    return;
                }

                // 확인 대화상자
                if (!confirm(Config.getConfirmMessages().REQUEST_BOOK)) {
                    return;
                }

                UIComponents.showLoading(true, '도서 신청 중...');

                // 도서 신청
                await BookService.requestBook(book);

                UIComponents.showLoading(false);
                UIComponents.showSuccess(Config.getSuccessMessages().BOOK_REQUESTED);
                UIComponents.closeModal();

                // 예산 정보 업데이트
                await UIComponents.updateBudgetDisplay();

            } catch (error) {
                UIComponents.showLoading(false);
                UIComponents.showError(error.message);
            }
        },

        // ===== 학급 정보 표시 =====
        
        /**
         * 학급 정보 표시 업데이트
         */
        updateClassDisplay: () => {
            const classInfo = BookService.getCurrentClass();
            const displayElement = document.getElementById('selected-class-info');
            const gradeClassElement = document.getElementById('display-grade-class');
            const teacherElement = document.getElementById('display-teacher');

            if (!displayElement) return;

            if (classInfo) {
                displayElement.classList.remove('hidden');
                if (gradeClassElement) {
                    gradeClassElement.textContent = `${classInfo.grade}학년 ${classInfo.classNumber}반`;
                }
                if (teacherElement) {
                    teacherElement.textContent = classInfo.teacher;
                }
                
                // 예산 정보 업데이트
                UIComponents.updateBudgetDisplay();
            } else {
                displayElement.classList.add('hidden');
            }
        },

        /**
         * 예산 정보 표시 업데이트
         */
        updateBudgetDisplay: async () => {
            try {
                const classInfo = BookService.getCurrentClass();
                if (!classInfo) return;

                const budgetInfo = await BookService.checkBudget(0);
                
                const totalBudgetElement = document.getElementById('total-budget');
                const remainingBudgetElement = document.getElementById('remaining-budget');

                if (totalBudgetElement) {
                    totalBudgetElement.textContent = Config.formatPrice(budgetInfo.totalBudget);
                }
                if (remainingBudgetElement) {
                    remainingBudgetElement.textContent = Config.formatPrice(budgetInfo.remainingBudget);
                    
                    // 예산 부족 시 색상 변경
                    if (budgetInfo.remainingBudget < 10000) {
                        remainingBudgetElement.className = 'text-red-600';
                    } else if (budgetInfo.remainingBudget < 50000) {
                        remainingBudgetElement.className = 'text-yellow-600';
                    } else {
                        remainingBudgetElement.className = 'text-blue-600';
                    }
                }
            } catch (error) {
                console.error('예산 정보 업데이트 오류:', error);
            }
        },

        // ===== 카테고리 관리 =====
        
        /**
         * 카테고리 버튼 활성화
         * @param {string} categoryId - 활성화할 카테고리 ID
         */
        setActiveCategory: (categoryId) => {
            const buttons = document.querySelectorAll('.category-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === categoryId) {
                    btn.classList.add('active');
                }
            });

            // 카테고리 제목 업데이트
            const titleElement = document.getElementById('current-category-title');
            if (titleElement) {
                const category = Config.getCategoryById(categoryId);
                titleElement.textContent = category ? category.name : '도서 목록';
            }
        },

        // ===== 페이지네이션 =====
        
        /**
         * 페이지네이션 버튼 생성
         * @param {object} meta - 페이지 메타 정보
         * @param {function} onPageChange - 페이지 변경 콜백
         */
       /* renderPagination: (meta, onPageChange) => {
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (!loadMoreBtn) return;

            if (meta.isEnd || meta.currentPage >= Math.ceil(meta.pageableCount / meta.pageSize)) {
                loadMoreBtn.classList.add('hidden');
            } else {
                loadMoreBtn.classList.remove('hidden');
                loadMoreBtn.onclick = () => onPageChange(meta.currentPage + 1);
            }
        },*/

        // ===== 유틸리티 =====
        
        /**
         * 도서 수 표시 업데이트
         * @param {number} count - 도서 수
         */
        updateBookCount: (count) => {
            const countElement = document.getElementById('total-books-count');
            if (countElement) {
                countElement.textContent = count.toLocaleString();
            }
        },

        /**
         * 스크롤을 맨 위로 이동
         * @param {boolean} smooth - 부드러운 스크롤 여부
         */
        scrollToTop: (smooth = true) => {
            window.scrollTo({
                top: 0,
                behavior: smooth ? 'smooth' : 'auto'
            });
        },

        /**
         * 요소가 화면에 보이는지 확인
         * @param {Element} element - 확인할 요소
         * @returns {boolean} - 보이는지 여부
         */
        isElementVisible: (element) => {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        /**
         * 디바운스 함수
         * @param {function} func - 실행할 함수
         * @param {number} wait - 대기 시간 (ms)
         * @returns {function} - 디바운스된 함수
         */
        debounce: (func, wait) => {
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
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.UIComponents = UIComponents;