/**
 * book-service.js
 * 도서 관련 비즈니스 로직을 처리하는 서비스 모듈 (알라딘 API 기반)
 */

const BookService = (() => {
    // 현재 선택된 학급 정보
    let currentClassInfo = null;
    
    // 캐시된 데이터
    let cachedBooks = null;
    let cachedExistingBooks = null;
    let lastCacheTime = null;
    
    const CACHE_DURATION = 5 * 60 * 1000; // 5분

    /**
     * 캐시가 유효한지 확인
     * @returns {boolean} - 캐시 유효성
     */
    const isCacheValid = () => {
        return lastCacheTime && (Date.now() - lastCacheTime) < CACHE_DURATION;
    };

    /**
     * 도서 데이터 검증
     * @param {object} book - 도서 정보
     * @returns {boolean} - 유효성
     */
    const validateBookData = (book) => {
        if (!book || typeof book !== 'object') {
            throw new Error('유효하지 않은 도서 정보입니다.');
        }
        
        if (!book.title || book.title.trim().length === 0) {
            throw new Error('도서 제목이 필요합니다.');
        }
        
        if (!book.author || book.author.trim().length === 0) {
            throw new Error('저자 정보가 필요합니다.');
        }
        
        if (book.price && (isNaN(book.price) || book.price < 0)) {
            throw new Error('유효한 가격을 입력해주세요.');
        }
        
        return true;
    };

    /**
     * 학급 정보 검증
     * @param {object} classInfo - 학급 정보
     * @returns {boolean} - 유효성
     */
    const validateClassInfo = (classInfo) => {
        if (!classInfo || typeof classInfo !== 'object') {
            throw new Error('학급 정보가 필요합니다.');
        }
        
        if (!classInfo.grade || !Config.isValidGrade(classInfo.grade)) {
            throw new Error('유효한 학년을 선택해주세요.');
        }
        
        if (!classInfo.classNumber || !Config.isValidClass(classInfo.classNumber)) {
            throw new Error('유효한 반을 선택해주세요.');
        }
        
        if (!classInfo.teacher || classInfo.teacher.trim().length === 0) {
            throw new Error('담임교사 이름을 입력해주세요.');
        }
        
        return true;
    };

    /**
     * 도서 신청 데이터 생성
     * @param {object} book - 알라딘 API 도서 정보
     * @param {object} classInfo - 학급 정보
     * @returns {object} - 신청용 도서 데이터
     */
    const createBookRequestData = (book, classInfo) => {
        return {
            // 기본 도서 정보
            id: book.id || `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: book.title,
            author: book.author,
            authors: book.authors || [book.author],
            publisher: book.publisher,
            price: book.salePrice || book.price || 0,
            originalPrice: book.price || 0,
            isbn: book.isbn,
            isbn13: book.isbn13,
            thumbnail: book.thumbnail,
            description: book.description,
            url: book.url,
            
            // 신청 정보
            gradeClass: `${classInfo.grade}-${classInfo.classNumber}`,
            grade: classInfo.grade,
            classNumber: classInfo.classNumber,
            teacher: classInfo.teacher,
            
            // 메타데이터
            requestDate: new Date().toISOString(),
            requestTimestamp: Date.now(),
            source: book.source || 'aladin',
            
            // 상태 정보
            status: 'pending', // pending, approved, rejected
            isDuplicate: false,
            duplicateInfo: null
        };
    };

    return {
        // ===== 학급 관리 =====
        
        /**
         * 현재 학급 정보 설정
         * @param {object} classInfo - 학급 정보
         */
        setCurrentClass: (classInfo) => {
            validateClassInfo(classInfo);
            currentClassInfo = classInfo;
            
            // 로컬 스토리지에 저장
            localStorage.setItem(Config.getStorageKeys().SELECTED_CLASS, JSON.stringify(classInfo));
        },
        
        /**
         * 현재 학급 정보 조회
         * @returns {object|null} - 현재 학급 정보
         */
        getCurrentClass: () => {
            if (!currentClassInfo) {
                // 로컬 스토리지에서 복원 시도
                try {
                    const saved = localStorage.getItem(Config.getStorageKeys().SELECTED_CLASS);
                    if (saved) {
                        currentClassInfo = JSON.parse(saved);
                    }
                } catch (error) {
                    console.error('학급 정보 복원 실패:', error);
                }
            }
            return currentClassInfo;
        },
        
        /**
         * 학급 선택 여부 확인
         * @returns {boolean} - 학급 선택 여부
         */
        hasSelectedClass: () => {
            return !!BookService.getCurrentClass();
        },
        
        /**
         * 학급 정보 초기화
         */
        clearCurrentClass: () => {
            currentClassInfo = null;
            localStorage.removeItem(Config.getStorageKeys().SELECTED_CLASS);
        },
        
        // ===== 도서 검색 =====
        
        /**
         * 도서 검색
         * @param {string} query - 검색어
         * @param {object} options - 검색 옵션
         * @returns {Promise} - 검색 결과
         */
        searchBooks: async (query, options = {}) => {
            try {
                if (!query || query.trim().length < Config.getSystemConfig().SEARCH.MIN_QUERY_LENGTH) {
                    throw new Error('검색어는 2글자 이상 입력해주세요.');
                }

                const searchParams = {
                    query: query.trim(),
                    page: options.page || 1,
                    size: options.size || Config.getPaginationConfig().BOOKS_PER_PAGE,
                    sort: options.sort || 'accuracy'
                };

                console.log('📚 도서 검색 요청:', searchParams);

                // 알라딘 API 호출
                result = await AladinAPI.searchBooks(searchParams);

                if (!result || !result.books) {
                    throw new Error('검색 결과를 가져올 수 없습니다.');
                }

                console.log('✅ 도서 검색 완료:', result.books.length + '권');
                return result;
            } catch (error) {
                console.error('도서 검색 오류:', error);
                throw error;
            }
        },
        
        /**
         * 카테고리별 도서 조회
         * @param {string} categoryId - 카테고리 ID
         * @param {number} page - 페이지 번호
         * @param {number} size - 페이지 크기
         * @returns {Promise} - 도서 목록
         */
        getBooksByCategory: async (categoryId, page = 1, size = 20) => {
            try {
                console.log('📂 카테고리별 도서 조회:', categoryId);
                
                // 알라딘 API 호출
                return await AladinAPI.searchByCategory(categoryId, page, size);
            } catch (error) {
                console.error('카테고리별 도서 조회 오류:', error);
                throw error;
            }
        },
        
        /**
         * 인기 도서 조회
         * @param {number} page - 페이지 번호
         * @param {number} size - 페이지 크기
         * @returns {Promise} - 인기 도서 목록
         */
        getPopularBooks: async (page = 1, size = 20) => {
            try {
                console.log('⭐ 인기 도서 조회');
                
                // 알라딘 API 호출
                return await AladinAPI.getPopularBooks(page, size);
            } catch (error) {
                console.error('인기 도서 조회 오류:', error);
                throw error;
            }
        },

        // ===== 도서 신청 =====
        
        /**
         * 도서 신청
         * @param {object} book - 신청할 도서 정보
         * @returns {Promise} - 신청 결과
         */
        requestBook: async (book) => {
            try {
                // 학급 선택 확인
                const classInfo = BookService.getCurrentClass();
                if (!classInfo) {
                    throw new Error(Config.getErrorMessages().CLASS_NOT_SELECTED);
                }

                // 도서 정보 검증
                validateBookData(book);

                // 중복 검사
                const duplicateResult = await BookService.checkDuplicate(book);
                if (duplicateResult.isDuplicate) {
                    if (duplicateResult.isOnLoan) {
                        throw new Error(Config.getErrorMessages().BOOK_ON_LOAN);
                    } else {
                        throw new Error(Config.getErrorMessages().DUPLICATE_BOOK);
                    }
                }

                // 예산 확인
                const budgetCheck = await BookService.checkBudget(book.salePrice || book.price || 0);
                if (!budgetCheck.canAfford) {
                    throw new Error(Config.getErrorMessages().BUDGET_EXCEEDED);
                }

                // 신청 데이터 생성
                const requestData = createBookRequestData(book, classInfo);

                // 백엔드에 신청 전송 (향후 구현)
                // const result = await ApiClient.addBookRequest(requestData);

                // 임시로 로컬 스토리지에 저장
                const requests = JSON.parse(localStorage.getItem('book_requests') || '[]');
                requests.push(requestData);
                localStorage.setItem('book_requests', JSON.stringify(requests));

                // 캐시 무효화
                cachedBooks = null;
                lastCacheTime = null;

                return { success: true, data: requestData };
            } catch (error) {
                console.error('도서 신청 오류:', error);
                throw error;
            }
        },
        
        /**
         * 신청 도서 목록 조회
         * @param {string} gradeClass - 학급 (선택사항)
         * @returns {Promise} - 신청 도서 목록
         */
        getRequestedBooks: async (gradeClass = null) => {
            try {
                // 캐시 확인
                if (!gradeClass && isCacheValid() && cachedBooks) {
                    return cachedBooks;
                }

                // 임시로 로컬 스토리지에서 조회
                const allRequests = JSON.parse(localStorage.getItem('book_requests') || '[]');
                
                let books;
                if (gradeClass) {
                    books = allRequests.filter(book => book.gradeClass === gradeClass);
                } else {
                    books = allRequests;
                }

                // 캐시 업데이트
                if (!gradeClass) {
                    cachedBooks = books;
                    lastCacheTime = Date.now();
                }

                return books;
            } catch (error) {
                console.error('신청 도서 조회 오류:', error);
                throw error;
            }
        },
        
        /**
         * 신청 도서 삭제
         * @param {string} bookId - 도서 ID
         * @returns {Promise} - 삭제 결과
         */
        deleteBookRequest: async (bookId) => {
            try {
                // 임시로 로컬 스토리지에서 삭제
                const requests = JSON.parse(localStorage.getItem('book_requests') || '[]');
                const filteredRequests = requests.filter(book => book.id !== bookId);
                localStorage.setItem('book_requests', JSON.stringify(filteredRequests));
                
                // 캐시 무효화
                cachedBooks = null;
                lastCacheTime = null;
                
                return { success: true };
            } catch (error) {
                console.error('도서 신청 삭제 오류:', error);
                throw error;
            }
        },
        
        // ===== 중복 검사 =====
        
        /**
         * 기존 도서와 중복 검사
         * @param {object} book - 검사할 도서
         * @returns {Promise} - 중복 검사 결과
         */
        checkDuplicate: async (book) => {
            try {
                // 기존 신청 도서 목록 조회
                const existingBooks = await BookService.getRequestedBooks();

                // ISBN으로 정확한 중복 검사
                if (book.isbn || book.isbn13) {
                    const isbn = book.isbn13 || book.isbn;
                    const duplicateByIsbn = existingBooks.find(existing => 
                        existing.isbn === isbn || existing.isbn13 === isbn
                    );
                    
                    if (duplicateByIsbn) {
                        return {
                            isDuplicate: true,
                            similarBook: duplicateByIsbn,
                            similarity: 1.0,
                            isOnLoan: duplicateByIsbn.status === 'on_loan' || false
                        };
                    }
                }

                // 제목과 저자로 유사도 검사
                const threshold = 0.8; // 80% 이상 유사하면 중복으로 판단
                
                for (const existingBook of existingBooks) {
                    const titleSimilarity = BookService.calculateSimilarity(
                        book.title, 
                        existingBook.title
                    );
                    
                    const authorSimilarity = BookService.calculateSimilarity(
                        book.author, 
                        existingBook.author || existingBook.authors?.join(', ') || ''
                    );
                    
                    const overallSimilarity = (titleSimilarity * 0.7) + (authorSimilarity * 0.3);
                    
                    if (overallSimilarity >= threshold) {
                        return {
                            isDuplicate: true,
                            similarBook: existingBook,
                            similarity: overallSimilarity,
                            isOnLoan: existingBook.status === 'on_loan' || false
                        };
                    }
                }

                return {
                    isDuplicate: false,
                    similarBook: null,
                    similarity: 0,
                    isOnLoan: false
                };
            } catch (error) {
                console.error('중복 검사 오류:', error);
                // 중복 검사 실패 시 신청 허용 (안전한 방향)
                return {
                    isDuplicate: false,
                    error: error.message
                };
            }
        },
        
        /**
         * 문자열 유사도 계산 (레벤슈타인 거리 기반)
         * @param {string} str1 - 첫 번째 문자열
         * @param {string} str2 - 두 번째 문자열
         * @returns {number} - 유사도 (0~1)
         */
        calculateSimilarity: (str1, str2) => {
            if (!str1 || !str2) return 0;
            
            const s1 = str1.toLowerCase().replace(/\s+/g, '');
            const s2 = str2.toLowerCase().replace(/\s+/g, '');
            
            if (s1 === s2) return 1;
            
            const matrix = [];
            for (let i = 0; i <= s2.length; i++) {
                matrix[i] = [i];
            }
            for (let i = 0; i <= s1.length; i++) {
                matrix[0][i] = i;
            }
            
            for (let i = 1; i <= s2.length; i++) {
                for (let j = 1; j <= s1.length; j++) {
                    if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            
            const maxLength = Math.max(s1.length, s2.length);
            return maxLength === 0 ? 1 : 1 - matrix[s2.length][s1.length] / maxLength;
        },
        
        // ===== 예산 관리 =====
        
        /**
         * 예산 확인
         * @param {number} bookPrice - 도서 가격
         * @returns {Promise} - 예산 확인 결과
         */
        checkBudget: async (bookPrice) => {
            try {
                const classInfo = BookService.getCurrentClass();
                if (!classInfo) {
                    throw new Error('학급 정보가 필요합니다.');
                }

                const gradeClass = `${classInfo.grade}-${classInfo.classNumber}`;
                
                // 현재 신청 도서들의 총액 계산
                const requestedBooks = await BookService.getRequestedBooks(gradeClass);
                const currentTotal = requestedBooks.reduce((sum, book) => sum + (book.price || 0), 0);
                
                // 학급 예산 조회
                const budgetConfig = Config.getBudgetConfig();
                const totalBudget = classInfo.budget || budgetConfig.DEFAULT_PER_CLASS;
                
                const remainingBudget = totalBudget - currentTotal;
                const canAfford = remainingBudget >= bookPrice;
                
                return {
                    canAfford,
                    totalBudget,
                    currentTotal,
                    remainingBudget,
                    bookPrice,
                    afterPurchase: remainingBudget - bookPrice
                };
            } catch (error) {
                console.error('예산 확인 오류:', error);
                throw error;
            }
        },
        
        // ===== 검색 기록 =====
        
        /**
         * 검색 기록 저장
         * @param {string} query - 검색어
         */
        saveSearchHistory: (query) => {
            try {
                const storageKey = Config.getStorageKeys().RECENT_SEARCHES;
                let history = JSON.parse(localStorage.getItem(storageKey) || '[]');
                
                // 중복 제거
                history = history.filter(item => item !== query);
                
                // 최신 검색어를 맨 앞에 추가
                history.unshift(query);
                
                // 최대 10개까지만 저장
                history = history.slice(0, 10);
                
                localStorage.setItem(storageKey, JSON.stringify(history));
            } catch (error) {
                console.error('검색 기록 저장 오류:', error);
            }
        },
        
        /**
         * 검색 기록 조회
         * @returns {array} - 검색 기록 목록
         */
        getSearchHistory: () => {
            try {
                const storageKey = Config.getStorageKeys().RECENT_SEARCHES;
                return JSON.parse(localStorage.getItem(storageKey) || '[]');
            } catch (error) {
                console.error('검색 기록 조회 오류:', error);
                return [];
            }
        },
        
        // ===== 캐시 관리 =====
        
        /**
         * 캐시 초기화
         */
        clearCache: () => {
            cachedBooks = null;
            cachedExistingBooks = null;
            lastCacheTime = null;
            AladinAPI.clearCache();
        }
    };
})();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.BookService = BookService;