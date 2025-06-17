const express = require('express');
const router = express.Router();

// 전체 학급 목록 조회
router.get('/', async (req, res) => {
    try {
        const classes = await global.readData('classes');
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: '학급 목록을 불러올 수 없습니다.' });
    }
});

// 전체 학급 설정 조회 (관리자용) - /:classId보다 먼저 정의해야 함
router.get('/settings', async (req, res) => {
    try {
        console.log('🔍 /settings 엔드포인트 호출됨');
        const classes = await global.readData('classes');
        console.log('🔍 읽어온 classes 데이터:', classes);
        console.log('🔍 classes 타입:', typeof classes);
        console.log('🔍 classes 키 개수:', Object.keys(classes || {}).length);
        
        if (!classes || typeof classes !== 'object' || Object.keys(classes).length === 0) {
            console.log('❌ classes 데이터가 없거나 빈 객체입니다');
            return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });
        }
        
        // 학급 설정 정보를 관리자 페이지에서 사용하기 쉬운 형태로 변환
        const settings = Object.keys(classes).map(classId => ({
            classId,
            grade: classes[classId].grade,
            class: classes[classId].class,
            teacher: classes[classId].teacher,
            password: classes[classId].password,
            budget: classes[classId].budget || 500000,
            createdAt: classes[classId].createdAt,
            updatedAt: classes[classId].updatedAt
        }));
        
        console.log('✅ 변환된 settings:', settings);
        res.json(settings);
    } catch (error) {
        console.error('❌ 학급 설정 조회 오류:', error);
        res.status(500).json({ error: '학급 설정을 불러올 수 없습니다.' });
    }
});

