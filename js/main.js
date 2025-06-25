/**
 * 완전 수정된 메인 애플리케이션 로직 - 도서 클릭 및 중복 실행 문제 해결
 */

class BookRequestApp {
    constructor() {
        console.log('🚀 BookRequestApp 초기화 시작');
        
        // 애플리케이션 상태
        this.currentBooks = [];
        this.allBooks = [];
        this.currentPage = 1;
        this.hasMorePages = false;
        this.currentCategory = 'bestseller';
        this.currentClass = null;
        this.isAuthenticated = false;
        this.requestedBooks = new Set();
        this.ownedBooks = [];
        this.appliedBooks = new Set();
        
        // 🔥 중복 실행 방지 플래그들
        this.isUpdatingBookStatus = false;
        this.isProcessingRequest = false;
        this.isLoadingBooks = false;
        
        // DOM 요소 캐시
        this.elements = {};
        
        // 초기화
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        try {
            this.bindElements();
            this.bindEvents();
            
            // 유효한 세션 확인
            this.checkValidSession();
            
            // 초기 데이터 로드
            await this.loadInitialData();
            
            console.log('✅ BookRequestApp 초기화 완료!');
        } catch (error) {
            console.error('❌ 초기화 오류:', error);
        }
    }

    /**
     * DOM 요소 바인딩
     */
    bindElements() {
        this.elements = {
            // 학급 정보
            grade: document.getElementById('grade'),
            class: document.getElementById('class'),
            teacher: document.getElementById('teacher'),
            setClassBtn: document.getElementById('setClass'),
            classInfo: document.getElementById('classInfo'),
            
            // 검색
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            
            // 카테고리
            categoryList: document.getElementById('categoryList'),
            currentCategory: document.getElementById('currentCategory'),
            sortBy: document.getElementById('sortBy'),
            
            // 도서 목록
            booksGrid: document.getElementById('booksGrid'),
            totalBooks: document.getElementById('totalBooks'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            emptyState: document.getElementById('emptyState'),
            
            // 모달
            bookModal: document.getElementById('bookModal'),
            modalContent: document.getElementById('modalContent')
        };
        console.log('📋 요소 바인딩 완료');
    }

    /**
     * 이벤트 리스너 바인딩
     */
    bindEvents() {
        // 학급 정보 설정
        if (this.elements.setClassBtn) {
            this.elements.setClassBtn.addEventListener('click', this.handleSetClass.bind(this));
        }
        
        // 학년 선택 시 해당 학년의 반 목록 로드
        if (this.elements.grade) {
            this.elements.grade.addEventListener('change', this.handleGradeChange.bind(this));
        }
        
        // 반 선택 시 담임교사 정보 로드
        if (this.elements.class) {
            this.elements.class.addEventListener('change', this.handleClassChange.bind(this));
        }
        
        // 검색
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
        }
        
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.handleSearch(this.elements.searchInput.value);
            });
        }
        
        // 엔터 키로 검색
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
        
        // 정렬 변경
        if (this.elements.sortBy) {
            this.elements.sortBy.addEventListener('change', this.handleSortChange.bind(this));
        }
        
        // 더보기 버튼
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
        }
        
        // 🔥 도서 그리드 클릭 이벤트 (더 안정적인 방식)
        if (this.elements.booksGrid) {
            // document 레벨에서 클릭 감지
            document.addEventListener('click', (e) => {
                console.log('🖱️ 문서 클릭 감지:', e.target.tagName, e.target.className);
                
                // 도서 그리드 내부 클릭인지 확인
                const booksGrid = document.getElementById('booksGrid');
                if (booksGrid && booksGrid.contains(e.target)) {
                    console.log('📚 도서 그리드 내부 클릭 확인됨');
                    this.handleBookGridClick(e);
                }
            });
        }
        
        // 모달 닫기
        if (this.elements.bookModal) {
            this.elements.bookModal.addEventListener('click', (e) => {
                if (e.target === this.elements.bookModal || e.target.classList.contains('close-modal')) {
                    this.closeModal();
                }
            });
        }
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.bookModal && !this.elements.bookModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
        
        // 카테고리 이벤트 설정
        this.setupCategoryEvents();
        
        console.log('✅ 모든 이벤트 리스너 바인딩 완료');
    }

    /**
     * 🔥 도서 그리드 클릭 처리 (개선된 버전)
     */
    handleBookGridClick(e) {
        console.log('🎯 도서 그리드 클릭 처리 시작');
        console.log('🔍 클릭된 요소:', e.target.tagName, e.target.className);
        
        // 신청 버튼 클릭 처리
        const applyBtn = e.target.closest('.apply-btn');
        if (applyBtn) {
            console.log('🔘 신청 버튼 클릭됨');
            e.preventDefault();
            e.stopPropagation();
            
            const isbn = applyBtn.getAttribute('data-isbn') || applyBtn.dataset.isbn;
            console.log('📖 신청 버튼 ISBN:', isbn);
            
            if (isbn) {
                const book = this.currentBooks.find(b => b.isbn === isbn);
                if (book) {
                    console.log('📖 신청할 도서 발견:', book.title);
                    this.handleBookRequest(book);
                } else {
                    console.log('❌ 도서를 찾을 수 없음:', isbn);
                }
            }
            return;
        }
        
        // 도서 카드 클릭 처리 (상세보기)
        const bookCard = e.target.closest('.book-card');
        if (bookCard) {
            console.log('📄 도서 카드 클릭 감지됨');
            
            const isbn = bookCard.getAttribute('data-isbn') || bookCard.dataset.isbn;
            console.log('📖 도서 카드 ISBN:', isbn);
            
            if (isbn) {
                const book = this.currentBooks.find(b => b.isbn === isbn);
                if (book) {
                    console.log('📖 상세 보기할 도서 발견:', book.title);
                    this.showBookDetail(book);
                } else {
                    console.log('❌ 도서를 찾을 수 없음:', isbn);
                }
            }
            return;
        }
        
        console.log('🔍 클릭 대상이 도서 카드나 신청 버튼이 아님');
    }

    /**
     * 🔥 도서 상세보기 모달 (개선된 버전)
     */
    showBookDetail(book) {
        console.log('📖 도서 상세 모달 표시 시작:', book.title);
        
        if (!this.elements.bookModal || !this.elements.modalContent) {
            console.log('❌ 모달 요소를 찾을 수 없음');
            return;
        }
        
        // 모달 요소 확인
        const modalElements = {
            bookModal: !!this.elements.bookModal,
            modalContent: !!this.elements.modalContent
        };
        console.log('📊 모달 요소 확인:', modalElements);
        
        // 도서 상태 확인
        const isOwned = this.isBookOwned(book);
        const isApplied = this.appliedBooks.has(book.isbn);
        
        console.log('🎨 모달 콘텐츠 생성 중...');
        
        // 모달 내용 생성
        this.elements.modalContent.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-bold text-gray-800 pr-4">${book.title}</h2>
                    <button class="close-modal text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                </div>
                
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="flex-shrink-0">
                        <img src="${book.cover}" alt="${book.title}" class="w-48 h-auto rounded-lg shadow-md mx-auto">
                    </div>
                    
                    <div class="flex-1">
                        <div class="space-y-3">
                            <div>
                                <span class="font-semibold text-gray-700">저자:</span>
                                <span class="text-gray-600 ml-2">${book.author}</span>
                            </div>
                            <div>
                                <span class="font-semibold text-gray-700">출판사:</span>
                                <span class="text-gray-600 ml-2">${book.publisher}</span>
                            </div>
                            <div>
                                <span class="font-semibold text-gray-700">출간일:</span>
                                <span class="text-gray-600 ml-2">${book.pubDate}</span>
                            </div>
                            <div>
                                <span class="font-semibold text-gray-700">가격:</span>
                                <span class="text-gray-600 ml-2">${this.formatPrice(book.priceSales || book.priceStandard)}</span>
                            </div>
                            ${book.description ? `
                            <div>
                                <span class="font-semibold text-gray-700">설명:</span>
                                <p class="text-gray-600 mt-1 text-sm leading-relaxed">${book.description}</p>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="mt-6">
                            ${isOwned ? `
                                <button class="w-full bg-red-500 text-white py-3 px-6 rounded-lg cursor-not-allowed opacity-60" disabled>
                                    <i class="fas fa-check mr-2"></i>보유중 (신청불가)
                                </button>
                            ` : isApplied ? `
                                <button class="w-full bg-green-500 text-white py-3 px-6 rounded-lg cursor-not-allowed opacity-60" disabled>
                                    <i class="fas fa-check mr-2"></i>신청완료
                                </button>
                            ` : `
                                <button class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition apply-btn" 
                                        data-isbn="${book.isbn}"
                                        onclick="event.stopPropagation(); window.bookApp.handleBookRequest(${JSON.stringify(book).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-plus mr-2"></i>신청하기
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('👁️ 모달 표시 실행...');
        
        // 모달 표시
        this.elements.bookModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ 모달 표시 완료!');
    }

    /**
     * 모달 닫기
     */
    closeModal() {
        if (this.elements.bookModal) {
            this.elements.bookModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * 🔥 도서 신청 처리 (개선된 버전)
     */
    async handleBookRequest(book) {
        // 중복 처리 방지
        if (this.isProcessingRequest) {
            console.log('⏳ 이미 신청 처리 중, 건너뜀');
            return;
        }
        
        console.log('📚 도서 신청 시작:', book.title);
        
        // 학급 정보 확인
        if (!this.currentClass || !this.currentClass.classId) {
            alert('먼저 학급 정보를 설정해주세요.');
            return;
        }
        
        // 보유도서 확인
        if (this.isBookOwned(book)) {
            alert('이미 학교에서 보유하고 있는 도서입니다.');
            return;
        }
        
        // 중복 신청 확인
        if (this.appliedBooks.has(book.isbn)) {
            alert('이미 신청한 도서입니다.');
            return;
        }
        
        // 신청 확인
        if (!confirm(`"${book.title}"을(를) 신청하시겠습니까?`)) {
            return;
        }
        
        this.isProcessingRequest = true;
        
        try {
            // 신청 처리
            await this.submitBookRequest(book);
            
            // 신청 완료 처리
            this.appliedBooks.add(book.isbn);
            
            // UI 업데이트
            this.updateBookStatus(book.isbn, 'applied');
            
            // 모달 닫기
            this.closeModal();
            
            // 성공 메시지
            alert(`"${book.title}" 신청이 완료되었습니다.`);
            
            console.log('✅ 도서 신청 완료:', book.title);
            
        } catch (error) {
            console.error('❌ 도서 신청 오류:', error);
            alert('도서 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 0.5초 후 플래그 해제 (중복 클릭 방지)
            setTimeout(() => {
                this.isProcessingRequest = false;
            }, 500);
        }
    }

    /**
     * 🔥 보유도서 상태 업데이트 (중복 실행 방지)
     */
    async updateBooksStatus() {
        // 중복 실행 방지
        if (this.isUpdatingBookStatus) {
            console.log('📚 이미 도서 상태 업데이트 진행 중, 건너뜀');
            return;
        }
        
        console.log('📚 도서 상태 업데이트 시작 (중복 방지 적용)...');
        this.isUpdatingBookStatus = true;
        
        try {
            // owned-books.json에서 보유도서 로드
            await this.loadOwnedBooks();
            
            // 현재 표시된 도서들의 상태 업데이트
            this.currentBooks.forEach((book, index) => {
                const isOwned = this.isBookOwned(book);
                const isApplied = this.appliedBooks.has(book.isbn);
                
                // DOM에서 해당 카드 찾기
                const cards = document.querySelectorAll('.book-card');
                const card = cards[index];
                
                if (card) {
                    // 기존 상태 배지 모두 제거
                    const existingBadges = card.querySelectorAll('.owned-badge, .applied-badge, .status-badge');
                    existingBadges.forEach(badge => badge.remove());
                    
                    // 새로운 상태 배지 추가
                    if (isOwned) {
                        this.addOwnedBadge(card);
                    } else if (isApplied) {
                        this.addAppliedBadge(card);
                    }
                }
            });
            
            console.log('✅ 도서 상태 업데이트 완료');
            
        } catch (error) {
            console.error('❌ 도서 상태 업데이트 오류:', error);
        } finally {
            // 1초 후 플래그 해제
            setTimeout(() => {
                this.isUpdatingBookStatus = false;
            }, 1000);
        }
    }

    /**
     * owned-books.json에서 보유도서 로드
     */
    async loadOwnedBooks() {
        try {
            console.log('🌐 owned-books.json 파일 로드 시도...');
            const response = await fetch('/backend/data/owned-books.json');
            
            if (response.ok) {
                const ownedBooksData = await response.json();
                this.ownedBooks = Array.isArray(ownedBooksData) ? ownedBooksData : [];
                console.log(`✅ owned-books.json에서 ${this.ownedBooks.length}권 보유도서 로드`);
                
                // 샘플 데이터 출력
                if (this.ownedBooks.length > 0) {
                    console.log('📖 보유도서 샘플:');
                    this.ownedBooks.slice(0, 3).forEach((book, index) => {
                        console.log(`  ${index + 1}. ${book.title || book.자료명} - ${book.author || book.저자}`);
                    });
                }
            } else {
                console.log('❌ owned-books.json 로드 실패, 기본 데이터 사용');
                this.ownedBooks = this.getDefaultOwnedBooks();
            }
        } catch (error) {
            console.log('❌ owned-books.json 로드 오류, 기본 데이터 사용:', error.message);
            this.ownedBooks = this.getDefaultOwnedBooks();
        }
    }

    /**
     * 기본 보유도서 데이터
     */
    getDefaultOwnedBooks() {
        return [
            { title: '하이테크 하이터치', author: '존 나이스비트' },
            { title: '하이테크 사회와 인간의 조건', author: '김영민' },
            { title: '미래를 위한 하이테크', author: '이정호' }
        ];
    }

    /**
     * 도서가 보유도서인지 확인
     */
    isBookOwned(book) {
        return this.ownedBooks.some(owned => {
            // 1. ISBN 정확 매칭 (최우선)
            if (book.isbn && owned.isbn && book.isbn === owned.isbn) {
                return true;
            }
            
            // 2. 제목 + 저자 정확 매칭
            const bookTitle = book.title?.toLowerCase().trim();
            const bookAuthor = book.author?.toLowerCase().trim();
            const ownedTitle = (owned.title || owned.자료명)?.toLowerCase().trim();
            const ownedAuthor = (owned.author || owned.저자)?.toLowerCase().trim();
            
            if (bookTitle && ownedTitle && bookAuthor && ownedAuthor) {
                if (bookTitle === ownedTitle && bookAuthor === ownedAuthor) {
                    return true;
                }
            }
            
            // 3. 제목 정확 매칭
            if (bookTitle && ownedTitle && bookTitle === ownedTitle) {
                return true;
            }
            
            // 4. 부분 매칭 (하이테크 등)
            if (bookTitle && ownedTitle) {
                const bookWords = bookTitle.split(/\s+/);
                const ownedWords = ownedTitle.split(/\s+/);
                
                // 2글자 이상의 주요 단어 매칭
                for (const bookWord of bookWords) {
                    if (bookWord.length >= 2) {
                        for (const ownedWord of ownedWords) {
                            if (ownedWord.length >= 2 && bookWord.includes(ownedWord)) {
                                console.log(`✅ 보유도서 발견: "${book.title}" (부분 매칭: "${ownedWord}")`);
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        });
    }

    /**
     * 보유중 배지 추가
     */
    addOwnedBadge(card) {
        const badge = document.createElement('div');
        badge.className = 'absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded owned-badge status-badge animate-pulse';
        badge.textContent = '보유중';
        card.style.position = 'relative';
        card.appendChild(badge);
        
        // 그레이스케일 효과
        const img = card.querySelector('img');
        if (img) {
            img.style.filter = 'grayscale(50%)';
        }
        
        console.log('📚 보유도서 표시됨: ', card.querySelector('h3')?.textContent);
    }

    /**
     * 신청완료 배지 추가
     */
    addAppliedBadge(card) {
        const badge = document.createElement('div');
        badge.className = 'absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded applied-badge status-badge';
        badge.textContent = '신청완료';
        card.style.position = 'relative';
        card.appendChild(badge);
        
        console.log('📚 신청완료 도서 표시됨');
    }

    /**
     * 도서 상태 업데이트
     */
    updateBookStatus(isbn, status) {
        const cards = document.querySelectorAll('.book-card');
        cards.forEach(card => {
            const cardIsbn = card.getAttribute('data-isbn') || card.dataset.isbn;
            if (cardIsbn === isbn) {
                // 기존 배지 제거
                const existingBadges = card.querySelectorAll('.status-badge');
                existingBadges.forEach(badge => badge.remove());
                
                // 새 배지 추가
                if (status === 'applied') {
                    this.addAppliedBadge(card);
                } else if (status === 'owned') {
                    this.addOwnedBadge(card);
                }
            }
        });
    }

    /**
     * 도서 신청 서버 전송
     */
    async submitBookRequest(book) {
        // 실제 서버 API 호출
        try {
            const response = await fetch('/api/books/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    classId: this.currentClass.classId,
                    isbn: book.isbn,
                    title: book.title,
                    author: book.author,
                    publisher: book.publisher,
                    price: book.priceSales || book.priceStandard,
                    cover: book.cover
                })
            });
            
            if (!response.ok) {
                throw new Error('서버 요청 실패');
            }
            
            return await response.json();
        } catch (error) {
            // 서버 실패 시 로컬 저장
            console.log('서버 요청 실패, 로컬 저장:', error.message);
            
            const requestData = {
                id: Date.now().toString(),
                classId: this.currentClass.classId,
                isbn: book.isbn,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                price: book.priceSales || book.priceStandard,
                cover: book.cover,
                requestDate: new Date().toISOString()
            };
            
            // 로컬스토리지에 저장
            const requests = JSON.parse(localStorage.getItem('bookRequests') || '[]');
            requests.push(requestData);
            localStorage.setItem('bookRequests', JSON.stringify(requests));
            
            return requestData;
        }
    }

    /**
     * 유효한 세션 확인
     */
    checkValidSession() {
        const authInfo = JSON.parse(sessionStorage.getItem('classAuth') || 'null');
        if (authInfo && authInfo.expiry > Date.now()) {
            console.log('🔍 유효한 세션 인증 정보 발견:', authInfo.classId);
            
            // 학급 정보 복원
            const [grade, classNum] = authInfo.classId.split('-');
            this.currentClass = {
                grade: parseInt(grade),
                class: parseInt(classNum),
                classId: authInfo.classId,
                teacher: authInfo.teacher
            };
            
            // UI 업데이트
            if (this.elements.grade) this.elements.grade.value = grade;
            this.handleGradeChange();
            if (this.elements.class) this.elements.class.value = classNum;
            if (this.elements.teacher) this.elements.teacher.value = authInfo.teacher;
            
            this.isAuthenticated = true;
            this.updateClassInfo();
            
            console.log('✅ 세션 인증 복원 완료');
            
            // 세션 복원 후 보유도서 상태 업데이트
            setTimeout(() => {
                console.log('📚 세션 복원 후 보유도서 상태 업데이트 시작...');
                this.updateBooksStatus();
            }, 1000);
        }
    }

    /**
     * 🔥 도서 상태 업데이트 (학급 정보 없어도 실행)
     */
    updateBooksStatus() {
        console.log('📚 도서 상태 업데이트 시작 (학급 정보 관계없이 실행)...');
        
        // 도서 카드가 없으면 대기
        const cards = document.querySelectorAll('.book-card');
        if (cards.length === 0) {
            console.log('📚 업데이트할 도서 카드가 없습니다.');
            return;
        }
        
        // 중복 실행 방지
        if (this.isUpdatingBookStatus) {
            console.log('📚 이미 도서 상태 업데이트 진행 중, 건너뜀');
            return;
        }
        
        console.log('📚 보유도서 상태 업데이트 시작...', this.currentClass?.classId || '학급정보없음');
        
        this.isUpdatingBookStatus = true;
        
        try {
            // 백엔드 연결 테스트
            console.log('🔧 백엔드 연결 테스트 중...');
            fetch('/api/books/owned-books')
                .then(response => {
                    console.log('✅ 백엔드 연결 성공, 서버 모드로 진행');
                    return this.updateBooksStatusServer();
                })
                .catch(error => {
                    console.log('❌ 백엔드 연결 실패, 클라이언트 모드로 진행:', error.message);
                    return this.updateBooksStatusClient();
                })
                .finally(() => {
                    // 상태 업데이트 완료 후 플래그 해제
                    setTimeout(() => {
                        this.isUpdatingBookStatus = false;
                    }, 2000);
                });
                
        } catch (error) {
            console.error('❌ 도서 상태 업데이트 오류:', error);
            this.isUpdatingBookStatus = false;
        }
    }

    /**
     * 서버 모드 도서 상태 업데이트
     */
    async updateBooksStatusServer() {
        try {
            console.log(`📊 총 ${this.currentBooks.length}권의 도서 상태를 확인합니다.`);
            
            let processedCount = 0;
            let ownedCount = 0;
            let appliedCount = 0;
            
            // 배치 처리 (10권씩)
            for (let i = 0; i < this.currentBooks.length; i += 10) {
                const batch = this.currentBooks.slice(i, i + 10);
                
                await Promise.all(batch.map(async (book, batchIndex) => {
                    const cardIndex = i + batchIndex;
                    const cards = document.querySelectorAll('.book-card');
                    const card = cards[cardIndex];
                    
                    if (!card) return;
                    
                    try {
                        // 보유도서 확인
                        const ownedResponse = await fetch(`/api/books/check-owned?isbn=${book.isbn}&title=${encodeURIComponent(book.title)}`);
                        const isOwned = ownedResponse.ok ? (await ownedResponse.json()).owned : false;
                        
                        // 신청완료 확인
                        let isApplied = false;
                        if (this.currentClass?.classId) {
                            const appliedResponse = await fetch(`/api/books/check-applied?classId=${this.currentClass.classId}&isbn=${book.isbn}`);
                            isApplied = appliedResponse.ok ? (await appliedResponse.json()).applied : false;
                        }
                        
                        // 기존 배지 제거
                        const existingBadges = card.querySelectorAll('.owned-badge, .applied-badge, .status-badge');
                        existingBadges.forEach(badge => badge.remove());
                        
                        // 새 배지 추가
                        if (isOwned) {
                            this.addOwnedBadge(card, 'isbn_exact');
                            ownedCount++;
                        } else if (isApplied) {
                            this.addAppliedBadge(card);
                            appliedCount++;
                        }
                        
                    } catch (error) {
                        console.log(`❌ ${book.title} 상태 확인 오류:`, error.message);
                    }
                }));
                
                processedCount = Math.min(i + 10, this.currentBooks.length);
                console.log(`📈 진행률: ${processedCount}/${this.currentBooks.length} (${Math.round(processedCount / this.currentBooks.length * 100)}%)`);
                
                // UI 블로킹 방지를 위한 짧은 대기
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`✅ 보유도서 상태 업데이트 완료: ${this.currentBooks.length}/${this.currentBooks.length}권 처리됨`);
            console.log(`📊 도서 상태 통계: 보유중 ${ownedCount}권, 신청완료 ${appliedCount}권`);
            
        } catch (error) {
            console.error('❌ 서버 모드 상태 업데이트 오류:', error);
            // 실패 시 클라이언트 모드로 대체
            await this.updateBooksStatusClient();
        }
    }

    /**
     * 클라이언트 모드 도서 상태 업데이트
     */
    async updateBooksStatusClient() {
        try {
            console.log('📱 클라이언트 모드로 도서 상태 업데이트 시작...');
            
            // owned-books.json 로드
            await this.loadOwnedBooks();
            
            let ownedCount = 0;
            let appliedCount = 0;
            
            // 현재 도서들 상태 확인
            this.currentBooks.forEach((book, index) => {
                const cards = document.querySelectorAll('.book-card');
                const card = cards[index];
                
                if (card) {
                    // 기존 배지 제거
                    const existingBadges = card.querySelectorAll('.owned-badge, .applied-badge, .status-badge');
                    existingBadges.forEach(badge => badge.remove());
                    
                    // 보유도서 확인
                    const isOwned = this.isBookOwned(book);
                    const isApplied = this.appliedBooks.has(book.isbn);
                    
                    if (isOwned) {
                        this.addOwnedBadge(card, 'client_matching');
                        ownedCount++;
                    } else if (isApplied) {
                        this.addAppliedBadge(card);
                        appliedCount++;
                    }
                }
            });
            
            console.log(`✅ 클라이언트 모드 상태 업데이트 완료: 보유중 ${ownedCount}권, 신청완료 ${appliedCount}권`);
            
        } catch (error) {
            console.error('❌ 클라이언트 모드 상태 업데이트 오류:', error);
        }
    }

    /**
     * 보유중 배지 추가 (매칭 타입 포함)
     */
    addOwnedBadge(card, matchType = '') {
        const badge = document.createElement('div');
        badge.className = 'absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded owned-badge status-badge animate-pulse';
        badge.textContent = '보유중';
        card.style.position = 'relative';
        card.appendChild(badge);
        
        // 그레이스케일 효과
        const img = card.querySelector('img');
        if (img) {
            img.style.filter = 'grayscale(50%)';
        }
        
        // 신청 버튼 비활성화
        const applyBtn = card.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.textContent = '신청불가';
            applyBtn.className = 'apply-btn bg-gray-400 text-white px-4 py-2 rounded text-sm cursor-not-allowed';
            applyBtn.disabled = true;
        }
        
        console.log('📚 보유도서 표시됨:', matchType);
    }

    /**
     * 신청완료 배지 추가
     */
    addAppliedBadge(card) {
        const badge = document.createElement('div');
        badge.className = 'absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded applied-badge status-badge';
        badge.textContent = '신청완료';
        card.style.position = 'relative';
        card.appendChild(badge);
        
        // 신청 버튼 변경
        const applyBtn = card.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.textContent = '신청완료';
            applyBtn.className = 'apply-btn bg-green-500 text-white px-4 py-2 rounded text-sm cursor-not-allowed';
            applyBtn.disabled = true;
        }
        
        console.log('📚 신청완료 도서 표시됨');
    }

    /**
     * 초기 도서 로드 완료 후 보유도서 상태 확인
     */
    async loadInitialData() {
        try {
            await this.loadBooksByCategory('bestseller');
            
            // 초기 로드 완료 후 보유도서 상태 확인
            console.log('📚 초기 도서 로드 완료 후 보유도서 상태 확인 시작...');
            setTimeout(() => {
                this.updateBooksStatus();
            }, 500);
            
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
        }
    }

    /**
     * 학년 변경 처리
     */
    async handleGradeChange() {
        console.log('🔄 handleGradeChange 호출됨. 학년:', this.elements.grade.value);
        
        const grade = this.elements.grade.value;
        if (!grade) {
            this.elements.class.innerHTML = '<option value="">반 선택</option>';
            return;
        }
        
        try {
            console.log('📡 학급 정보 API 호출 시작...');
            const response = await fetch('/api/classes/settings');
            const allClassData = await response.json();
            
            console.log('📊 전체 학급 설정 데이터:', allClassData);
            
            // 선택된 학년의 반 목록 필터링
            const gradeClasses = allClassData.filter(cls => cls.grade === parseInt(grade));
            console.log('📋 찾은 반 목록:', gradeClasses);
            
            // 반 선택 옵션 업데이트
            this.elements.class.innerHTML = '<option value="">반 선택</option>';
            gradeClasses.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.class;
                option.textContent = `${cls.class}반`;
                this.elements.class.appendChild(option);
            });
            
            console.log(`✅ ${grade}학년 반 목록 로드 완료: ${gradeClasses.length}개`);
            
        } catch (error) {
            console.error('❌ 학급 정보 로드 오류:', error);
            // 기본 반 목록 생성 (1-6반)
            this.elements.class.innerHTML = '<option value="">반 선택</option>';
            for (let i = 1; i <= 6; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i}반`;
                this.elements.class.appendChild(option);
            }
        }
    }

    /**
     * 반 변경 처리
     */
    async handleClassChange() {
        console.log('🔄 handleClassChange 호출됨:', {
            grade: this.elements.grade.value,
            classNum: this.elements.class.value
        });
        
        const grade = this.elements.grade.value;
        const classNum = this.elements.class.value;
        
        if (!grade || !classNum) {
            console.log('📝 담임교사 입력 대기 중...');
            return;
        }
        
        try {
            // 해당 학급의 담임교사 정보 조회
            const response = await fetch('/api/classes/settings');
            const allClassData = await response.json();
            
            const classInfo = allClassData.find(cls => 
                cls.grade === parseInt(grade) && cls.class === parseInt(classNum)
            );
            
            if (classInfo && classInfo.teacher) {
                this.elements.teacher.value = classInfo.teacher;
                console.log(`📝 담임교사 자동 입력: ${classInfo.teacher}`);
            }
            
        } catch (error) {
            console.error('❌ 담임교사 정보 조회 오류:', error);
        }
    }

    /**
     * 학급 설정 처리
     */
    async handleSetClass() {
        console.log('🎯 확인 버튼 클릭됨');
        
        const grade = this.elements.grade.value;
        const classNum = this.elements.class.value;
        const teacher = this.elements.teacher.value.trim();
        
        if (!grade || !classNum || !teacher) {
            alert('학년, 반, 담임교사를 모두 입력해주세요.');
            return;
        }
        
        console.log('🎯 학급 설정 시도:', { grade, classNum, teacher });
        
        try {
            // 학급 정보 검증
            const response = await fetch('/api/classes/settings');
            const allClassData = await response.json();
            
            console.log('🔍 받은 학급 설정 데이터:', allClassData);
            
            const classInfo = allClassData.find(cls => 
                cls.grade === parseInt(grade) && cls.class === parseInt(classNum)
            );
            
            console.log('🔍 찾은 학급 데이터:', classInfo);
            
            if (!classInfo) {
                alert('존재하지 않는 학급입니다.');
                return;
            }
            
            if (classInfo.teacher !== teacher) {
                alert('담임교사 정보가 일치하지 않습니다.');
                return;
            }
            
            // 학급 정보 설정
            this.currentClass = {
                grade: parseInt(grade),
                class: parseInt(classNum),
                classId: `${grade}-${classNum}`,
                teacher: teacher
            };
            
            console.log('🏫 학급 정보 설정 완료:', this.currentClass);
            
            // 패스워드 인증
            await this.authenticateClass();
            
        } catch (error) {
            console.error('❌ 학급 설정 오류:', error);
            alert('학급 설정 중 오류가 발생했습니다.');
        }
    }

    /**
     * 학급 패스워드 인증
     */
    async authenticateClass() {
        const password = prompt(`${this.currentClass.grade}학년 ${this.currentClass.class}반의 패스워드를 입력해주세요:`);
        
        if (!password) {
            console.log('❌ 패스워드 입력 취소');
            return;
        }
        
        console.log('🔐 비밀번호 인증 시도:', this.currentClass.classId);
        
        try {
            // 서버 인증 시도
            const response = await fetch('/api/classes/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    classId: this.currentClass.classId,
                    password: password
                })
            });
            
            const result = await response.json();
            console.log('📡 인증 서버 응답:', result);
            
            if (result.success) {
                console.log('✅ 학급 인증 성공');
                await this.onAuthenticationSuccess();
            } else {
                alert('패스워드가 일치하지 않습니다.');
                console.log('❌ 학급 인증 실패:', result.message);
            }
            
        } catch (error) {
            console.log('❌ 서버 인증 실패, 클라이언트 인증 시도:', error.message);
            
            // 클라이언트 사이드 인증 (백업)
            const expectedPassword = `class${this.currentClass.grade}${this.currentClass.class}^^`;
            if (password === expectedPassword) {
                console.log('✅ 클라이언트 인증 성공');
                await this.onAuthenticationSuccess();
            } else {
                alert('패스워드가 일치하지 않습니다.');
                console.log('❌ 클라이언트 인증 실패');
            }
        }
    }

    /**
     * 인증 성공 처리
     */
    async onAuthenticationSuccess() {
        this.isAuthenticated = true;
        
        // 세션 인증 정보 저장 (1시간 유효)
        const authInfo = {
            classId: this.currentClass.classId,
            teacher: this.currentClass.teacher,
            expiry: Date.now() + (60 * 60 * 1000) // 1시간
        };
        
        sessionStorage.setItem('classAuth', JSON.stringify(authInfo));
        console.log('💾 세션 인증 정보 저장:', this.currentClass.classId);
        
        // UI 업데이트
        this.updateClassInfo();
        
        // 성공 메시지
        alert(`${this.currentClass.grade}학년 ${this.currentClass.class}반 인증이 완료되었습니다.`);
        
        // 인증 완료 후 보유도서 상태 업데이트
        console.log('📚 학급 인증 완료 후 보유도서 상태 업데이트 시작...');
        setTimeout(() => {
            this.updateBooksStatus();
        }, 500);
    }

    /**
     * 학급 정보 UI 업데이트
     */
    updateClassInfo() {
        if (this.elements.classInfo && this.currentClass) {
            this.elements.classInfo.innerHTML = `
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                ${this.currentClass.grade}학년 ${this.currentClass.class}반
                            </span>
                            <span class="ml-3 text-gray-600">담임: ${this.currentClass.teacher}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-blue-600 font-medium">예산 현황</div>
                            <div class="text-lg font-bold text-blue-800">0원 / 0원</div>
                        </div>
                    </div>
                </div>
            `;
            this.elements.classInfo.classList.remove('hidden');
        }
    }

    /**
     * 카테고리별 도서 로드
     */
    async loadBooksByCategory(category) {
        // 중복 로드 방지
        if (this.isLoadingBooks) {
            console.log('📚 이미 도서 로드 중, 건너뜀');
            return;
        }
        
        this.isLoadingBooks = true;
        
        try {
            console.log('🔍 API 요청: 카테고리=', category, ', 페이지=', this.currentPage, ', start=', ((this.currentPage - 1) * 50) + 1, ', maxResults=50');
            
            const response = await fetch(`/api/books/category/${category}?page=${this.currentPage}&maxResults=50`);
            const data = await response.json();
            
            if (data.success && data.books && data.books.length > 0) {
                if (this.currentPage === 1) {
                    // 첫 페이지: 기존 도서 목록 대체
                    this.currentBooks = data.books;
                    this.allBooks = [...data.books];
                    this.displayBooks(this.currentBooks);
                    console.log(`✅ 카테고리 "${category}" 첫 페이지 로드 완료: ${data.books.length}권`);
                } else {
                    // 추가 페이지: 기존 목록에 추가
                    this.currentBooks.push(...data.books);
                    this.allBooks.push(...data.books);
                    this.appendBooks(data.books);
                    console.log(`✅ 페이지 ${this.currentPage} 로드 완료: +${data.books.length}권 (총 ${this.currentBooks.length}권)`);
                }
                
                // 더보기 버튼 상태 업데이트
                this.hasMorePages = data.books.length === 50;
                this.updateLoadMoreButton();
                
                // 도서 상태 업데이트
                setTimeout(() => {
                    this.updateBooksStatus();
                }, 500);
                
            } else {
                console.log('❌ 도서 로드 실패 또는 빈 결과');
                if (this.currentPage === 1) {
                    this.showEmptyState();
                }
            }
            
        } catch (error) {
            console.error('❌ 도서 로드 오류:', error);
            if (this.currentPage === 1) {
                this.showEmptyState();
            }
        } finally {
            this.isLoadingBooks = false;
        }
    }

    /**
     * 더보기 처리
     */
    async handleLoadMore() {
        if (!this.hasMorePages || this.isLoadingBooks) {
            return;
        }
        
        console.log('📖 더보기 요청: 카테고리=', this.currentCategory, ', start=', (this.currentBooks.length + 1), ', 현재까지=', this.currentBooks.length, '권');
        
        this.currentPage++;
        await this.loadBooksByCategory(this.currentCategory);
    }

    /**
     * 도서 목록 표시
     */
    displayBooks(books) {
        if (!this.elements.booksGrid) return;
        
        this.elements.booksGrid.innerHTML = '';
        
        if (!books || books.length === 0) {
            this.showEmptyState();
            return;
        }
        
        console.log(`📚 도서 ${books.length}권 표시 중...`);
        
        books.forEach((book, index) => {
            const bookCard = this.createBookCard(book, index);
            this.elements.booksGrid.appendChild(bookCard);
        });
        
        // 총 도서 수 업데이트
        if (this.elements.totalBooks) {
            this.elements.totalBooks.textContent = books.length;
        }
        
        console.log('✅ 도서 카드 표시 완료');
    }

    /**
     * 도서 목록 추가
     */
    appendBooks(books) {
        if (!this.elements.booksGrid || !books || books.length === 0) return;
        
        books.forEach((book, index) => {
            const bookCard = this.createBookCard(book, this.currentBooks.length - books.length + index);
            this.elements.booksGrid.appendChild(bookCard);
        });
        
        // 총 도서 수 업데이트
        if (this.elements.totalBooks) {
            this.elements.totalBooks.textContent = this.currentBooks.length;
        }
    }

    /**
     * 도서 카드 생성
     */
    createBookCard(book, index) {
        const card = document.createElement('div');
        card.className = 'book-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer';
        card.setAttribute('data-isbn', book.isbn);
        
        // 🔥 onclick 이벤트 직접 설정 (가장 확실한 방법)
        card.onclick = () => {
            console.log('📖 도서 클릭 처리 (인라인 onclick):', book.isbn);
            this.showBookDetail(book);
        };
        
        // 가격 정보 처리 (할인 표시 제거)
        const price = parseInt(book.priceSales || book.priceStandard || 0);
        const priceDisplay = price > 0 ? this.formatPrice(price) : '가격 정보 없음';
        
        card.innerHTML = `
            <div class="relative">
                <img src="${book.cover}" alt="${book.title}" class="w-full h-48 object-cover">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <button class="apply-btn bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition w-full"
                            data-isbn="${book.isbn}"
                            onclick="event.stopPropagation(); window.bookApp.handleBookRequest(${JSON.stringify(book).replace(/"/g, '&quot;')})">
                        <i class="fas fa-plus mr-1"></i>신청하기
                    </button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-800 mb-2 line-clamp-2 text-sm leading-tight" title="${book.title}">
                    ${book.title}
                </h3>
                <p class="text-xs text-gray-600 mb-1 line-clamp-1" title="${book.author}">
                    ${book.author}
                </p>
                <p class="text-xs text-gray-500 mb-2 line-clamp-1" title="${book.publisher}">
                    ${book.publisher}
                </p>
                <div class="text-right">
                    <span class="text-sm font-bold text-gray-800">${priceDisplay}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * 검색 처리
     */
    async handleSearch(query) {
        if (!query || query.trim().length < 2) {
            console.log('🔍 검색어가 너무 짧음, 베스트셀러로 복귀');
            this.currentCategory = 'bestseller';
            this.currentPage = 1;
            await this.loadBooksByCategory('bestseller');
            return;
        }
        
        console.log('🔍 검색 API 요청: query=', JSON.stringify(query), ', 페이지=', this.currentPage, ', start=', ((this.currentPage - 1) * 50) + 1);
        
        try {
            const response = await fetch(`/api/books/search?query=${encodeURIComponent(query)}&page=${this.currentPage}&maxResults=50`);
            const data = await response.json();
            
            if (data.success && data.books && data.books.length > 0) {
                this.currentBooks = data.books;
                this.allBooks = [...data.books];
                this.displayBooks(this.currentBooks);
                
                console.log(`🔍 검색 완료: "${query}" - ${data.books.length}권 발견`);
                
                // 검색 결과에 대해서도 보유도서 상태 업데이트
                setTimeout(() => {
                    this.updateBooksStatus();
                }, 500);
                
            } else {
                console.log('❌ 검색 결과 없음');
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('❌ 검색 오류:', error);
            this.showEmptyState();
        }
    }

    /**
     * 도서 신청 처리 (전역 함수 인터페이스)
     */
    handleBookRequest(book) {
        console.log('📚 도서 신청 시작: ISBN=', book.isbn);
        
        if (!this.currentClass || !this.currentClass.classId) {
            alert('먼저 학급 정보를 설정해주세요.');
            return;
        }
        
        console.log('📖 신청할 도서 정보:', {
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            cover: book.cover,
            price: book.priceSales || book.priceStandard
        });
        
        // 보유도서 확인
        if (this.isBookOwned(book)) {
            alert('이미 학교에서 보유하고 있는 도서입니다.');
            return;
        }
        
        // 중복 신청 확인
        if (this.appliedBooks.has(book.isbn)) {
            alert('이미 신청한 도서입니다.');
            return;
        }
        
        // 신청 확인
        if (!confirm(`"${book.title}"을(를) 신청하시겠습니까?`)) {
            return;
        }
        
        // 서버 API 호출
        this.submitBookApplicationServerSide(book)
            .catch(error => {
                console.log('서버 API 실패, 클라이언트 사이드 처리:', error.message);
                return this.submitBookApplicationClientSide(book);
            })
            .then(result => {
                if (result) {
                    // 신청 완료 처리
                    this.appliedBooks.add(book.isbn);
                    
                    // UI 업데이트
                    this.updateBookStatus(book.isbn, 'applied');
                    
                    // 성공 메시지
                    alert(`"${book.title}" 신청이 완료되었습니다.`);
                    console.log('✅ 도서 신청 완료:', book.title);
                }
            });
    }

    /**
     * 서버 사이드 도서 신청
     */
    async submitBookApplicationServerSide(book) {
        const response = await fetch('/api/books/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                classId: this.currentClass.classId,
                isbn: book.isbn,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                price: book.priceSales || book.priceStandard,
                cover: book.cover
            })
        });
        
        if (!response.ok) {
            throw new Error('서버 API 호출 실패');
        }
        
        return await response.json();
    }

    /**
     * 클라이언트 사이드 도서 신청 (백업)
     */
    async submitBookApplicationClientSide(book) {
        console.log('서버 API 실패, 클라이언트 사이드 처리:', 'Error: 서버 API 호출 실패');
        
        try {
            const requestData = {
                id: Date.now().toString(),
                classId: this.currentClass.classId,
                isbn: book.isbn,
                title: book.title,
                author: book.author,
                publisher: book.publisher,
                price: book.priceSales || book.priceStandard,
                cover: book.cover,
                requestDate: new Date().toISOString()
            };
            
            // 로컬스토리지에 저장
            const requests = JSON.parse(localStorage.getItem('bookRequests') || '[]');
            requests.push(requestData);
            localStorage.setItem('bookRequests', JSON.stringify(requests));
            
            console.log('📝 클라이언트 사이드 도서 신청 저장:', requestData);
            
            return requestData;
            
        } catch (error) {
            console.error('❌ 클라이언트 사이드 신청 저장 오류:', error);
            throw error;
        }
    }

    /**
     * 카테고리 이벤트 설정
     */
    setupCategoryEvents() {
        // 구현 필요
    }

    /**
     * 정렬 변경 처리
     */
    handleSortChange() {
        // 구현 필요
    }

    /**
     * 더보기 버튼 업데이트
     */
    updateLoadMoreButton() {
        if (!this.elements.loadMoreBtn) return;
        
        if (this.hasMorePages && this.currentBooks.length < 200) {
            this.elements.loadMoreBtn.classList.remove('hidden');
            this.elements.loadMoreBtn.disabled = false;
            this.elements.loadMoreBtn.textContent = `더 많은 도서 보기 (${this.currentBooks.length}권 표시됨)`;
        } else {
            this.elements.loadMoreBtn.classList.add('hidden');
        }
    }

    /**
     * 빈 상태 표시
     */
    showEmptyState() {
        if (this.elements.booksGrid) {
            this.elements.booksGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-book-open text-4xl mb-2"></i>
                    <p>검색 결과가 없습니다.</p>
                    <p class="text-sm">다른 검색어를 시도해보세요.</p>
                </div>
            `;
        }
        
        if (this.elements.totalBooks) {
            this.elements.totalBooks.textContent = '0';
        }
    }

    /**
     * 가격 포맷팅
     */
    formatPrice(price) {
        if (!price || price === 0) return '가격 정보 없음';
        return parseInt(price).toLocaleString() + '원';
    }

    /**
     * 디바운스된 검색
     */
    debouncedSearch = this.debounce((query) => {
        this.handleSearch(query);
    }, 500);

    /**
     * 디바운스 유틸리티
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// 🔥 DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, BookRequestApp 초기화 시작...');
    
    // 🎨 보유도서 표시 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .book-card {
            position: relative;
        }
        .owned-badge {
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .applied-badge {
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: .5;
            }
        }
        .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
    console.log('🎨 보유도서 표시 스타일 추가 완료');
    
    // 전역 인스턴스 생성
    window.bookApp = new BookRequestApp();
    console.log('✅ BookRequestApp 초기화 완료!');
});