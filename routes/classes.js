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
        res.json({ budgetStatus });
    } catch (error) {
        console.error('❌ 예산 현황 조회 오류:', error);
        res.status(500).json({ error: '예산 현황을 불러올 수 없습니다.' });
    }
}); 