// 전체 학급 설정 저장 (관리자용) - POST 엔드포인트 추가
router.post('/settings', async (req, res) => {
    try {
        console.log('💾 POST /settings 엔드포인트 호출됨');
        console.log('📝 요청 본문:', req.body);
        
        const { classId, teacher, password, budget } = req.body;
        
        // 입력 검증
        if (!classId || !teacher) {
            return res.status(400).json({ error: '학급 ID와 담임교사는 필수입니다.' });
        }
        
        const classes = await global.readData('classes');
        console.log('📚 현재 classes 데이터:', classes);
        
        const isNewClass = !classes[classId];
        
        if (isNewClass) {
            console.log('🆕 새로운 학급 생성:', classId);
            
            // classId에서 학년, 반 추출
            const [grade, classNum] = classId.split('-').map(Number);
            
            // 현재 전체 예산 총합 계산
            const currentTotalBudget = Object.values(classes).reduce((sum, cls) => sum + (cls.budget || 0), 0);
            console.log('💰 현재 전체 예산 총합:', currentTotalBudget);
            
            // 새 학급 포함 총 학급 수
            const totalClassCount = Object.keys(classes).length + 1;
            console.log('🏫 새 학급 포함 총 학급 수:', totalClassCount);
            
            // 사용자가 예산을 직접 입력했는지 확인
            let finalBudget;
            if (budget && parseInt(budget) > 0) {
                finalBudget = parseInt(budget);
                console.log('👤 사용자가 직접 입력한 예산:', finalBudget);
            } else if (currentTotalBudget > 0) {
                // 기존 예산이 있으면 균등분배
                finalBudget = Math.floor(currentTotalBudget / totalClassCount);
                console.log('⚖️ 자동 균등분배 예산:', finalBudget);
            } else {
                // 첫 번째 학급이거나 기존 예산이 없으면 기본값
                finalBudget = 500000;
                console.log('🔧 기본 예산 적용:', finalBudget);
            }
            
            // 새 학급 생성
            const newClass = {
                grade: grade,
                class: classNum,
                teacher: teacher.trim(),
                password: password || `class${grade}${classNum}^^`,
                budget: finalBudget,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            classes[classId] = newClass;
            
            // 만약 자동 균등분배된 경우, 기존 학급들도 예산 재조정
            if (!budget && currentTotalBudget > 0 && totalClassCount > 1) {
                console.log('🔄 기존 학급들 예산 재조정 시작...');
                Object.keys(classes).forEach(existingClassId => {
                    if (existingClassId !== classId) {
                        classes[existingClassId].budget = finalBudget;
                        classes[existingClassId].updatedAt = new Date().toISOString();
                    }
                });
                console.log('✅ 모든 학급 예산 균등분배 완료:', finalBudget);
            }
            
            console.log('🆕 생성된 새 학급:', newClass);
            
        } else {
            console.log('✏️ 기존 학급 업데이트:', classId);
            
            // 기존 학급 정보 업데이트
            const updatedClass = {
                ...classes[classId],
                teacher: teacher.trim(),
                password: password || classes[classId].password || `class${classes[classId].grade}${classes[classId].class}^^`,
                budget: budget ? parseInt(budget) : (classes[classId].budget || 500000),
                updatedAt: new Date().toISOString()
            };
            
            classes[classId] = updatedClass;
            console.log('🔄 업데이트된 학급 정보:', updatedClass);
        }
        
        const success = await global.writeData('classes', classes);
        
        if (success) {
            console.log('✅ 학급 설정 저장 성공');
            
            const responseData = {
                message: isNewClass ? '새 학급이 생성되었습니다.' : '학급 설정이 저장되었습니다.',
                classInfo: classes[classId],
                isNewClass: isNewClass
            };
            
            // 자동 재분배가 발생했을 때 추가 정보
            if (isNewClass && !budget) {
                const currentTotalBudget = Object.values(classes).reduce((sum, cls) => sum + (cls.budget || 0), 0);
                const totalClassCount = Object.keys(classes).length;
                
                if (totalClassCount > 1 && currentTotalBudget > 0) {
                    responseData.autoRedistributed = true;
                    responseData.newBudgetPerClass = classes[classId].budget;
                    responseData.totalClasses = totalClassCount;
                    responseData.message += ` 전체 예산이 ${totalClassCount}개 학급으로 균등분배되었습니다.`;
                }
            }
            
            res.json(responseData);
        } else {
            console.error('❌ 학급 설정 저장 실패');
            res.status(500).json({ error: '학급 설정 저장에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('❌ 학급 설정 저장 오류:', error);
        res.status(500).json({ error: '학급 설정 저장 중 오류가 발생했습니다.' });
    }
});

// 전체 학급 예산 현황 조회 (관리자용) - /:classId보다 먼저 정의해야 함
router.get('/budget-status', async (req, res) => {
    try {
        console.log('🔍 /budget-status 엔드포인트 호출됨');
        const classes = await global.readData('classes');
        const applications = await global.readData('applications');
        console.log('🔍 classes 데이터:', classes);
        console.log('🔍 applications 데이터 개수:', applications?.length || 0);
        
        if (!classes || typeof classes !== 'object' || Object.keys(classes).length === 0) {
            console.log('❌ classes 데이터가 없거나 빈 객체입니다');
            return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });
        }
        
        // 각 학급별 예산 현황 계산
        const budgetStatusArr = Object.keys(classes).map(classId => {
            const classInfo = classes[classId];
            const classApplications = applications.filter(app => app.classId === classId);
            
            const totalBudget = classInfo.budget || 500000;
            const usedBudget = classApplications.reduce((sum, app) => sum + (app.price || 0), 0);
            const remainingBudget = totalBudget - usedBudget;
            const percentage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
            
            return {
                classId,
                grade: classInfo.grade,
                class: classInfo.class,
                teacher: classInfo.teacher,
                budget: totalBudget,
                usedBudget,
                remainingBudget,
                usagePercentage: percentage,
                totalBooks: classApplications.length,
                studentBooks: classApplications.filter(app => !app.isTeacherBook).length,
                teacherBooks: classApplications.filter(app => app.isTeacherBook).length
            };
        });
        // 배열을 객체로 변환
        const budgetStatus = {};
        budgetStatusArr.forEach(item => {
            budgetStatus[item.classId] = item;
        });
        console.log('💰 예산 현황 데이터:', budgetStatus);
        res.json({ budgetStatus });
    } catch (error) {
        console.error('❌ 예산 현황 조회 오류:', error);
        res.status(500).json({ error: '예산 현황을 불러올 수 없습니다.' });
    }
});

// 전체 학급 통계 조회 (관리자용) - /:classId보다 먼저 정의
router.get('/admin/stats', async (req, res) => {
    try {
        const applications = await global.readData('applications');
        const classes = await global.readData('classes');
        
        const totalBooks = applications.length;
        const totalAmount = applications.reduce((sum, app) => sum + (app.price || 0), 0);
        
        // 활성 학급 수 (신청이 있는 학급)
        const activeClassIds = new Set(applications.map(app => app.classId));
        const activeClasses = activeClassIds.size;
        
        // 학급별 예산 사용률
        const classStats = {};
        Object.keys(classes).forEach(classId => {
            const classApplications = applications.filter(app => app.classId === classId);
            const totalBudget = classes[classId].budget || 500000;
            const usedBudget = classApplications.reduce((sum, app) => sum + (app.price || 0), 0);
            const percentage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
            
            classStats[classId] = {
                ...classes[classId],
                totalBooks: classApplications.length,
                budget: {
                    total: totalBudget,
                    used: usedBudget,
                    percentage
                }
            };
        });
        
        // 평균 예산 사용률
        const usageRates = Object.values(classStats)
            .filter(cls => cls.totalBooks > 0)
            .map(cls => cls.budget.percentage);
        
        const avgBudgetUsage = usageRates.length > 0 
            ? Math.round(usageRates.reduce((sum, rate) => sum + rate, 0) / usageRates.length)
            : 0;
        
        res.json({
            overview: {
                totalBooks,
                totalAmount,
                activeClasses,
                avgBudgetUsage
            },
            classStats,
            recentApplications: applications
                .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
                .slice(0, 20)
        });
        
    } catch (error) {
        console.error('전체 통계 조회 오류:', error);
        res.status(500).json({ error: '통계를 불러올 수 없습니다.' });
    }
});

// 전체 신청 도서 목록 반환 (관리자용)
router.get('/admin/all-applications', async (req, res) => {
    try {
        const applications = await global.readData('applications');
        res.json({ applications });
    } catch (error) {
        console.error('전체 신청 도서 목록 조회 오류:', error);
        res.status(500).json({ error: '전체 신청 도서 목록을 불러올 수 없습니다.' });
    }
});

// 특정 학급 정보 조회 - 정적 라우터들 다음에 정의
router.get('/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const classes = await global.readData('classes');
        
        const classInfo = classes[classId];
        if (!classInfo) {
            return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });
        }
        
        res.json(classInfo);
    } catch (error) {
        res.status(500).json({ error: '학급 정보를 불러올 수 없습니다.' });
    }
});

