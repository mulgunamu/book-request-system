/**
 * duplicate-checker.js
 * 도서 중복 여부를 체크하는 모듈
 */

const DuplicateChecker = (() => {
    /**
     * 문자열 정규화 함수
     * 공백 제거, 소문자 변환 등을 통해 비교하기 좋은 형태로 변환
     * @param {string} str - 정규화할 문자열
     * @returns {string} - 정규화된 문자열
     */
    const normalizeString = (str) => {
        if (!str) return '';
        
        return str
            .toLowerCase()                // 소문자 변환
            .replace(/\s+/g, '')          // 모든 공백 제거
            .replace(/[^\w가-힣]/g, '')    // 특수문자 제거
            .trim();                      // 앞뒤 공백 제거
    };
    
    /**
     * 레벤슈타인 거리 계산 함수
     * 두 문자열 간의 편집 거리를 계산
     * @param {string} a - 첫 번째 문자열
     * @param {string} b - 두 번째 문자열
     * @returns {number} - 레벤슈타인 거리
     */
    const levenshteinDistance = (a, b) => {
        const matrix = [];
        
        // 행렬 초기화
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let i = 0; i <= a.length; i++) {
            matrix[0][i] = i;
        }
        
        // 알고리즘 실행
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // 대체
                        Math.min(
                            matrix[i][j - 1] + 1,   // 삽입
                            matrix[i - 1][j] + 1    // 삭제
                        )
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    };
    
    /**
     * 문자열 유사도 계산 함수
     * 0(완전 다름)부터 1(완전 일치)까지의 유사도를 반환
     * @param {string} a - 첫 번째 문자열
     * @param {string} b - 두 번째 문자열
     * @returns {number} - 유사도 (0~1 사이)
     */
    const stringSimilarity = (a, b) => {
        if (!a || !b) return 0;
        
        const normalizedA = normalizeString(a);
        const normalizedB = normalizeString(b);
        
        if (normalizedA === normalizedB) return 1;
        
        const distance = levenshteinDistance(normalizedA, normalizedB);
        const maxLength = Math.max(normalizedA.length, normalizedB.length);
        
        if (maxLength === 0) return 1;
        
        return 1 - distance / maxLength;
    };
    
    /**
     * 제목과 저자 정보를 기반으로 도서 유사도 계산
     * @param {object} book1 - 첫 번째 도서 정보
     * @param {object} book2 - 두 번째 도서 정보
     * @returns {number} - 도서 유사도 (0~1 사이)
     */
    const calculateBookSimilarity = (book1, book2) => {
        // 제목 유사도 (가중치 70%)
        const titleSimilarity = stringSimilarity(book1.title, book2.title) * 0.7;
        
        // 저자 유사도 (가중치 30%)
        const authorSimilarity = stringSimilarity(book1.author, book2.author) * 0.3;
        
        // 전체 유사도
        return titleSimilarity + authorSimilarity;
    };
    
    return {
        /**
         * 도서 중복 여부 확인 함수
         * @param {Array} newBooks - 새로 추가할 도서 목록
         * @param {Array} existingBooks - 기존 보유 도서 목록
         * @param {number} threshold - 중복으로 판단할 유사도 임계값 (기본값: 0.8)
         * @returns {Array} - 중복 여부 정보가 추가된 새 도서 목록
         */
        checkDuplicates: (newBooks, existingBooks, threshold = 0.8) => {
            if (!newBooks || !existingBooks) {
                return newBooks;
            }
            
            // 각 새 도서에 대해 중복 체크
            return newBooks.map(newBook => {
                // 기존 도서들과 비교하여 가장 높은 유사도 찾기
                let highestSimilarity = 0;
                let mostSimilarBook = null;
                
                existingBooks.forEach(existingBook => {
                    const similarity = calculateBookSimilarity(newBook, existingBook);
                    
                    if (similarity > highestSimilarity) {
                        highestSimilarity = similarity;
                        mostSimilarBook = existingBook;
                    }
                });
                
                // 중복 여부 및 관련 정보 추가
                return {
                    ...newBook,
                    isDuplicate: highestSimilarity >= threshold,
                    similarityScore: highestSimilarity,
                    similarBook: highestSimilarity >= threshold ? mostSimilarBook : null
                };
            });
        },
        
        /**
         * CSV 파일에서 기존 도서 정보를 로드하는 함수
         * @param {File} file - 업로드된 CSV 파일
         * @returns {Promise<Array>} - 기존 도서 목록을 담은 Promise
         */
        loadExistingBooksFromCSV: (file) => {
            return new Promise((resolve, reject) => {
                if (!file) {
                    reject(new Error('파일이 제공되지 않았습니다.'));
                    return;
                }
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const content = e.target.result;
                        const lines = content.split('\n');
                        
                        // 헤더 제거
                        const header = lines[0];
                        const headerFields = header.split(',').map(field => field.trim());
                        
                        // 필수 필드 확인
                        const titleIndex = headerFields.findIndex(field => 
                            field.toLowerCase().includes('제목') || field.toLowerCase().includes('title'));
                        const authorIndex = headerFields.findIndex(field => 
                            field.toLowerCase().includes('저자') || field.toLowerCase().includes('author'));
                        
                        if (titleIndex === -1 || authorIndex === -1) {
                            reject(new Error('CSV 파일의 형식이 올바르지 않습니다. 제목과 저자 필드가 필요합니다.'));
                            return;
                        }
                        
                        // 도서 정보 파싱
                        const books = [];
                        
                        for (let i = 1; i < lines.length; i++) {
                            if (!lines[i].trim()) continue;
                            
                            const values = lines[i].split(',').map(value => value.trim());
                            
                            if (values.length >= Math.max(titleIndex, authorIndex) + 1) {
                                books.push({
                                    title: values[titleIndex],
                                    author: values[authorIndex],
                                    publisher: values[headerFields.findIndex(f => 
                                        f.toLowerCase().includes('출판사') || f.toLowerCase().includes('publisher'))] || '',
                                    id: values[headerFields.findIndex(f => 
                                        f.toLowerCase().includes('id') || f.toLowerCase().includes('isbn'))] || ''
                                });
                            }
                        }
                        
                        resolve(books);
                    } catch (error) {
                        reject(new Error('CSV 파일 파싱 중 오류가 발생했습니다: ' + error.message));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('파일 읽기 오류가 발생했습니다.'));
                };
                
                reader.readAsText(file);
            });
        }
    };
})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuplicateChecker;
}