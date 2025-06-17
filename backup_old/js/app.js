/**
 * app.js
 * 애플리케이션의 메인 로직을 담당하는 스크립트
 */

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 전역 변수
    let cartBooks = []; // 장바구니에서 가져온 도서 목록
    let existingBooks = []; // 기존 보유 도서 목록
    
    // DOM 요소
    const gradeSelect = document.getElementById('grade');
    const classSelect = document.getElementById('class');
    const teacherInput = document.getElementById('teacher');
    const aladinCartUrlInput = document.getElementById('aladin-cart-url');
    const fetchCartBtn = document.getElementById('fetch-cart-btn');
    const cartPreviewDiv = document.getElementById('cart-preview');
    const cartItemsTable = document.getElementById('cart-items');
    const submitRequestBtn = document.getElementById('submit-request-btn');
    
    /**
     * 페이지 초기화 함수
     */
    const initPage = async () => {
        try {
            // 학급 정보 초기화
            await initClassSelects();
            
            // 기존 도서 정보 로드
            existingBooks = await DataManager.getExistingBooks();
            
            // 이벤트 리스너 등록
            registerEventListeners();
        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            Utils.showError('시스템 초기화 중 오류가 발생했습니다.');
        }
    };
    
    /**
     * 학급 선택 요소 초기화 함수
     */
    const initClassSelects = async () => {
        try {
            // 학급 정보 가져오기
            const classes = await DataManager.getClasses();
            
            // 학년 변경 시 반 목록 업데이트
            gradeSelect.addEventListener('change', () => {
                updateClassOptions(classes);
            });
            
            // 초기 반 목록 업데이트
            updateClassOptions(classes);
        } catch (error) {
            console.error('학급 선택 초기화 오류:', error);
            Utils.showError('학급 정보를 불러오는데 실패했습니다.');
        }
    };
    
    /**
     * 학년 선택에 따라 반 목록 업데이트하는 함수
     * @param {Array} classes - 학급 구조 정보
     */
    const updateClassOptions = (classes) => {
        // 반 선택 초기화
        Utils.clearElement(classSelect);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '선택하세요';
        classSelect.appendChild(defaultOption);
        
        // 선택된 학년 가져오기
        const selectedGrade = gradeSelect.value;
        
        if (!selectedGrade) return;
        
        // 선택된 학년의 반 목록 찾기
        const gradeClasses = classes.find(g => g.grade.toString() === selectedGrade);
        
        if (!gradeClasses || !gradeClasses.classes) return;
        
        // 반 옵션 추가
        gradeClasses.classes.forEach(classInfo => {
            const option = document.createElement('option');
            option.value = classInfo.id.split('-')[1]; // "1-2" 형식에서 "2" 추출
            option.textContent = `${option.value}반`;
            classSelect.appendChild(option);
        });
    };
    
    /**
     * 이벤트 리스너 등록 함수
     */
    const registerEventListeners = () => {
        // 알라딘 장바구니 가져오기 버튼 클릭
        fetchCartBtn.addEventListener('click', fetchAladinCart);
        
        // 희망 도서 신청 버튼 클릭
        submitRequestBtn.addEventListener('click', submitBookRequest);
    };
    
    /**
     * 알라딘 장바구니 가져오기 함수
     */
    const fetchAladinCart = async () => {
        try {
            // 유효성 검사
            const url = aladinCartUrlInput.value.trim();
            
            if (!url) {
                Utils.showError('알라딘 장바구니 URL을 입력해주세요.');
                return;
            }
            
            if (!AladinAPI.isValidCartURL(url)) {
                Utils.showError('유효한 알라딘 장바구니 URL이 아닙니다.');
                return;
            }
            
            // 로딩 표시
            Utils.toggleLoading(true);
            
            // 장바구니 정보 가져오기
            const books = await AladinAPI.fetchCartItems(url);
            
            if (!books || books.length === 0) {
                Utils.showError('장바구니에서 도서를 찾을 수 없습니다.');
                Utils.toggleLoading(false);
                return;
            }
            
            // 중복 체크
            if (existingBooks.length > 0) {
                cartBooks = DuplicateChecker.checkDuplicates(books, existingBooks);
            } else {
                cartBooks = books;
            }
            
            // 장바구니 미리보기 표시
            renderCartPreview();
            
            // 로딩 해제
            Utils.toggleLoading(false);
            
        } catch (error) {
            console.error('알라딘 장바구니 가져오기 오류:', error);
            Utils.showError('장바구니 정보를 가져오는데 실패했습니다. ' + error.message);
            Utils.toggleLoading(false);
        }
    };
    
    /**
     * 장바구니 미리보기 렌더링 함수
     */
    const renderCartPreview = () => {
        // 테이블 초기화
        Utils.clearElement(cartItemsTable);
        
        // 각 도서에 대한 행 추가
        cartBooks.forEach((book, index) => {
            const row = document.createElement('tr');
            row.className = book.isDuplicate ? 'bg-red-50' : '';
            
            // 도서명 셀
            const titleCell = document.createElement('td');
            titleCell.className = 'px-4 py-2 border-b';
            titleCell.textContent = book.title;
            row.appendChild(titleCell);
            
            // 저자 셀
            const authorCell = document.createElement('td');
            authorCell.className = 'px-4 py-2 border-b';
            authorCell.textContent = book.author;
            row.appendChild(authorCell);
            
            // 출판사 셀
            const publisherCell = document.createElement('td');
            publisherCell.className = 'px-4 py-2 border-b';
            publisherCell.textContent = book.publisher;
            row.appendChild(publisherCell);
            
            // 가격 셀
            const priceCell = document.createElement('td');
            priceCell.className = 'px-4 py-2 border-b';
            priceCell.textContent = Utils.formatPrice(book.price);
            row.appendChild(priceCell);
            
            // 중복 여부 셀
            const duplicateCell = document.createElement('td');
            duplicateCell.className = 'px-4 py-2 border-b';
            
            if (book.isDuplicate) {
                duplicateCell.innerHTML = `<span class="text-red-600 font-semibold">중복</span>`;
                if (book.similarBook) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'relative inline-block ml-2';
                    tooltip.innerHTML = `
                        <i class="fas fa-info-circle text-gray-500 cursor-help"></i>
                        <div class="hidden absolute z-10 p-2 bg-gray-800 text-white text-xs rounded w-48 -left-24 -bottom-20 group-hover:block">
                            유사도: ${Math.round(book.similarityScore * 100)}%<br>
                            기존 도서: ${book.similarBook.title}
                        </div>
                    `;
                    duplicateCell.appendChild(tooltip);
                }
            } else {
                duplicateCell.textContent = '신규';
            }
            row.appendChild(duplicateCell);
            
            // 선택 셀
            const selectCell = document.createElement('td');
            selectCell.className = 'px-4 py-2 border-b';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-checkbox h-5 w-5 text-indigo-600';
            checkbox.checked = !book.isDuplicate; // 중복이 아닌 경우 기본 선택
            checkbox.disabled = book.isDuplicate; // 중복인 경우 선택 비활성화
            
            checkbox.addEventListener('change', () => {
                cartBooks[index].selected = checkbox.checked;
            });
            
            selectCell.appendChild(checkbox);
            row.appendChild(selectCell);
            
            // 행을 테이블에 추가
            cartItemsTable.appendChild(row);
        });
        
        // 장바구니 미리보기 표시
        Utils.toggleVisibility(cartPreviewDiv, true);
    };
    
    /**
     * 희망 도서 신청 함수
     */
    const submitBookRequest = async () => {
        try {
            // 유효성 검사
            const grade = gradeSelect.value;
            const classNum = classSelect.value;
            const teacher = teacherInput.value.trim();
            
            if (!grade) {
                Utils.showError('학년을 선택해주세요.');
                return;
            }
            
            if (!classNum) {
                Utils.showError('반을 선택해주세요.');
                return;
            }
            
            if (!teacher) {
                Utils.showError('담당 교사 이름을 입력해주세요.');
                return;
            }
            
            if (!cartBooks || cartBooks.length === 0) {
                Utils.showError('신청할 도서가 없습니다.');
                return;
            }
            
            // 선택된 도서만 필터링
            const selectedBooks = cartBooks.filter(book => book.selected && !book.isDuplicate);
            
            if (selectedBooks.length === 0) {
                Utils.showError('선택된 도서가 없습니다.');
                return;
            }
            
            // 로딩 표시
            Utils.toggleLoading(true);
            
            // 도서 정보에 교사 정보 추가
            const booksWithTeacher = selectedBooks.map(book => ({
                ...book,
                teacher
            }));
            
            // 도서 저장
            const gradeClass = Utils.formatGradeClass(grade, classNum);
            await DataManager.saveRequestedBooks(booksWithTeacher, gradeClass);
            
            // 성공 메시지
            alert('희망 도서 신청이 완료되었습니다.');
            
            // 페이지 새로고침
            window.location.reload();
            
        } catch (error) {
            console.error('도서 신청 오류:', error);
            Utils.showError('도서 신청 중 오류가 발생했습니다: ' + error.message);
            Utils.toggleLoading(false);
        }
    };
    
    // 페이지 초기화 실행
    initPage();
});