// 학급 정보 업데이트 (담임교사 등)
router.put('/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const { teacher, grade, classNum, password, budget } = req.body;
        
        const classes = await global.readData('classes');
        
        if (!classes[classId]) {
            return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });
        }
        
        // 학급 정보 업데이트
        classes[classId] = {
            grade: parseInt(grade),
            class: parseInt(classNum),
            teacher: teacher.trim(),
            password: password || `class${grade}${classNum}^^`,
            budget: budget || 500000,
            createdAt: classes[classId]?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const success = await global.writeData('classes', classes);
        if (success) {
            res.json(classes[classId]);
        } else {
            res.status(500).json({ error: '학급 정보 저장에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('학급 정보 업데이트 오류:', error);
        res.status(500).json({ error: '학급 정보 업데이트 중 오류가 발생했습니다.' });
    }
});

// 학급별 예산 조회
router.get('/:classId/budget', async (req, res) => {
    try {
        const { classId } = req.params;
        const budgets = await global.readData('budgets');
        
        const budget = budgets[classId] || 500000;
        res.json({ classId, budget });
        
    } catch (error) {
        res.status(500).json({ error: '예산 정보를 불러올 수 없습니다.' });
    }
});

// 학급별 예산 설정
router.put('/:classId/budget', async (req, res) => {
    try {
        const { classId } = req.params;
        const { budget } = req.body;
        
        if (!budget || budget < 0) {
            return res.status(400).json({ error: '올바른 예산을 입력해주세요.' });
        }
        
        const budgets = await global.readData('budgets');
        budgets[classId] = parseInt(budget);
        
        const success = await global.writeData('budgets', budgets);
        if (success) {
            res.json({ classId, budget: budgets[classId] });
        } else {
            res.status(500).json({ error: '예산 저장에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('예산 설정 오류:', error);
        res.status(500).json({ error: '예산 설정 중 오류가 발생했습니다.' });
    }
});

// 학급별 통계 조회
router.get('/:classId/stats', async (req, res) => {
    try {
        const { classId } = req.params;
        const applications = await global.readData('applications');
        const budgets = await global.readData('budgets');
        
        const classApplications = applications.filter(app => app.classId === classId);
        const totalBudget = budgets[classId] || 500000;
        const usedBudget = classApplications.reduce((sum, app) => sum + (app.price || 0), 0);
        const remainingBudget = totalBudget - usedBudget;
        const percentage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
        
        const studentBooks = classApplications.filter(app => !app.isTeacherBook).length;
        const teacherBooks = classApplications.filter(app => app.isTeacherBook).length;
        
        res.json({
            classId,
            totalBooks: classApplications.length,
            studentBooks,
            teacherBooks,
            budget: {
                total: totalBudget,
                used: usedBudget,
                remaining: remainingBudget,
                percentage
            },
            recentApplications: classApplications
                .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
                .slice(0, 5)
        });
        
    } catch (error) {
        console.error('학급 통계 조회 오류:', error);
        res.status(500).json({ error: '학급 통계를 불러올 수 없습니다.' });
    }
});

// 전체 예산 균등 분배
router.post('/budget/distribute', async (req, res) => {
    try {
        const { totalBudget } = req.body;
        console.log('💰 전체 예산 균등 분배 요청:', totalBudget);
        
        if (!totalBudget || totalBudget <= 0) {
            return res.status(400).json({ error: '올바른 예산을 입력해주세요.' });
        }
        
        const classes = await global.readData('classes');
        const classIds = Object.keys(classes);
        
        if (classIds.length === 0) {
            return res.status(400).json({ error: '등록된 학급이 없습니다.' });
        }
        
        const budgetPerClass = Math.floor(totalBudget / classIds.length);
        console.log(`💰 학급당 배정 예산: ${budgetPerClass}원 (총 ${classIds.length}개 학급)`);
        
        // 모든 학급의 예산 업데이트
        classIds.forEach(classId => {
            console.log(`💰 ${classId} 예산 업데이트: ${classes[classId].budget} → ${budgetPerClass}`);
            classes[classId].budget = budgetPerClass;
            classes[classId].updatedAt = new Date().toISOString();
        });
        
        const success = await global.writeData('classes', classes);
        
        if (success) {
            console.log('✅ 전체 예산 균등 분배 완료');
            res.json({
                message: `전체 예산 ${totalBudget.toLocaleString()}원이 ${classIds.length}개 학급에 균등 분배되었습니다.`,
                totalBudget: totalBudget,
                classCount: classIds.length,
                budgetPerClass: budgetPerClass
            });
        } else {
            console.error('❌ 예산 분배 실패');
            res.status(500).json({ error: '예산 분배에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('❌ 전체 예산 분배 오류:', error);
        res.status(500).json({ error: '예산 분배 중 오류가 발생했습니다.' });
    }
});

// 학급 삭제 (예산 재분배 포함)
router.delete('/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        console.log('🗑️ 학급 삭제 요청:', classId);
        
        const classes = await global.readData('classes');
        const applications = await global.readData('applications');
        
        if (!classes[classId]) {
            return res.status(404).json({ error: '삭제할 학급을 찾을 수 없습니다.' });
        }
        
        const classToDelete = classes[classId];
        console.log('🗑️ 삭제할 학급 정보:', classToDelete);
        
        // 해당 학급의 신청 내역이 있는지 확인
        const classApplications = applications.filter(app => app.classId === classId);
        if (classApplications.length > 0) {
            console.log('⚠️ 신청 내역이 있는 학급 삭제 시도:', classApplications.length);
            return res.status(400).json({ 
                error: `삭제하려는 학급에 ${classApplications.length}개의 도서 신청 내역이 있습니다. 먼저 신청 내역을 정리해주세요.`,
                hasApplications: true,
                applicationCount: classApplications.length
            });
        }
        
        // 삭제 전 전체 예산 계산 (classes 객체의 budget 속성 사용)
        const currentTotalBudget = Object.values(classes).reduce((sum, cls) => sum + (cls.budget || 0), 0);
        const deletedClassBudget = classToDelete.budget || 0;
        // 삭제된 학급의 예산도 재분배에 포함
        const totalBudgetToRedistribute = currentTotalBudget;
        
        console.log('💰 삭제 전 전체 예산:', currentTotalBudget);
        console.log('💰 삭제 학급 예산:', deletedClassBudget);
        console.log('💰 재분배할 총 예산:', totalBudgetToRedistribute);
        
        // 학급 삭제
        delete classes[classId];
        
        const remainingClassCount = Object.keys(classes).length;
        console.log('🏫 삭제 후 남은 학급 수:', remainingClassCount);
        
        let budgetRedistributed = false;
        let newBudgetPerClass = 0;
        
        // 남은 학급들 간 예산 재분배 (삭제된 학급의 예산도 포함해서 재분배)
        if (remainingClassCount > 0 && totalBudgetToRedistribute > 0) {
            newBudgetPerClass = Math.floor(totalBudgetToRedistribute / remainingClassCount);
            console.log('⚖️ 재분배 후 학급당 예산:', newBudgetPerClass);
            
            // 모든 남은 학급의 예산 업데이트
            Object.keys(classes).forEach(remainingClassId => {
                const oldBudget = classes[remainingClassId].budget;
                console.log(`💰 ${remainingClassId} 예산 업데이트: ${oldBudget} → ${newBudgetPerClass}`);
                classes[remainingClassId].budget = newBudgetPerClass;
                classes[remainingClassId].updatedAt = new Date().toISOString();
            });
            
            budgetRedistributed = true;
            console.log('🔄 남은 학급들 예산 재분배 완료');
        }
        
        // 데이터 저장
        const success = await global.writeData('classes', classes);
        
        if (success) {
            console.log('✅ 학급 삭제 및 예산 재분배 성공');
            
            const responseData = {
                message: `${classToDelete.grade}학년 ${classToDelete.class}반이 삭제되었습니다.`,
                deletedClass: classToDelete,
                budgetRedistributed: budgetRedistributed
            };
            
            if (budgetRedistributed) {
                responseData.message += ` 남은 ${remainingClassCount}개 학급으로 예산이 균등분배되었습니다.`;
                responseData.redistributionInfo = {
                    previousTotalBudget: currentTotalBudget,
                    deletedClassBudget: deletedClassBudget,
                    newTotalBudget: newBudgetPerClass * remainingClassCount,
                    newBudgetPerClass: newBudgetPerClass,
                    remainingClassCount: remainingClassCount
                };
            }
            
            res.json(responseData);
        } else {
            console.error('❌ 학급 삭제 실패');
            res.status(500).json({ error: '학급 삭제에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('❌ 학급 삭제 오류:', error);
        res.status(500).json({ error: '학급 삭제 중 오류가 발생했습니다.' });
    }
});

// 학급 비밀번호 인증
router.post('/authenticate', async (req, res) => {
    try {
        const { classId, password } = req.body;
        
        if (!classId || !password) {
            return res.status(400).json({ error: '학급과 비밀번호를 모두 입력해주세요.' });
        }
        
        const classes = await global.readData('classes');
        const classData = classes[classId];
        
        if (!classData) {
            return res.status(404).json({ error: '존재하지 않는 학급입니다.' });
        }
        
        if (classData.password !== password) {
            return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
        }
        
        // 인증 성공
        res.json({
            success: true,
            message: '학급 인증이 완료되었습니다.',
            classInfo: {
                classId,
                grade: classData.grade,
                class: classData.class,
                teacher: classData.teacher,
                budget: classData.budget
            }
        });
        
    } catch (error) {
        console.error('학급 인증 오류:', error);
        res.status(500).json({ error: '학급 인증 중 오류가 발생했습니다.' });
    }
});

// 학급 목록 조회 (인증용)
router.get('/list', async (req, res) => {
    try {
        const classes = await global.readData('classes');
        
        const classList = Object.values(classes).map(cls => ({
            classId: cls.classId,
            grade: cls.grade,
            class: cls.class,
            teacher: cls.teacher || '담임 미배정'
        })).sort((a, b) => {
            if (a.grade !== b.grade) return a.grade - b.grade;
            return a.class - b.class;
        });
        
        res.json(classList);
        
    } catch (error) {
        console.error('학급 목록 조회 오류:', error);
        res.status(500).json({ error: '학급 목록을 불러올 수 없습니다.' });
    }
});

// 예시: grade, class 쿼리 파라미터를 classId로 변환
function getClassIdFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const grade = urlParams.get('grade');
    const classNum = urlParams.get('class');
    if (grade && classNum) {
        return `${grade}-${classNum}`;
    }
    return null;
}

module.exports = router;