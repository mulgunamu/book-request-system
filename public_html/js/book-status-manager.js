/**
 * 보유도서 상태 관리자
 * public_html/js/book-status-manager.js로 저장하세요
 */

class BookStatusManager {
    constructor() {
        this.ownedBooksMap = new Map(); // ISBN을 키로 하는 해시맵 (O(1) 검색)
        this.isLoaded = false;
        this.loading = false;
    }

    /**
     * 보유도서 목록 로드
     */
    async loadOwnedBooks() {
        if (this.loading || this.isLoaded) return;
        
        this.loading = true;
        try {
            console.log('📚 보유도서 목록 로드 시작...');
            
            // 기존 API 엔드포인트 사용
            const response = await fetch('/api/books/owned-books');
            
            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status}`);
            }
            
            const ownedBooks = await response.json();
            console.log(`✅ 보유도서 ${ownedBooks.length}권 로드 완료`);
            
            // 해시맵으로 변환 (빠른 검색을 위해)
            this.ownedBooksMap.clear();
            
            ownedBooks.forEach(book => {
                if (book.isbn) {
                    // ISBN으로 매핑
                    this.ownedBooksMap.set(book.isbn, {
                        title: book.title,
                        author: book.author,
                        regNo: book.regNo,
                        addedAt: book.addedAt
                    });
                }
                
                // 제목+저자 조합으로도 매핑 (ISBN이 없는 경우 대비)
                if (book.title) {
                    const titleKey = this.normalizeText(book.title);
                    this.ownedBooksMap.set(titleKey, book);
                }
            });
            
            this.isLoaded = true;
            console.log(`📊 해시맵 생성 완료: ${this.ownedBooksMap.size}개 키`);
            
        } catch (error) {
            console.error('❌ 보유도서 로드 실패:', error);
            this.isLoaded = false;
        } finally {
            this.loading = false;
        }
    }

    /**
     * 텍스트 정규화 (검색 정확도 향상)
     */
    normalizeText(text) {
        if (!text) return '';
        return text
            .replace(/[^\w가-힣]/g, '') // 특수문자 제거
            .toLowerCase()
            .trim();
    }

    /**
     * 도서 보유 여부 확인 (ISBN 우선)
     */
    isBookOwned(book) {
        if (!this.isLoaded) return false;
        
        const { isbn13, isbn, title, author } = book;
        
        // 1순위: ISBN13으로 확인
        if (isbn13 && this.ownedBooksMap.has(isbn13)) {
            return true;
        }
        
        // 2순위: ISBN으로 확인
        if (isbn && this.ownedBooksMap.has(isbn)) {
            return true;
        }
        
        // 3순위: 제목으로 확인 (정규화)
        if (title) {
            const titleKey = this.normalizeText(title);
            if (this.ownedBooksMap.has(titleKey)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 도서 목록에 보유 상태 적용
     */
    updateBookStatus(books) {
        if (!Array.isArray(books)) return books;
        
        return books.map(book => {
            const isOwned = this.isBookOwned(book);
            
            return {
                ...book,
                isOwned,
                canApply: !isOwned && !book.isApplied, // 보유중이거나 이미 신청한 경우 신청 불가
                statusText: isOwned ? '신청불가' : (book.isApplied ? '신청완료' : '신청하기'),
                statusClass: isOwned ? 'owned' : (book.isApplied ? 'applied' : 'available'),
                disabledReason: isOwned ? '학교 도서관에서 이미 보유중인 도서입니다' : null
            };
        });
    }

    /**
     * 통계 정보 반환
     */
    getStats() {
        return {
            totalOwnedBooks: this.ownedBooksMap.size,
            isLoaded: this.isLoaded,
            loading: this.loading
        };
    }

    /**
     * 특정 도서의 보유 정보 상세 조회
     */
    getOwnedBookInfo(book) {
        const { isbn13, isbn, title } = book;
        
        if (isbn13 && this.ownedBooksMap.has(isbn13)) {
            return this.ownedBooksMap.get(isbn13);
        }
        
        if (isbn && this.ownedBooksMap.has(isbn)) {
            return this.ownedBooksMap.get(isbn);
        }
        
        if (title) {
            const titleKey = this.normalizeText(title);
            if (this.ownedBooksMap.has(titleKey)) {
                return this.ownedBooksMap.get(titleKey);
            }
        }
        
        return null;
    }

    /**
     * 캐시 초기화 (관리자가 보유도서 목록을 업데이트한 경우)
     */
    refresh() {
        this.ownedBooksMap.clear();
        this.isLoaded = false;
        this.loading = false;
        return this.loadOwnedBooks();
    }
}

// 전역 인스턴스 생성
window.bookStatusManager = new BookStatusManager();

console.log('📚 BookStatusManager 초기화 완료');