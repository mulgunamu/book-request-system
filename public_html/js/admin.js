/**
 * admin.js
 * 관리자 페이지 기능 구현
 */

alert('admin.js가 실행되었습니다!');

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const elements = {
        // API 키 관련
        aladinApiKeyInput: document.getElementById('aladin-api-key'),
        saveAladinKeyBtn: document.getElementById('save-aladin-key'),
        apiStatus: document.getElementById('api-status'),
        statusIcon: document.getElementById('status-icon'),
        statusText: document.getElementById('status-text'),
        
        // 예산 관련
        defaultBudgetInput: document.getElementById('default-budget'),
        saveBudgetBtn: document.getElementById('save-budget'),
        
        // 파일 업로드 관련
        fileInput: document.getElementById('csv-file-input'),
        dropZone: document.getElementById('file-drop-zone'),
        fileInfo: document.getElementById('file-info'),
        fileName: document.getElementById('file-name'),
        fileSize: document.getElementById('file-size'),
        uploadBtn: document.getElementById('upload-csv')
    };

    /**
     * API 상태 표시 업데이트
     */
    const updateApiStatus = (success, message) => {
        elements.apiStatus.classList.remove('hidden', 'bg-green-100', 'bg-red-100');
        elements.statusIcon.classList.remove('fas', 'fa-check-circle', 'fa-times-circle', 'text-green-600', 'text-red-600');
        
        if (success) {
            elements.apiStatus.classList.add('bg-green-100');
            elements.statusIcon.classList.add('fas', 'fa-check-circle', 'text-green-600');
        } else {
            elements.apiStatus.classList.add('bg-red-100');
            elements.statusIcon.classList.add('fas', 'fa-times-circle', 'text-red-600');
        }
        
        elements.statusText.textContent = message;
    };

    /**
     * 알라딘 API 키 저장
     */
    const saveAladinApiKey = async () => {
        try {
            const apiKey = elements.aladinApiKeyInput.value.trim();
            
            if (!apiKey) {
                throw new Error('API 키를 입력해주세요.');
            }

            // API 키 저장
            Config.setAladinApiKey(apiKey);
            
            // API 상태 확인
            const isApiWorking = await AladinAPI.checkApiStatus();
            
            if (isApiWorking) {
                updateApiStatus(true, 'API 키가 정상적으로 저장되었습니다.');
                UIComponents.showToast('알라딘 API 키가 저장되었습니다.', 'success');
            } else {
                throw new Error('API 키가 유효하지 않습니다.');
            }
        } catch (error) {
            console.error('API 키 저장 오류:', error);
            updateApiStatus(false, error.message);
            UIComponents.showToast(error.message, 'error');
        }
    };

    /**
     * 저장된 API 키 불러오기
     */
    const loadSavedApiKey = async () => {
        try {
            const apiKey = Config.getAladinApiKey();
            
            if (apiKey) {
                elements.aladinApiKeyInput.value = apiKey;
                
                // API 상태 확인
                const isApiWorking = await AladinAPI.checkApiStatus();
                
                if (isApiWorking) {
                    updateApiStatus(true, 'API 키가 유효합니다.');
                } else {
                    updateApiStatus(false, 'API 키가 유효하지 않습니다.');
                }
            }
        } catch (error) {
            console.error('API 키 불러오기 오류:', error);
            updateApiStatus(false, '저장된 API 키를 불러올 수 없습니다.');
        }
    };

    // 이벤트 리스너 등록
    if (elements.saveAladinKeyBtn) {
        elements.saveAladinKeyBtn.addEventListener('click', saveAladinApiKey);
    }

    // 페이지 로드 시 저장된 API 키 불러오기
    loadSavedApiKey();

    // 전체 신청 도서 목록 페이징 렌더링
    const PAGE_SIZE = 20;
    let allBooksData = [];
    let currentPage = 1;

    async function loadAllApplications() {
        alert('loadAllApplications 실행됨');
        console.log('loadAllApplications 실행됨'); // 디버깅용
        const applications = await Applications.getAll();
        const realData = await applications;
        console.log('Applications.getAll() 실제 데이터:', realData); // 디버깅용
        // 도서별로 집계 (isbn 기준)
        const bookMap = new Map();
        for (const app of realData) {
            const key = app.isbn;
            const [grade, classNum] = (app.classId || '').split('-');
            if (!bookMap.has(key)) {
                bookMap.set(key, {
                    isbn: app.isbn,
                    title: app.title,
                    author: app.author,
                    publisher: app.publisher,
                    price: app.price,
                    pubYear: '', // 출판년도 정보 없음
                    grade: grade || '',
                    class: classNum || '',
                    count: 1
                });
            } else {
                bookMap.get(key).count++;
            }
        }
        allBooksData = Array.from(bookMap.values());
        renderAllApplicationsTable(1);
        renderAllBooksPagination();
    }

    function renderAllApplicationsTable(page) {
        console.log('렌더링 시작, allBooksData:', allBooksData); // 디버깅용
        currentPage = page;
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageData = allBooksData.slice(start, end);
        const tbody = document.getElementById('allApplicationsTable');
        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-gray-400 py-8">신청 도서 데이터가 없습니다.</td></tr>`;
            return;
        }
        tbody.innerHTML = pageData.map(book => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${Validator.escapeHtml(book.title)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${Validator.escapeHtml(book.author)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${Validator.escapeHtml(book.publisher)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${book.pubYear || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${book.count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${formatPrice(book.price)}원</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${formatPrice(book.price * book.count)}원</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${book.grade}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${book.class}</td>
            </tr>
        `).join('');
    }

    function renderAllBooksPagination() {
        const totalPages = Math.ceil(allBooksData.length / PAGE_SIZE);
        const container = document.getElementById('allBooksPagination');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'px-2 py-1 rounded border text-sm ' + (i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600');
            btn.addEventListener('click', () => renderAllApplicationsTable(i));
            container.appendChild(btn);
        }
    }

    // 탭 활성화 시 전체 신청 도서 목록 로드
    const overviewTabBtn = document.querySelector('[data-tab="overview"]');
    if (overviewTabBtn) {
        overviewTabBtn.addEventListener('click', loadAllApplications);
    }
    // 페이지 로드시 무조건 전체 신청 도서 목록 로드
    loadAllApplications();
});

// 가격 포맷팅 함수 추가
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} 