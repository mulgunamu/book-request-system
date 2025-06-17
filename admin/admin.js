/**
 * 관리자 페이지 애플리케이션
 */

class AdminApp {
    constructor() {
        this.elements = {};
        this.allApplications = [];
        this.classData = {};
    }

    async init() {
        this.bindElements();
        this.bindEvents();
        this.loadData();
        this.updateDashboard();
        this.loadClassStatus();
        this.loadRecentApplications();
    }

    bindElements() {
        this.elements = {
            // 대시보드
            totalBooks: document.getElementById('totalBooks'),
            totalAmount: document.getElementById('totalAmount'),
            activeClasses: document.getElementById('activeClasses'),
            avgBudgetUsage: document.getElementById('avgBudgetUsage'),
            
            // 테이블
            classStatusTable: document.getElementById('classStatusTable'),
            recentApplicationsTable: document.getElementById('recentApplicationsTable'),
            
            // 버튼
            exportAllBtn: document.getElementById('exportAllBtn'),
            
            // 모달
            classManagementModal: document.getElementById('classManagementModal'),
            classManagementGrid: document.getElementById('classManagementGrid'),
            ownedBooksModal: document.getElementById('ownedBooksModal'),
            ownedBooksTable: document.getElementById('ownedBooksTable'),
            
            // CSV 업로드
            csvFileInput: document.getElementById('csvFileInput'),
            uploadCsvBtn: document.getElementById('uploadCsvBtn')
        };
    }

    bindEvents() {
        this.elements.exportAllBtn.addEventListener('click', () => this.exportAllApplications());
        this.elements.uploadCsvBtn.addEventListener('click', () => this.uploadCsvFile());
        
        // 모달 배경 클릭으로 닫기
        this.elements.classManagementModal.addEventListener('click', (e) => {
            if (e.target === this.elements.classManagementModal) {
                hideClassManagement();
            }
        });
        
        this.elements.ownedBooksModal.addEventListener('click', (e) => {
            if (e.target === this.elements.ownedBooksModal) {
                hideOwnedBooksManagement();
            }
        });
    }

    loadData() {
        this.allApplications = Applications.getAll();
        this.generateClassData();
    }

    generateClassData() {
        // 1-6학년, 1-2반 기본 구조 생성
        this.classData = {};
        
        for (let grade = 1; grade <= 6; grade++) {
            for (let classNum = 1; classNum <= 2; classNum++) {
                const classId = `${grade}-${classNum}`;
                this.classData[classId] = {
                    grade,
                    class: classNum,
                    classId,
                    teacher: '',
                    budget: Budget.getClassBudget(classId),
                    applications: Applications.getByClass(classId),
                    usedBudget: Budget.getUsedBudget(classId)
                };
            }
        }

        // 저장된 학급 정보 불러오기
        const savedClasses = Storage.get('allClasses', {});
        Object.keys(savedClasses).forEach(classId => {
            if (this.classData[classId]) {
                this.classData[classId].teacher = savedClasses[classId].teacher || '';
            }
        });
    }

    updateDashboard() {
        const totalBooks = this.allApplications.length;
        const totalAmount = this.allApplications.reduce((sum, app) => sum + (app.price || 0), 0);
        
        // 활성 학급 수 (신청이 있는 학급)
        const activeClassIds = new Set(this.allApplications.map(app => app.classId));
        const activeClasses = activeClassIds.size;
        
        // 평균 예산 사용률
        const classUsageRates = Object.values(this.classData)
            .filter(cls => cls.applications.length > 0)
            .map(cls => {
                const percentage = cls.budget > 0 ? Math.round((cls.usedBudget / cls.budget) * 100) : 0;
                return percentage;
            });
        
        const avgBudgetUsage = classUsageRates.length > 0 
            ? Math.round(classUsageRates.reduce((sum, rate) => sum + rate, 0) / classUsageRates.length)
            : 0;

        // UI 업데이트
        this.elements.totalBooks.textContent = `${totalBooks}권`;
        this.elements.totalAmount.textContent = `${formatPrice(totalAmount)}원`;
        this.elements.activeClasses.textContent = `${activeClasses}개`;
        this.elements.avgBudgetUsage.textContent = `${avgBudgetUsage}%`;
    }

