/**
 * 관리자 금지도서 필터 관리자
 * 관리자 페이지에서 금지도서 필터를 관리하는 클래스
 */

class AdminBanFilterManager {
    constructor() {
        this.elements = {};
        this.currentTab = 'keywords';
        this.isInitialized = false;
        
        // DOM 로드 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * 초기화
     */
    async init() {
        try {
            this.bindElements();
            this.bindEvents();
            await this.waitForBanFilterManager();
            await this.loadBanFilterUI();
            this.isInitialized = true;
            console.log('✅ 관리자 금지도서 필터 초기화 완료');
        } catch (error) {
            console.error('❌ 관리자 금지도서 필터 초기화 오류:', error);
        }
    }

    /**
     * BanFilterManager 로드 대기
     */
    async waitForBanFilterManager() {
        let attempts = 0;
        const maxAttempts = 50; // 5초 대기

        while (!window.banFilterManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.banFilterManager) {
            throw new Error('BanFilterManager를 찾을 수 없습니다.');
        }

        // BanFilterManager 초기화 대기
        attempts = 0;
        while (!window.banFilterManager.isInitialized && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    /**
     * DOM 요소 바인딩
     */
    bindElements() {
        this.elements = {
            // 탭 관련
            tabButtons: document.querySelectorAll('[data-ban-tab]'),
            tabContents: document.querySelectorAll('.ban-tab-content'),
            
            // 통계 정보
            banFilterStats: document.getElementById('banFilterStats'),
            
            // 키워드 관리
            bannedKeywordsList: document.getElementById('bannedKeywordsList'),
            addKeywordInput: document.getElementById('addKeywordInput'),
            addKeywordBtn: document.getElementById('addKeywordBtn'),
            bulkKeywordsTextarea: document.getElementById('bulkKeywordsTextarea'),
            bulkAddKeywordsBtn: document.getElementById('bulkAddKeywordsBtn'),
            
            // 도서 관리
            bannedBooksList: document.getElementById('bannedBooksList'),
            addBannedIsbnInput: document.getElementById('addBannedIsbnInput'),
            addBannedBookBtn: document.getElementById('addBannedBookBtn'),
            
            // 저자 관리
            bannedAuthorsList: document.getElementById('bannedAuthorsList'),
            addAuthorInput: document.getElementById('addAuthorInput'),
            addAuthorBtn: document.getElementById('addAuthorBtn'),
            
            // 출판사 관리
            bannedPublishersList: document.getElementById('bannedPublishersList'),
            addPublisherInput: document.getElementById('addPublisherInput'),
            addPublisherBtn: document.getElementById('addPublisherBtn'),
            
            // 필터 설정
            enableBanFilter: document.getElementById('enableBanFilter'),
            resetBanListBtn: document.getElementById('resetBanListBtn'),
            
            // 데이터 관리
            exportBanListBtn: document.getElementById('exportBanListBtn'),
            importBanListInput: document.getElementById('importBanListInput'),
            importBanListBtn: document.getElementById('importBanListBtn'),
            
            // 테스트
            testBookInput: document.getElementById('testBookInput'),
            testBookBtn: document.getElementById('testBookBtn'),
            testResult: document.getElementById('testResult')
        };
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 탭 전환
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.banTab);
            });
        });

        // 키워드 관리
        if (this.elements.addKeywordBtn) {
            this.elements.addKeywordBtn.addEventListener('click', () => {
                this.addBannedKeyword();
            });
        }

        if (this.elements.addKeywordInput) {
            this.elements.addKeywordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addBannedKeyword();
                }
            });
        }

        if (this.elements.bulkAddKeywordsBtn) {
            this.elements.bulkAddKeywordsBtn.addEventListener('click', () => {
                this.bulkAddKeywords();
            });
        }

        // 도서 ISBN 관리
        if (this.elements.addBannedBookBtn) {
            this.elements.addBannedBookBtn.addEventListener('click', () => {
                this.addBannedBook();
            });
        }

        if (this.elements.addBannedIsbnInput) {
            this.elements.addBannedIsbnInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addBannedBook();
                }
            });
        }

        // 저자 관리
        if (this.elements.addAuthorBtn) {
            this.elements.addAuthorBtn.addEventListener('click', () => {
                this.addBannedAuthor();
            });
        }

        if (this.elements.addAuthorInput) {
            this.elements.addAuthorInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addBannedAuthor();
                }
            });
        }

        // 출판사 관리
        if (this.elements.addPublisherBtn) {
            this.elements.addPublisherBtn.addEventListener('click', () => {
                this.addBannedPublisher();
            });
        }

        if (this.elements.addPublisherInput) {
            this.elements.addPublisherInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addBannedPublisher();
                }
            });
        }

        // 필터 설정
        if (this.elements.enableBanFilter) {
            this.elements.enableBanFilter.addEventListener('change', (e) => {
                this.toggleBanFilter(e.target.checked);
            });
        }

        // 목록 초기화
        if (this.elements.resetBanListBtn) {
            this.elements.resetBanListBtn.addEventListener('click', () => {
                this.resetBanList();
            });
        }

        // 내보내기/가져오기
        if (this.elements.exportBanListBtn) {
            this.elements.exportBanListBtn.addEventListener('click', () => {
                this.exportBanList();
            });
        }

        if (this.elements.importBanListBtn) {
            this.elements.importBanListBtn.addEventListener('click', () => {
                this.importBanList();
            });
        }

        // 테스트
        if (this.elements.testBookBtn) {
            this.elements.testBookBtn.addEventListener('click', () => {
                this.testBookFilter();
            });
        }

        if (this.elements.testBookInput) {
            this.elements.testBookInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.testBookFilter();
                }
            });
        }
    }

    /**
     * 탭 전환
     */
    switchTab(tabName) {
        this.currentTab = tabName;

        // 탭 버튼 상태 업데이트
        this.elements.tabButtons.forEach(btn => {
            if (btn.dataset.banTab === tabName) {
                btn.classList.add('bg-blue-600', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });

        // 탭 콘텐츠 표시/숨김
        this.elements.tabContents.forEach(content => {
            if (content.id === `ban-${tabName}-tab`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        // 해당 탭 내용 로드
        this.loadTabContent(tabName);
    }

    /**
     * 탭 내용 로드
     */
    loadTabContent(tabName) {
        switch (tabName) {
            case 'keywords':
                this.renderBannedKeywords();
                break;
            case 'books':
                this.renderBannedBooks();
                break;
            case 'authors':
                this.renderBannedAuthors();
                break;
            case 'publishers':
                this.renderBannedPublishers();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'test':
                this.loadTestTab();
                break;
        }
    }

    /**
     * 금지 필터 UI 로드
     */
    async loadBanFilterUI() {
        try {
            this.updateStatistics();
            this.switchTab('keywords'); // 기본 탭으로 키워드 선택
            console.log('✅ 금지 필터 UI 로드 완료');
        } catch (error) {
            console.error('❌ 금지 필터 UI 로드 오류:', error);
            this.showError('금지 필터 설정을 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 통계 정보 업데이트
     */
    updateStatistics() {
        if (!window.banFilterManager || !this.elements.banFilterStats) return;

        const stats = window.banFilterManager.getStatistics();
        
        this.elements.banFilterStats.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${stats.bannedKeywordsCount}</div>
                    <div class="text-sm text-gray-600">금지 키워드</div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">${stats.bannedBooksCount}</div>
                    <div class="text-sm text-gray-600">금지 도서</div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-600">${stats.bannedAuthorsCount}</div>
                    <div class="text-sm text-gray-600">금지 저자</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">${stats.bannedPublishersCount}</div>
                    <div class="text-sm text-gray-600">금지 출판사</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold ${stats.isEnabled ? 'text-green-600' : 'text-red-600'}">
                        ${stats.isEnabled ? '활성' : '비활성'}
                    </div>
                    <div class="text-sm text-gray-600">필터 상태</div>
                </div>
            </div>
        `;
    }

    /**
     * 금지 키워드 목록 렌더링
     */
    renderBannedKeywords() {
        if (!window.banFilterManager || !this.elements.bannedKeywordsList) return;

        const keywords = window.banFilterManager.bannedKeywords;
        
        if (keywords.length === 0) {
            this.elements.bannedKeywordsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>등록된 금지 키워드가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.elements.bannedKeywordsList.innerHTML = keywords.map(keyword => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-900">${this.escapeHtml(keyword)}</span>
                <button onclick="adminBanFilterManager.removeBannedKeyword('${this.escapeHtml(keyword)}')" 
                        class="text-red-500 hover:text-red-700 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * 금지 도서 목록 렌더링
     */
    renderBannedBooks() {
        if (!window.banFilterManager || !this.elements.bannedBooksList) return;

        const books = window.banFilterManager.bannedBooks;
        
        if (books.length === 0) {
            this.elements.bannedBooksList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>등록된 금지 도서가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.elements.bannedBooksList.innerHTML = books.map(isbn => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-mono text-gray-900">${this.escapeHtml(isbn)}</span>
                <button onclick="adminBanFilterManager.removeBannedBook('${this.escapeHtml(isbn)}')" 
                        class="text-red-500 hover:text-red-700 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * 금지 저자 목록 렌더링
     */
    renderBannedAuthors() {
        if (!window.banFilterManager || !this.elements.bannedAuthorsList) return;

        const authors = window.banFilterManager.bannedAuthors;
        
        if (authors.length === 0) {
            this.elements.bannedAuthorsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>등록된 금지 저자가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.elements.bannedAuthorsList.innerHTML = authors.map(author => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-900">${this.escapeHtml(author)}</span>
                <button onclick="adminBanFilterManager.removeBannedAuthor('${this.escapeHtml(author)}')" 
                        class="text-red-500 hover:text-red-700 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * 금지 출판사 목록 렌더링
     */
    renderBannedPublishers() {
        if (!window.banFilterManager || !this.elements.bannedPublishersList) return;

        const publishers = window.banFilterManager.bannedPublishers;
        
        if (publishers.length === 0) {
            this.elements.bannedPublishersList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>등록된 금지 출판사가 없습니다.</p>
                </div>
            `;
            return;
        }

        this.elements.bannedPublishersList.innerHTML = publishers.map(publisher => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-900">${this.escapeHtml(publisher)}</span>
                <button onclick="adminBanFilterManager.removeBannedPublisher('${this.escapeHtml(publisher)}')" 
                        class="text-red-500 hover:text-red-700 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * 설정 탭 로드
     */
    loadSettings() {
        if (!window.banFilterManager || !this.elements.enableBanFilter) return;

        this.elements.enableBanFilter.checked = window.banFilterManager.isFilterEnabled();
    }

    /**
     * 테스트 탭 로드
     */
    loadTestTab() {
        if (this.elements.testResult) {
            this.elements.testResult.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>도서 제목을 입력하고 테스트해보세요.</p>
                </div>
            `;
        }
    }

    /**
     * 금지 키워드 추가
     */
    addBannedKeyword() {
        if (!window.banFilterManager || !this.elements.addKeywordInput) return;

        const keyword = this.elements.addKeywordInput.value.trim();
        if (!keyword) {
            this.showError('키워드를 입력해주세요.');
            return;
        }

        if (window.banFilterManager.addBannedKeyword(keyword)) {
            this.elements.addKeywordInput.value = '';
            this.renderBannedKeywords();
            this.updateStatistics();
            this.showSuccess(`'${keyword}' 키워드가 추가되었습니다.`);
        } else {
            this.showError('이미 등록된 키워드이거나 추가할 수 없습니다.');
        }
    }

    /**
     * 금지 키워드 제거
     */
    removeBannedKeyword(keyword) {
        if (!window.banFilterManager) return;

        if (confirm(`'${keyword}' 키워드를 삭제하시겠습니까?`)) {
            if (window.banFilterManager.removeBannedKeyword(keyword)) {
                this.renderBannedKeywords();
                this.updateStatistics();
                this.showSuccess(`'${keyword}' 키워드가 삭제되었습니다.`);
            } else {
                this.showError('키워드 삭제에 실패했습니다.');
            }
        }
    }

    /**
     * 대량 키워드 추가
     */
    bulkAddKeywords() {
        if (!window.banFilterManager || !this.elements.bulkKeywordsTextarea) return;

        const text = this.elements.bulkKeywordsTextarea.value.trim();
        if (!text) {
            this.showError('키워드를 입력해주세요.');
            return;
        }

        const keywords = text.split('\n')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);

        let addedCount = 0;
        keywords.forEach(keyword => {
            if (window.banFilterManager.addBannedKeyword(keyword)) {
                addedCount++;
            }
        });

        this.elements.bulkKeywordsTextarea.value = '';
        this.renderBannedKeywords();
        this.updateStatistics();
        
        if (addedCount > 0) {
            this.showSuccess(`${addedCount}개의 키워드가 추가되었습니다.`);
        } else {
            this.showError('추가된 키워드가 없습니다. (중복 키워드는 제외됩니다)');
        }
    }

    /**
     * 금지 도서 추가
     */
    addBannedBook() {
        if (!window.banFilterManager || !this.elements.addBannedIsbnInput) return;

        const isbn = this.elements.addBannedIsbnInput.value.trim();
        if (!isbn) {
            this.showError('ISBN을 입력해주세요.');
            return;
        }

        if (window.banFilterManager.addBannedBook(isbn)) {
            this.elements.addBannedIsbnInput.value = '';
            this.renderBannedBooks();
            this.updateStatistics();
            this.showSuccess(`ISBN '${isbn}' 도서가 금지 목록에 추가되었습니다.`);
        } else {
            this.showError('이미 등록된 ISBN이거나 추가할 수 없습니다.');
        }
    }

    /**
     * 금지 도서 제거
     */
    removeBannedBook(isbn) {
        if (!window.banFilterManager) return;

        if (confirm(`ISBN '${isbn}' 도서를 금지 목록에서 제거하시겠습니까?`)) {
            if (window.banFilterManager.removeBannedBook(isbn)) {
                this.renderBannedBooks();
                this.updateStatistics();
                this.showSuccess(`ISBN '${isbn}' 도서가 금지 목록에서 제거되었습니다.`);
            } else {
                this.showError('도서 제거에 실패했습니다.');
            }
        }
    }

    /**
     * 금지 저자 추가
     */
    addBannedAuthor() {
        if (!window.banFilterManager || !this.elements.addAuthorInput) return;

        const author = this.elements.addAuthorInput.value.trim();
        if (!author) {
            this.showError('저자명을 입력해주세요.');
            return;
        }

        if (window.banFilterManager.addBannedAuthor(author)) {
            this.elements.addAuthorInput.value = '';
            this.renderBannedAuthors();
            this.updateStatistics();
            this.showSuccess(`'${author}' 저자가 금지 목록에 추가되었습니다.`);
        } else {
            this.showError('이미 등록된 저자이거나 추가할 수 없습니다.');
        }
    }

    /**
     * 금지 저자 제거
     */
    removeBannedAuthor(author) {
        if (!window.banFilterManager) return;

        if (confirm(`'${author}' 저자를 금지 목록에서 제거하시겠습니까?`)) {
            if (window.banFilterManager.removeBannedAuthor(author)) {
                this.renderBannedAuthors();
                this.updateStatistics();
                this.showSuccess(`'${author}' 저자가 금지 목록에서 제거되었습니다.`);
            } else {
                this.showError('저자 제거에 실패했습니다.');
            }
        }
    }

    /**
     * 금지 출판사 추가
     */
    addBannedPublisher() {
        if (!window.banFilterManager || !this.elements.addPublisherInput) return;

        const publisher = this.elements.addPublisherInput.value.trim();
        if (!publisher) {
            this.showError('출판사명을 입력해주세요.');
            return;
        }

        if (window.banFilterManager.addBannedPublisher(publisher)) {
            this.elements.addPublisherInput.value = '';
            this.renderBannedPublishers();
            this.updateStatistics();
            this.showSuccess(`'${publisher}' 출판사가 금지 목록에 추가되었습니다.`);
        } else {
            this.showError('이미 등록된 출판사이거나 추가할 수 없습니다.');
        }
    }

    /**
     * 금지 출판사 제거
     */
    removeBannedPublisher(publisher) {
        if (!window.banFilterManager) return;

        if (confirm(`'${publisher}' 출판사를 금지 목록에서 제거하시겠습니까?`)) {
            if (window.banFilterManager.removeBannedPublisher(publisher)) {
                this.renderBannedPublishers();
                this.updateStatistics();
                this.showSuccess(`'${publisher}' 출판사가 금지 목록에서 제거되었습니다.`);
            } else {
                this.showError('출판사 제거에 실패했습니다.');
            }
        }
    }

    /**
     * 필터 활성화/비활성화
     */
    toggleBanFilter(enabled) {
        if (!window.banFilterManager) return;

        window.banFilterManager.setFilterEnabled(enabled);
        this.updateStatistics();
        
        this.showSuccess(`금지도서 필터가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
    }

    /**
     * 금지 목록 초기화
     */
    resetBanList() {
        if (!window.banFilterManager) return;

        if (confirm('모든 금지 목록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            window.banFilterManager.resetBanList();
            this.loadBanFilterUI();
            this.showSuccess('금지 목록이 초기화되었습니다.');
        }
    }

    /**
     * 금지 목록 내보내기
     */
    exportBanList() {
        if (!window.banFilterManager) return;

        try {
            const data = window.banFilterManager.exportSettings();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `banned-books-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('금지 목록이 내보내기되었습니다.');
        } catch (error) {
            console.error('내보내기 오류:', error);
            this.showError('내보내기 중 오류가 발생했습니다.');
        }
    }

    /**
     * 금지 목록 가져오기
     */
    importBanList() {
        if (!this.elements.importBanListInput) return;

        const file = this.elements.importBanListInput.files[0];
        if (!file) {
            this.showError('파일을 선택해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (window.banFilterManager.importSettings(data)) {
                    this.loadBanFilterUI();
                    this.showSuccess('금지 목록이 가져오기되었습니다.');
                } else {
                    this.showError('설정 가져오기에 실패했습니다.');
                }
                
                this.elements.importBanListInput.value = '';
            } catch (error) {
                console.error('가져오기 오류:', error);
                this.showError('파일 형식이 올바르지 않습니다.');
            }
        };
        reader.readAsText(file);
    }

    /**
     * 도서 필터 테스트
     */
    testBookFilter() {
        if (!window.banFilterManager || !this.elements.testBookInput || !this.elements.testResult) return;

        const title = this.elements.testBookInput.value.trim();
        if (!title) {
            this.showError('도서 제목을 입력해주세요.');
            return;
        }

        const testBook = {
            title: title,
            author: '테스트 저자',
            publisher: '테스트 출판사',
            isbn: '1234567890123'
        };

        const banCheck = window.banFilterManager.isBookBanned(testBook);
        
        this.elements.testResult.innerHTML = `
            <div class="p-4 rounded-lg ${banCheck.isBanned ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}">
                <div class="flex items-center mb-2">
                    <i class="fas ${banCheck.isBanned ? 'fa-ban text-red-500' : 'fa-check-circle text-green-500'} mr-2"></i>
                    <span class="font-medium ${banCheck.isBanned ? 'text-red-700' : 'text-green-700'}">
                        ${banCheck.isBanned ? '금지된 도서' : '허용된 도서'}
                    </span>
                </div>
                <div class="text-sm ${banCheck.isBanned ? 'text-red-600' : 'text-green-600'}">
                    도서명: "${this.escapeHtml(title)}"
                </div>
                ${banCheck.isBanned ? `
                    <div class="text-sm text-red-600 mt-1">
                        사유: ${this.escapeHtml(banCheck.reason)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        if (window.Toast) {
            window.Toast.show('성공', message, 'success');
        } else if (typeof showToast === 'function') {
            showToast('성공', message, 'success');
        } else {
            alert('성공: ' + message);
        }
    }

    /**
     * 오류 메시지 표시
     */
    showError(message) {
        if (window.Toast) {
            window.Toast.show('오류', message, 'error');
        } else if (typeof showToast === 'function') {
            showToast('오류', message, 'error');
        } else {
            alert('오류: ' + message);
        }
    }
}

// 전역 인스턴스 생성
const adminBanFilterManager = new AdminBanFilterManager();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.adminBanFilterManager = adminBanFilterManager;