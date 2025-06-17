document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소
    const classGradeSelect = document.getElementById('classGradeSelect');
    const classList = document.getElementById('classList');
    const exportGradeSelect = document.getElementById('exportGradeSelect');
    const exportClassSelect = document.getElementById('exportClassSelect');
    const addModal = document.getElementById('addModal');
    const modalTitle = document.getElementById('modalTitle');
    const gradeModalContent = document.getElementById('gradeModalContent');
    const classModalContent = document.getElementById('classModalContent');
    const newGradeInput = document.getElementById('newGradeInput');
    const newClassInput = document.getElementById('newClassInput');
    const newTeacherInput = document.getElementById('newTeacherInput');

    // 상태 변수
    let classStructure = DataManager.loadClasses();
    let currentGradeForClass = null;
    let modalMode = '';

    // 유틸리티 함수
    const Utils = {
        clearElement: (element) => {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        },
        
        toggleVisibility: (element, show) => {
            element.classList.toggle('hidden', !show);
        },
        
        showError: (message) => {
            alert(message);
        }
    };

    /**
     * 학년 선택 요소 업데이트 함수 (반 관리)
     */
    const updateClassGradeSelect = () => {
        // 학년 선택 초기화
        Utils.clearElement(classGradeSelect);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '선택하세요';
        classGradeSelect.appendChild(defaultOption);
        
        // 각 학년 옵션 추가
        classStructure.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade.grade;
            option.textContent = `${grade.grade}학년`;
            classGradeSelect.appendChild(option);
        });
        
        // 이전에 선택한 학년이 있으면 다시 선택
        if (currentGradeForClass) {
            classGradeSelect.value = currentGradeForClass;
        }
    };

    /**
     * 반 목록 업데이트 함수
     */
    const updateClassList = () => {
        // 반 목록 초기화
        Utils.clearElement(classList);
        
        if (!currentGradeForClass) return;
        
        // 선택된 학년의 반 목록 찾기
        const selectedGrade = classStructure.find(g => g.grade.toString() === currentGradeForClass.toString());
        
        if (!selectedGrade || !selectedGrade.classes) return;
        
        // 각 반별 항목 추가
        selectedGrade.classes.forEach(classInfo => {
            const classItem = document.createElement('div');
            classItem.className = 'flex justify-between items-center bg-white p-2 rounded border border-gray-200';
            
            const classNameDiv = document.createElement('div');
            classNameDiv.textContent = `${classInfo.name} (담당: ${classInfo.teacher || '미지정'})`;
            classItem.appendChild(classNameDiv);
            
            const actionButtons = document.createElement('div');
            actionButtons.className = 'space-x-2';
            
            // 삭제 버튼
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-red-600 hover:text-red-800';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => deleteClass(classInfo.id));
            actionButtons.appendChild(deleteBtn);
            
            classItem.appendChild(actionButtons);
            classList.appendChild(classItem);
        });
    };

    /**
     * 내보내기 학년 선택 업데이트 함수
     */
    const updateExportGradeSelect = () => {
        // 학년 선택 초기화
        Utils.clearElement(exportGradeSelect);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '전체 학년';
        exportGradeSelect.appendChild(defaultOption);
        
        // 각 학년 옵션 추가
        classStructure.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade.grade;
            option.textContent = `${grade.grade}학년`;
            exportGradeSelect.appendChild(option);
        });
        
        // 반 선택 업데이트
        updateExportClassSelect();
    };

    /**
     * 내보내기 반 선택 업데이트 함수
     */
    const updateExportClassSelect = () => {
        // 반 선택 초기화
        Utils.clearElement(exportClassSelect);
        
        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '전체 반';
        exportClassSelect.appendChild(defaultOption);
        
        // 선택된 학년이 있는 경우만 반 옵션 추가
        const selectedGrade = exportGradeSelect.value;
        
        if (selectedGrade) {
            // 선택된 학년의 반 목록 찾기
            const gradeInfo = classStructure.find(g => g.grade.toString() === selectedGrade);
            
            if (gradeInfo && gradeInfo.classes) {
                // 각 반별 옵션 추가
                gradeInfo.classes.forEach(classInfo => {
                    const option = document.createElement('option');
                    option.value = classInfo.id.split('-')[1]; // "1-2" 형식에서 "2" 추출
                    option.textContent = `${option.value}반`;
                    exportClassSelect.appendChild(option);
                });
            }
        }
    };

    /**
     * 모달 표시 함수
     * @param {string} mode - 모달 모드 ('grade' 또는 'class')
     */
    const showModal = (mode) => {
        modalMode = mode;
        
        // 모달 제목 설정
        if (mode === 'grade') {
            modalTitle.textContent = '학년 추가';
            Utils.toggleVisibility(gradeModalContent, true);
            Utils.toggleVisibility(classModalContent, false);
            
            // 입력 필드 초기화
            newGradeInput.value = '';
        } else if (mode === 'class') {
            modalTitle.textContent = '반 추가';
            Utils.toggleVisibility(gradeModalContent, false);
            Utils.toggleVisibility(classModalContent, true);
            
            // 입력 필드 초기화
            newClassInput.value = '';
            newTeacherInput.value = '';
        }
        
        // 모달 표시
        addModal.classList.remove('hidden');
    };

    /**
     * 모달 숨기기 함수
     */
    const hideModal = () => {
        addModal.classList.add('hidden');
        modalMode = '';
    };

    /**
     * 모달 데이터 저장 함수
     */
    const saveModalData = () => {
        if (modalMode === 'grade') {
            // 학년 추가
            const grade = parseInt(newGradeInput.value, 10);
            
            if (isNaN(grade) || grade < 1 || grade > 6) {
                Utils.showError('유효한 학년(1~6)을 입력해주세요.');
                return;
            }
            
            // 이미 존재하는 학년인지 확인
            if (classStructure.some(g => g.grade === grade)) {
                Utils.showError(`${grade}학년은 이미 존재합니다.`);
                return;
            }
            
            // 학년 추가
            classStructure.push({
                grade,
                classes: []
            });
            
            // 학년 기준으로 정렬
            classStructure.sort((a, b) => a.grade - b.grade);
            
        } else if (modalMode === 'class') {
            // 반 추가
            const classNum = parseInt(newClassInput.value, 10);
            const teacher = newTeacherInput.value.trim();
            
            if (isNaN(classNum) || classNum < 1 || classNum > 20) {
                Utils.showError('유효한 반 번호(1~20)를 입력해주세요.');
                return;
            }
            
            // 선택된 학년 찾기
            const selectedGrade = classStructure.find(g => g.grade.toString() === currentGradeForClass.toString());
            
            if (!selectedGrade) {
                Utils.showError('선택된 학년을 찾을 수 없습니다.');
                return;
            }
            
            // 이미 존재하는 반인지 확인
            if (selectedGrade.classes.some(c => c.id.split('-')[1] === classNum.toString())) {
                Utils.showError(`${currentGradeForClass}학년 ${classNum}반은 이미 존재합니다.`);
                return;
            }
            
            // 반 추가
            selectedGrade.classes.push({
                id: `${currentGradeForClass}-${classNum}`,
                name: `${currentGradeForClass}학년 ${classNum}반`,
                teacher
            });
            
            // 반 번호 기준으로 정렬
            selectedGrade.classes.sort((a, b) => {
                const aNum = parseInt(a.id.split('-')[1], 10);
                const bNum = parseInt(b.id.split('-')[1], 10);
                return aNum - bNum;
            });
        }
        
        // 데이터 저장
        DataManager.saveClasses(classStructure);
        
        // UI 업데이트
        updateClassStructureUI();
        
        // 모달 숨기기
        hideModal();
    };

    /**
     * 학년 삭제 함수
     * @param {number} grade - 삭제할 학년
     */
    const deleteGrade = (grade) => {
        // 삭제 확인
        if (!confirm(`${grade}학년을 삭제하시겠습니까? 관련된 모든 반 정보도 함께 삭제됩니다.`)) {
            return;
        }
        
        // 학년 삭제
        classStructure = classStructure.filter(g => g.grade !== grade);
        
        // 데이터 저장
        DataManager.saveClasses(classStructure);
        
        // UI 업데이트
        updateClassStructureUI();
    };

    /**
     * 반 삭제 함수
     * @param {string} classId - 삭제할 반 ID
     */
    const deleteClass = (classId) => {
        // 삭제 확인
        if (!confirm('이 반을 삭제하시겠습니까?')) {
            return;
        }
        
        // 선택된 학년 찾기
        const selectedGrade = classStructure.find(g => g.grade.toString() === currentGradeForClass.toString());
        
        if (!selectedGrade) return;
        
        // 반 삭제
        selectedGrade.classes = selectedGrade.classes.filter(c => c.id !== classId);
        
        // 데이터 저장
        DataManager.saveClasses(classStructure);
        
        // UI 업데이트
        updateClassList();
    };

    /**
     * 학년/반 구조 UI 업데이트 함수
     */
    const updateClassStructureUI = () => {
        updateClassGradeSelect();
        updateClassList();
        updateExportGradeSelect();
    };

    // 이벤트 리스너
    document.getElementById('addGradeBtn').addEventListener('click', () => showModal('grade'));
    document.getElementById('addClassBtn').addEventListener('click', () => showModal('class'));
    document.getElementById('cancelBtn').addEventListener('click', hideModal);
    document.getElementById('saveBtn').addEventListener('click', saveModalData);

    classGradeSelect.addEventListener('change', (e) => {
        currentGradeForClass = e.target.value;
        updateClassList();
    });

    exportGradeSelect.addEventListener('change', updateExportClassSelect);

    // 초기화
    updateClassStructureUI();
}); 