    loadClassStatus() {
        const rows = Object.values(this.classData).map(cls => {
            const budgetPercentage = cls.budget > 0 ? Math.round((cls.usedBudget / cls.budget) * 100) : 0;
            const statusColor = budgetPercentage > 90 ? 'text-red-600' : 
                               budgetPercentage > 70 ? 'text-yellow-600' : 'text-green-600';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${cls.grade}학년 ${cls.class}반</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${cls.teacher || '미설정'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${cls.applications.length}권</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${formatPrice(cls.usedBudget)}원 / ${formatPrice(cls.budget)}원</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium ${statusColor}">${budgetPercentage}%</div>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div class="h-2 rounded-full ${budgetPercentage > 90 ? 'bg-red-600' : budgetPercentage > 70 ? 'bg-yellow-600' : 'bg-green-600'}" 
                                 style="width: ${Math.min(budgetPercentage, 100)}%"></div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="viewClassApplications('${cls.classId}')" 
                                class="text-blue-600 hover:text-blue-900 mr-3">
                            <i class="fas fa-eye mr-1"></i>보기
                        </button>
                        <button onclick="editClassBudget('${cls.classId}')" 
                                class="text-green-600 hover:text-green-900">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        this.elements.classStatusTable.innerHTML = rows;
    }

    loadRecentApplications() {
        // 최근 20개 신청 내역
        const recentApplications = [...this.allApplications]
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
            .slice(0, 20);

        const rows = recentApplications.map(app => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${app.classId}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 max-w-xs truncate" title="${Validator.escapeHtml(app.title)}">
                        ${Validator.escapeHtml(app.title)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${Validator.escapeHtml(app.author)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatPrice(app.price)}원</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${formatDate(app.appliedAt)}</div>
                </td>
            </tr>
        `).join('');

        this.elements.recentApplicationsTable.innerHTML = rows || `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    신청 내역이 없습니다.
                </td>
            </tr>
        `;
    }

    exportAllApplications() {
        if (this.allApplications.length === 0) {
            Toast.show('내보내기 실패', '내보낼 데이터가 없습니다.', 'warning');
            return;
        }

        const exportData = this.allApplications.map(app => {
            const classInfo = this.classData[app.classId];
            return {
                '학급': app.classId,
                '담임교사': classInfo ? classInfo.teacher : '',
                '도서명': app.title,
                '저자': app.author,
                '출판사': app.publisher,
                '가격': app.price,
                '구분': app.isTeacherBook ? '교사용' : '학생용',
                'ISBN': app.isbn,
                '신청일': formatDate(app.appliedAt)
            };
        });

        const filename = `전체_도서신청목록_${new Date().toISOString().split('T')[0]}.csv`;
        CSV.download(exportData, filename);
        
        Toast.show('내보내기 완료', 'CSV 파일이 다운로드되었습니다.', 'success');
    }

    loadClassManagement() {
        const cards = Object.values(this.classData).map(cls => {
            const budgetStatus = Budget.getBudgetStatus(cls.classId);
            
            return `
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-gray-900">${cls.grade}학년 ${cls.class}반</h4>
                        <span class="text-sm text-gray-500">${cls.applications.length}권 신청</span>
                    </div>
                    
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">담임교사</label>
                            <input type="text" 
                                   value="${cls.teacher}" 
                                   onchange="updateClassTeacher('${cls.classId}', this.value)"
                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                   placeholder="담임교사 이름">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">예산 (원)</label>
                            <input type="number" 
                                   value="${cls.budget}" 
                                   onchange="updateClassBudget('${cls.classId}', parseInt(this.value))"
                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                   min="0" step="10000">
                        </div>
                        
                        <div class="text-sm text-gray-600">
                            <div class="flex justify-between">
                                <span>사용:</span>
                                <span>${formatPrice(budgetStatus.used)}원</span>
                            </div>
                            <div class="flex justify-between">
                                <span>잔여:</span>
                                <span class="${budgetStatus.remaining < 0 ? 'text-red-600' : 'text-green-600'}">${formatPrice(budgetStatus.remaining)}원</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div class="h-2 rounded-full ${budgetStatus.percentage > 90 ? 'bg-red-600' : budgetStatus.percentage > 70 ? 'bg-yellow-600' : 'bg-blue-600'}" 
                                     style="width: ${Math.min(budgetStatus.percentage, 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.classManagementGrid.innerHTML = cards;
    }

    loadOwnedBooksManagement() {
        const ownedBooks = OwnedBooks.getAll();
        
        const rows = ownedBooks.map(book => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-mono text-gray-900">${book.isbn}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 max-w-xs truncate" title="${Validator.escapeHtml(book.title)}">
                        ${Validator.escapeHtml(book.title)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${formatDate(book.addedAt)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="removeOwnedBook('${book.isbn}')" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash mr-1"></i>삭제
                    </button>
                </td>
            </tr>
        `).join('');

        this.elements.ownedBooksTable.innerHTML = rows || `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    등록된 기보유 도서가 없습니다.
                </td>
            </tr>
        `;
    }

    async uploadCsvFile() {
        const file = this.elements.csvFileInput.files[0];
        if (!file) {
            Toast.show('파일 선택 필요', 'CSV 파일을 선택해주세요.', 'warning');
            return;
        }

        try {
            const csvData = await CSV.readFile(file);
            const result = OwnedBooks.bulkUpload(csvData);
            
            if (result.success) {
                Toast.show('업로드 완료', `${result.addedCount}권의 도서가 추가되었습니다.`, 'success');
                this.loadOwnedBooksManagement();
                this.elements.csvFileInput.value = '';
            } else {
                Toast.show('업로드 실패', result.error, 'error');
            }
        } catch (error) {
            console.error('CSV 업로드 오류:', error);
            Toast.show('업로드 오류', 'CSV 파일 처리 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 전역 함수들
function showClassManagement() {
    adminApp.loadClassManagement();
    Modal.show('classManagementModal');
}

function hideClassManagement() {
    Modal.hide('classManagementModal');
}

function showOwnedBooksManagement() {
    adminApp.loadOwnedBooksManagement();
    Modal.show('ownedBooksModal');
}

function hideOwnedBooksManagement() {
    Modal.hide('ownedBooksModal');
}

function showAllApplications() {
    // 전체 신청 현황 페이지로 이동 (향후 구현)
    Toast.show('준비중', '전체 신청 현황 페이지는 준비중입니다.', 'info');
}

function updateClassTeacher(classId, teacher) {
    const allClasses = Storage.get('allClasses', {});
    allClasses[classId] = { ...allClasses[classId], teacher };
    Storage.set('allClasses', allClasses);
    
    adminApp.classData[classId].teacher = teacher;
    adminApp.loadClassStatus();
    
    Toast.show('저장 완료', '담임교사 정보가 저장되었습니다.', 'success');
}

function updateClassBudget(classId, budget) {
    if (isNaN(budget) || budget < 0) {
        Toast.show('입력 오류', '올바른 예산을 입력해주세요.', 'error');
        return;
    }
    
    Budget.setClassBudget(classId, budget);
    adminApp.classData[classId].budget = budget;
    adminApp.loadClassStatus();
    adminApp.loadClassManagement();
    adminApp.updateDashboard();
    
    Toast.show('저장 완료', '예산이 저장되었습니다.', 'success');
}

function viewClassApplications(classId) {
    // 해당 학급의 신청 목록 페이지로 이동
    window.open(`../applications.html?class=${classId}`, '_blank');
}

function editClassBudget(classId) {
    const currentBudget = Budget.getClassBudget(classId);
    const newBudget = prompt('새로운 예산을 입력하세요:', currentBudget);
    
    if (newBudget !== null) {
        const budget = parseInt(newBudget);
        if (!isNaN(budget) && budget >= 0) {
            updateClassBudget(classId, budget);
        } else {
            Toast.show('입력 오류', '올바른 숫자를 입력해주세요.', 'error');
        }
    }
}

function removeOwnedBook(isbn) {
    if (confirm('이 도서를 기보유 목록에서 삭제하시겠습니까?')) {
        const success = OwnedBooks.remove(isbn);
        
        if (success) {
            Toast.show('삭제 완료', '기보유 도서가 삭제되었습니다.', 'success');
            adminApp.loadOwnedBooksManagement();
        } else {
            Toast.show('삭제 실패', '도서 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 애플리케이션 시작
const adminApp = new AdminApp();
document.addEventListener('DOMContentLoaded', () => {
    adminApp.init();
}); 