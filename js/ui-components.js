/**
 * ui-components.js
 * UI 컴포넌트와 관련 기능을 관리하는 모듈 (알라딘 API 기반)
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
        showLoading: (show = true, message = '도서를 검색하고 있습니다...') => {
            const loadingElement = document.getElementById('loadingIndicator');
            if (!loadingElement) return;

            if (show) {
                loadingElement.classList.remove('hidden');
                const messageElement = loadingElement.querySelector('p');
                if (messageElement) {
                    messageElement.textContent = message;
                }
                isLoading = true;
            } else {
                loadingElement.classList.add('hidden');
                isLoading = false;
            }
        },

        /**
         * 로딩 상태 확인
         * @returns {boolean} - 로딩 중 여부
         */
        isLoading: () => isLoading,

        // ===== 알림 메시지 =====
        
        /**
         * 토스트 알림 표시
         * @param {string} message - 메시지 내용
         * @param {string} type - 알림 타입 (success, error, info)
         * @param {number} duration - 표시 시간 (ms)
         */
        showToast: (message, type = 'info', duration = 3000) => {
            // 기존 토스트 제거
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = createElement('div', {
                className: `toast-notification fixed top-4 right-4 max-w-sm w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`
            });

            const iconClasses = {
                success: 'fas fa-check-circle text-green-500',
                error: 'fas fa-exclamation-circle text-red-500',
                info: 'fas fa-info-circle text-blue-500'
            };

            toast.innerHTML = `
                <div class="p-4">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <i class="${iconClasses[type] || iconClasses.info} text-xl"></i>
                        </div>
                        <div class="ml-3 w-0 flex-1">
                            <p class="text-sm font-medium text-gray-900">${message}</p>
                        </div>
                        <div class="ml-4 flex-shrink-0 flex">
                            <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 close-toast">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(toast);

            // 애니메이션으로 표시
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 100);

            // 닫기 버튼 이벤트
            toast.querySelector('.close-toast').addEventListener('click', () => {
                toast.classList.add('translate-x-full');
                setTimeout(() => toast.remove(), 300);
            });

            // 자동 숨김
            if (duration > 0) {
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.classList.add('translate-x-full');
                        setTimeout(() => toast.remove(), 300);
                    }
                }, duration);
            }
        },

        // ===== 도서 카드 생성 =====
        
        /**
         * 도서 카드 생성 (알라딘 API 데이터 기반)
         * @param {object} book - 알라딘 API 도서 정보
         * @returns {Element} - 도서 카드 요소
         */
        createBookCard: (book) => {
            const card = createElement('div', {
                className: 'book-card bg-white rounded-lg shadow-sm hover:shadow-lg cursor-pointer border border-gray-200 transition-all duration-300',
                'data-book-id': book.id
            });

            // 가격 정보 처리
            const finalPrice = book.salePrice || book.finalPrice || book.price || 0;
            const originalPrice = book.price || 0;
            const hasDiscount = book.hasDiscount || (originalPrice > finalPrice && finalPrice > 0);
            const discountRate = book.discountRate || 0;

            // 가격 표시
            let priceDisplay = '';
            if (hasDiscount && originalPrice > finalPrice) {
                priceDisplay = `
                    <div class="text-red-600 font-bold text-lg">${Config.formatPrice(finalPrice)}</div>
                    <div class="text-gray-400 line-through text-sm">${Config.formatPrice(originalPrice)}</div>
                `;
            } else {
                priceDisplay = `<div class="text-gray-700 font-bold text-lg">${Config.formatPrice(finalPrice)}</div>`;
            }

            // 할인 배지
            const discountBadge = discountRate > 0 ? 
                `<div class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    ${discountRate}% 할인
                </div>` : '';

            // 썸네일 처리
            const thumbnail = book.thumbnail || book.cover || '';
            const imageElement = thumbnail ? 
                `<img src="${thumbnail}" alt="${book.title}" class="w-full h-48 object-cover rounded-t-lg" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center text-gray-400" style="display: none;">
                     <i class="fas fa-book text-4xl"></i>
                 </div>` :
                `<div class="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center text-gray-400">
                     <i class="fas fa-book text-4xl"></i>
                 </div>`;

            card.innerHTML = `
                <div class="relative">
                    ${discountBadge}
                    <div class="aspect-w-3 aspect-h-4 mb-3">
                        ${imageElement}
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-sm text-gray-800 mb-2 line-clamp-2 leading-tight" title="${book.title}">
                            ${book.title}
                        </h3>
                        <p class="text-xs text-gray-600 mb-1 line-clamp-1" title="${book.author}">
                            <i class="fas fa-user mr-1"></i>${book.author}
                        </p>
                        <p class="text-xs text-gray-500 mb-3 line-clamp-1" title="${book.publisher}">
                            <i class="fas fa-building mr-1"></i>${book.publisher}
                        </p>
                        <div class="flex justify-between items-end">
                            <div class="text-right flex-1">
                                ${priceDisplay}
                            </div>
                        </div>
                        <button class="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                            <i class="fas fa-plus mr-2"></i>신청하기
                        </button>
                    </div>
                </div>
            `;

            // 클릭 이벤트 (카드 전체)
            card.addEventListener('click', (e) => {
                // 버튼 클릭이 아닌 경우에만 상세 정보 표시
                if (!e.target.closest('button')) {
                    UIComponents.showBookDetail(book);
                }
            });

            // 신청 버튼 클릭 이벤트
            const requestBtn = card.querySelector('button');
            requestBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                UIComponents.showBookRequestModal(book);
            });

            return card;
        },

        /**
         * 도서 목록 렌더링
         * @param {array} books - 도서 목록
         * @param {string} containerId - 컨테이너 ID
         */
        renderBookGrid: (books, containerId = 'booksContainer') => {
            const container = document.getElementById(containerId);
            const emptyState = document.getElementById('emptyState');
            
            if (!container) return;

            // 기존 내용 초기화
            container.innerHTML = '';

            if (!books || books.length === 0) {
                // 빈 상태 표시
                if (emptyState) {
                    emptyState.classList.remove('hidden');
                }
                return;
            }

            // 빈 상태 숨김
            if (emptyState) {
                emptyState.classList.add('hidden');
            }

            // 도서 카드 생성 및 추가
            books.forEach((book, index) => {
                const card = UIComponents.createBookCard(book);
                card.classList.add('fade-in');
                card.style.animationDelay = `${index * 0.1}s`;
                container.appendChild(card);
            });
        },

        // ===== 모달 관리 =====
        
        /**
         * 도서 상세 정보 모달 표시
         * @param {object} book - 도서 정보
         */
        showBookDetail: (book) => {
            const modal = document.getElementById('bookModal');
            const modalContent = document.getElementById('modalContent');
            
            if (!modal || !modalContent) return;

            // 가격 정보
            const finalPrice = book.salePrice || book.finalPrice || book.price || 0;
            const originalPrice = book.price || 0;
            const hasDiscount = book.hasDiscount || (originalPrice > finalPrice && finalPrice > 0);

            let priceDisplay = '';
            if (hasDiscount && originalPrice > finalPrice) {
                priceDisplay = `
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl font-bold text-red-600">${Config.formatPrice(finalPrice)}</span>
                        <span class="text-lg text-gray-400 line-through">${Config.formatPrice(originalPrice)}</span>
                        <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">${book.discountRate || 0}% 할인</span>
                    </div>
                `;
            } else {
                priceDisplay = `<div class="text-2xl font-bold text-gray-700">${Config.formatPrice(finalPrice)}</div>`;
            }

            // 썸네일 처리
            const thumbnail = book.thumbnail || book.cover || '';
            const imageElement = thumbnail ? 
                `<img src="${thumbnail}" alt="${book.title}" class="w-full h-64 object-cover rounded-lg" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400" style="display: none;">
                     <i class="fas fa-book text-6xl"></i>
                 </div>` :
                `<div class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                     <i class="fas fa-book text-6xl"></i>
                 </div>`;

            modalContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        ${imageElement}
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 mb-3">${book.title}</h2>
                        
                        <div class="space-y-2 mb-4">
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-user w-5 mr-2"></i>
                                <span>${book.author}</span>
                            </div>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-building w-5 mr-2"></i>
                                <span>${book.publisher}</span>
                            </div>
                            ${book.pubDate ? `
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-calendar w-5 mr-2"></i>
                                <span>${book.pubDate}</span>
                            </div>` : ''}
                            ${book.isbn13 ? `
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-barcode w-5 mr-2"></i>
                                <span>${book.isbn13}</span>
                            </div>` : ''}
                        </div>

                        <div class="mb-4">
                            ${priceDisplay}
                        </div>

                        ${book.description ? `
                        <div class="mb-4">
                            <h3 class="font-medium text-gray-900 mb-2">도서 소개</h3>
                            <p class="text-gray-600 text-sm leading-relaxed">${book.description}</p>
                        </div>` : ''}

                        <div class="flex space-x-3">
                            <button id="requestBookBtn" class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                                <i class="fas fa-plus mr-2"></i>도서 신청
                            </button>
                            ${book.url ? `
                            <a href="${book.url}" target="_blank" class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-center">
                                <i class="fas fa-external-link-alt mr-2"></i>상세 정보
                            </a>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // 신청 버튼 이벤트
            const requestBtn = modalContent.querySelector('#requestBookBtn');
            if (requestBtn) {
                requestBtn.addEventListener('click', () => {
                    UIComponents.hideModal();
                    UIComponents.showBookRequestModal(book);
                });
            }

            // 모달 표시
            modal.classList.remove('hidden');
            currentModal = modal;
        },

        /**
         * 도서 신청 모달 표시
         * @param {object} book - 도서 정보
         */
        showBookRequestModal: async (book) => {
            // 학급 선택 확인
            if (!BookService.hasSelectedClass()) {
                UIComponents.showToast('먼저 학급 정보를 입력해주세요.', 'error');
                return;
            }

            const modal = document.getElementById('bookModal');
            const modalContent = document.getElementById('modalContent');
            
            if (!modal || !modalContent) return;

            try {
                // 중복 검사
                const duplicateResult = await BookService.checkDuplicate(book);
                
                // 예산 확인
                const finalPrice = book.salePrice || book.finalPrice || book.price || 0;
                const budgetCheck = await BookService.checkBudget(finalPrice);

                let warningMessage = '';
                if (duplicateResult.isDuplicate) {
                    warningMessage = `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div class="flex">
                                <i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i>
                                <div>
                                    <h4 class="text-yellow-800 font-medium">중복 도서 발견</h4>
                                    <p class="text-yellow-700 text-sm mt-1">
                                        유사한 도서가 이미 신청되었습니다: "${duplicateResult.similarBook.title}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                }

                if (!budgetCheck.canAfford) {
                    warningMessage += `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div class="flex">
                                <i class="fas fa-exclamation-circle text-red-400 mr-2"></i>
                                <div>
                                    <h4 class="text-red-800 font-medium">예산 부족</h4>
                                    <p class="text-red-700 text-sm mt-1">
                                        남은 예산: ${Config.formatPrice(budgetCheck.remainingBudget)} / 
                                        도서 가격: ${Config.formatPrice(finalPrice)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                }

                const classInfo = BookService.getCurrentClass();
                
                modalContent.innerHTML = `
                    <div class="text-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">도서 신청 확인</h3>
                    </div>

                    ${warningMessage}

                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <div class="flex items-start space-x-4">
                            <img src="${book.thumbnail || ''}" alt="${book.title}" 
                                 class="w-16 h-20 object-cover rounded"
                                 onerror="this.style.display='none'">
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">${book.title}</h4>
                                <p class="text-sm text-gray-600">${book.author}</p>
                                <p class="text-sm text-gray-500">${book.publisher}</p>
                                <p class="text-lg font-bold text-blue-600 mt-1">${Config.formatPrice(finalPrice)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 class="font-medium text-blue-900 mb-2">신청 정보</h4>
                        <div class="text-sm text-blue-800">
                            <p>학급: ${classInfo.grade}학년 ${classInfo.classNumber}반</p>
                            <p>담임교사: ${classInfo.teacher}</p>
                            <p>남은 예산: ${Config.formatPrice(budgetCheck.remainingBudget)}</p>
                        </div>
                    </div>

                    <div class="flex space-x-3">
                        <button id="cancelRequestBtn" class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium">
                            취소
                        </button>
                        <button id="confirmRequestBtn" class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                                ${(!budgetCheck.canAfford || duplicateResult.isDuplicate) ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>
                            <i class="fas fa-check mr-2"></i>신청 확인
                        </button>
                    </div>
                `;

                // 이벤트 리스너
                modalContent.querySelector('#cancelRequestBtn').addEventListener('click', () => {
                    UIComponents.hideModal();
                });

                const confirmBtn = modalContent.querySelector('#confirmRequestBtn');
                if (confirmBtn && !confirmBtn.disabled) {
                    confirmBtn.addEventListener('click', async () => {
                        try {
                            UIComponents.showLoading(true, '도서를 신청하고 있습니다...');
                            
                            await BookService.requestBook(book);
                            
                            UIComponents.hideModal();
                            UIComponents.showToast('도서 신청이 완료되었습니다!', 'success');
                            
                        } catch (error) {
                            console.error('도서 신청 오류:', error);
                            UIComponents.showToast(error.message || '도서 신청 중 오류가 발생했습니다.', 'error');
                        } finally {
                            UIComponents.showLoading(false);
                        }
                    });
                }

                // 모달 표시
                modal.classList.remove('hidden');
                currentModal = modal;

            } catch (error) {
                console.error('신청 모달 표시 오류:', error);
                UIComponents.showToast('신청 정보를 불러오는 중 오류가 발생했습니다.', 'error');
            }
        },

        /**
         * 모달 숨기기
         */
        hideModal: () => {
            if (currentModal) {
                currentModal.classList.add('hidden');
                currentModal = null;
            }
        },

        // ===== 페이지네이션 =====
        
        /**
         * 페이지네이션 렌더링
         * @param {object} meta - 페이지네이션 메타 정보
         * @param {function} onPageChange - 페이지 변경 콜백
         * @param {string} containerId - 컨테이너 ID
         */
        renderPagination: (meta, onPageChange, containerId = 'paginationContainer') => {
            const container = document.getElementById(containerId);
            if (!container || !meta) return;

            const { currentPage, totalPages, isEnd } = meta;
            
            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            const pagination = createElement('div', {
                className: 'flex items-center justify-center space-x-2'
            });

            // 이전 페이지 버튼
            if (currentPage > 1) {
                const prevBtn = createElement('button', {
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                }, '<i class="fas fa-chevron-left"></i>');
                
                prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
                pagination.appendChild(prevBtn);
            }

            // 페이지 번호 버튼들
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + 4);

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = createElement('button', {
                    className: i === currentPage ? 
                        'px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md' :
                        'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                }, i.toString());
                
                if (i !== currentPage) {
                    pageBtn.addEventListener('click', () => onPageChange(i));
                }
                pagination.appendChild(pageBtn);
            }

            // 다음 페이지 버튼
            if (currentPage < totalPages && !isEnd) {
                const nextBtn = createElement('button', {
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                }, '<i class="fas fa-chevron-right"></i>');
                
                nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
                pagination.appendChild(nextBtn);
            }

            container.innerHTML = '';
            container.appendChild(pagination);
        },

        // ===== 카테고리 관리 =====
        
        /**
         * 활성 카테고리 설정
         * @param {string} categoryId - 카테고리 ID
         */
        setActiveCategory: (categoryId) => {
            // 모든 카테고리 버튼에서 active 클래스 제거
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // 선택된 카테고리 버튼에 active 클래스 추가
            const activeBtn = document.querySelector(`[data-category="${categoryId}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        },

        // ===== 유틸리티 =====
        
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
        },

        /**
         * 요소가 뷰포트에 보이는지 확인
         * @param {Element} element - 확인할 요소
         * @returns {boolean} - 보이는지 여부
         */
        isElementInViewport: (element) => {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.UIComponents = UIComponents;