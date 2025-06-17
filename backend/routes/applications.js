const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// 전체 신청 목록 조회
router.get('/', async (req, res) => {
    try {
        const applications = await global.readData('applications');
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: '신청 목록을 불러올 수 없습니다.' });
    }
});

// 학급별 신청 목록 조회
router.get('/class/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const applications = await global.readData('applications');
        const classApplications = applications.filter(app => app.classId === classId);
        res.json(classApplications);
    } catch (error) {
        res.status(500).json({ error: '학급 신청 목록을 불러올 수 없습니다.' });
    }
});

// 신청 추가
router.post('/', async (req, res) => {
    try {
        const { classId, isbn, title, author, publisher, price, cover, isTeacherBook } = req.body;
        
        // 입력 검증
        if (!classId || !isbn || !title || !author || !publisher || price === undefined) {
            return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
        }
        
        const applications = await global.readData('applications');
        const ownedBooks = await global.readData('ownedBooks');
        const classes = await global.readData('classes');
        
        // 중복 신청 확인
        const isDuplicate = applications.some(app => 
            app.classId === classId && app.isbn === isbn
        );
        
        if (isDuplicate) {
            return res.status(400).json({ error: '이미 신청한 도서입니다.' });
        }
        
        // 기보유 도서 확인
        const isOwned = ownedBooks.some(book => book.isbn === isbn);
        if (isOwned) {
            return res.status(400).json({ error: '이미 보유한 도서입니다.' });
        }
        
        // 예산 확인
        const classInfo = classes[classId];
        if (!classInfo) {
            return res.status(404).json({ error: '학급 정보를 찾을 수 없습니다.' });
        }
        
        const classBudget = classInfo.budget || 500000;
        const usedBudget = applications
            .filter(app => app.classId === classId)
            .reduce((sum, app) => sum + (app.price || 0), 0);
        
        if (usedBudget + price > classBudget) {
            return res.status(400).json({ error: '예산을 초과합니다.' });
        }
        
        // 새 신청 생성
        const newApplication = {
            id: uuidv4(),
            classId,
            isbn,
            title,
            author,
            publisher,
            price: parseInt(price),
            cover: cover || null,
            isTeacherBook: Boolean(isTeacherBook),
            appliedAt: new Date().toISOString()
        };
        
        applications.push(newApplication);
        
        const success = await global.writeData('applications', applications);
        
        if (success) {
            res.json({
                message: '도서 신청이 완료되었습니다.',
                application: newApplication
            });
        } else {
            res.status(500).json({ error: '도서 신청 저장에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('도서 신청 오류:', error);
        res.status(500).json({ error: '도서 신청 중 오류가 발생했습니다.' });
    }
});

// 신청 삭제
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const applications = await global.readData('applications');
        
        const applicationIndex = applications.findIndex(app => app.id === id);
        if (applicationIndex === -1) {
            return res.status(404).json({ error: '신청을 찾을 수 없습니다.' });
        }
        
        const deletedApplication = applications.splice(applicationIndex, 1)[0];
        
        const success = await global.writeData('applications', applications);
        if (success) {
            res.json({ message: '신청이 취소되었습니다.', application: deletedApplication });
        } else {
            res.status(500).json({ error: '신청 취소에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('신청 삭제 오류:', error);
        res.status(500).json({ error: '신청 취소 중 오류가 발생했습니다.' });
    }
});

// 학급별 예산 현황 조회
router.get('/budget/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const applications = await global.readData('applications');
        const classes = await global.readData('classes');
        
        const classInfo = classes[classId];
        if (!classInfo) {
            return res.status(404).json({ error: '학급 정보를 찾을 수 없습니다.' });
        }
        
        const totalBudget = classInfo.budget || 500000;
        const usedBudget = applications
            .filter(app => app.classId === classId)
            .reduce((sum, app) => sum + (app.price || 0), 0);
        
        const remainingBudget = totalBudget - usedBudget;
        const percentage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
        
        res.json({
            classId,
            total: totalBudget,
            used: usedBudget,
            remaining: remainingBudget,
            percentage
        });
        
    } catch (error) {
        console.error('예산 조회 오류:', error);
        res.status(500).json({ error: '예산 정보를 불러올 수 없습니다.' });
    }
});

// 중복 신청 확인
router.get('/check-duplicate/:classId/:isbn', async (req, res) => {
    try {
        const { classId, isbn } = req.params;
        const applications = await global.readData('applications');
        const ownedBooks = await global.readData('ownedBooks');
        
        const isDuplicate = applications.some(app => 
            app.classId === classId && app.isbn === isbn
        );
        
        const isOwned = ownedBooks.some(book => book.isbn === isbn);
        
        res.json({
            isDuplicate,
            isOwned,
            canApply: !isDuplicate && !isOwned
        });
        
    } catch (error) {
        console.error('중복 확인 오류:', error);
        res.status(500).json({ error: '중복 확인 중 오류가 발생했습니다.' });
    }
});

module.exports = router; 