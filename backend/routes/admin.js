const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { backupManager } = require('../utils/backup');

// 관리자 설정 상태 확인
router.get('/status', async (req, res) => {
    try {
        const adminData = await global.readData('admin');
        res.json({
            success: true,
            isSetup: adminData.isSetup || false
        });
    } catch (error) {
        console.error('관리자 상태 확인 오류:', error);
        res.status(500).json({ success: false, error: '상태 확인 실패' });
    }
});

// 관리자 계정 설정
router.post('/setup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력하세요' });
        }
        
        // 비밀번호 해시 생성
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        const adminData = {
            isSetup: true,
            email: email,
            passwordHash: passwordHash,
            verificationTokens: {},
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };
        
        await global.writeData('admin', adminData);
        
        res.json({
            success: true,
            message: '관리자 계정이 성공적으로 설정되었습니다'
        });
    } catch (error) {
        console.error('관리자 설정 오류:', error);
        res.status(500).json({ success: false, error: '계정 설정 실패' });
    }
});

// 관리자 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력하세요' });
        }
        
        const adminData = await global.readData('admin');
        
        if (!adminData.isSetup) {
            return res.status(400).json({ success: false, error: '관리자 계정이 설정되지 않았습니다' });
        }
        
        // 비밀번호 확인
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        if (adminData.email !== email || adminData.passwordHash !== passwordHash) {
            return res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 틀렸습니다' });
        }
        
        // 로그인 성공 - 세션 토큰 생성
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const loginTime = new Date().toISOString();
        
        // 관리자 데이터 업데이트
        adminData.lastLoginAt = loginTime;
        adminData.sessionToken = sessionToken;
        adminData.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간 후 만료
        
        await global.writeData('admin', adminData);
        
        res.json({
            success: true,
            message: '로그인 성공',
            sessionToken: sessionToken,
            email: email,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24시간 후
            loginTime: loginTime
        });
    } catch (error) {
        console.error('관리자 로그인 오류:', error);
        res.status(500).json({ success: false, error: '로그인 처리 실패' });
    }
});

// 관리자 로그아웃
router.post('/logout', async (req, res) => {
    try {
        const { sessionToken } = req.body;
        
        const adminData = await global.readData('admin');
        
        if (adminData.sessionToken === sessionToken) {
            // 세션 토큰 제거
            delete adminData.sessionToken;
            delete adminData.tokenExpiry;
            await global.writeData('admin', adminData);
        }
        
        res.json({
            success: true,
            message: '로그아웃 성공'
        });
    } catch (error) {
        console.error('관리자 로그아웃 오류:', error);
        res.status(500).json({ success: false, error: '로그아웃 처리 실패' });
    }
});

// 세션 확인
router.post('/verify', async (req, res) => {
    try {
        const { sessionToken } = req.body;
        
        if (!sessionToken) {
            return res.status(401).json({ success: false, error: '세션 토큰이 필요합니다' });
        }
        
        const adminData = await global.readData('admin');
        
        if (!adminData.sessionToken || adminData.sessionToken !== sessionToken) {
            return res.status(401).json({ success: false, error: '유효하지 않은 세션입니다' });
        }
        
        // 토큰 만료 확인
        if (adminData.tokenExpiry && new Date() > new Date(adminData.tokenExpiry)) {
            return res.status(401).json({ success: false, error: '세션이 만료되었습니다' });
        }
        
        res.json({
            success: true,
            email: adminData.email,
            loginTime: adminData.lastLoginAt
        });
    } catch (error) {
        console.error('세션 확인 오류:', error);
        res.status(500).json({ success: false, error: '세션 확인 실패' });
    }
});

// 관리자 설정 상태 확인 (setup-status 엔드포인트)
router.get('/setup-status', async (req, res) => {
    try {
        const adminData = await global.readData('admin');
        res.json({
            success: true,
            isSetup: adminData.isSetup || false
        });
    } catch (error) {
        console.error('관리자 상태 확인 오류:', error);
        res.status(500).json({ success: false, error: '상태 확인 실패' });
    }
});

// 관리자 프로필 조회
router.get('/profile', async (req, res) => {
    try {
        const adminData = await global.readData('admin');
        
        if (!adminData.isSetup) {
            return res.status(400).json({ success: false, error: '관리자 계정이 설정되지 않았습니다' });
        }
        
        res.json({
            success: true,
            email: adminData.email,
            lastLoginAt: adminData.lastLoginAt,
            createdAt: adminData.createdAt
        });
    } catch (error) {
        console.error('관리자 프로필 조회 오류:', error);
        res.status(500).json({ success: false, error: '프로필 조회 실패' });
    }
});

// 인증 요청 (개발용)
router.post('/request-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: '이메일을 입력하세요' });
        }
        
        // 개발 환경에서는 간단한 토큰 생성
        const token = crypto.randomBytes(16).toString('hex');
        const verificationUrl = `${req.protocol}://${req.get('host')}/admin/verify?token=${token}&email=${encodeURIComponent(email)}`;
        
        res.json({
            success: true,
            message: '개발 모드: 아래 링크를 클릭하여 계정을 설정하세요',
            verificationUrl: verificationUrl,
            token: token,
            email: email
        });
    } catch (error) {
        console.error('인증 요청 오류:', error);
        res.status(500).json({ success: false, error: '인증 요청 실패' });
    }
});

// 토큰 검증 (개발용)
router.get('/verify-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const email = req.query.email;
        
        if (!token || !email) {
            return res.status(400).json({ success: false, error: '토큰 또는 이메일이 없습니다' });
        }
        
        // 개발 환경에서는 모든 토큰을 유효한 것으로 처리
        res.json({
            success: true,
            valid: true,
            email: email
        });
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(500).json({ success: false, error: '토큰 검증 실패' });
    }
});

// 비밀번호 설정 (토큰 기반)
router.post('/set-password', async (req, res) => {
    try {
        const { token, password, email } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, error: '비밀번호를 입력하세요' });
        }
        
        // 이메일이 없으면 토큰에서 추출 (개발용)
        const adminEmail = email || 'admin@school.edu';
        
        // 비밀번호 해시 생성
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        const adminData = {
            isSetup: true,
            email: adminEmail,
            passwordHash: passwordHash,
            verificationTokens: {},
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };
        
        await global.writeData('admin', adminData);
        
        res.json({
            success: true,
            message: '관리자 계정이 성공적으로 설정되었습니다'
        });
    } catch (error) {
        console.error('관리자 설정 오류:', error);
        res.status(500).json({ success: false, error: '계정 설정 실패' });
    }
});

// 관리자 설정 상태 확인 (setup-status 엔드포인트)
router.get('/setup-status', async (req, res) => {
    try {
        const adminData = await global.readData('admin');
        res.json({
            success: true,
            isSetup: adminData.isSetup || false
        });
    } catch (error) {
        console.error('관리자 상태 확인 오류:', error);
        res.status(500).json({ success: false, error: '상태 확인 실패' });
    }
});

// 관리자 프로필 조회
router.get('/profile', async (req, res) => {
    try {
        const adminData = await global.readData('admin');
        
        if (!adminData.isSetup) {
            return res.status(400).json({ success: false, error: '관리자 계정이 설정되지 않았습니다' });
        }
        
        res.json({
            success: true,
            email: adminData.email,
            lastLoginAt: adminData.lastLoginAt,
            createdAt: adminData.createdAt
        });
    } catch (error) {
        console.error('관리자 프로필 조회 오류:', error);
        res.status(500).json({ success: false, error: '프로필 조회 실패' });
    }
});

// 인증 요청 (개발용)
router.post('/request-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: '이메일을 입력하세요' });
        }
        
        // 개발 환경에서는 간단한 토큰 생성
        const token = crypto.randomBytes(16).toString('hex');
        const verificationUrl = `${req.protocol}://${req.get('host')}/admin/verify?token=${token}&email=${encodeURIComponent(email)}`;
        
        res.json({
            success: true,
            message: '개발 모드: 아래 링크를 클릭하여 계정을 설정하세요',
            verificationUrl: verificationUrl,
            token: token,
            email: email
        });
    } catch (error) {
        console.error('인증 요청 오류:', error);
        res.status(500).json({ success: false, error: '인증 요청 실패' });
    }
});

// 토큰 검증 (개발용)
router.get('/verify-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const email = req.query.email;
        
        if (!token || !email) {
            return res.status(400).json({ success: false, error: '토큰 또는 이메일이 없습니다' });
        }
        
        // 개발 환경에서는 모든 토큰을 유효한 것으로 처리
        res.json({
            success: true,
            valid: true,
            email: email
        });
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(500).json({ success: false, error: '토큰 검증 실패' });
    }
});

// 비밀번호 설정 (토큰 기반)
router.post('/set-password', async (req, res) => {
    try {
        const { token, password, email } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, error: '비밀번호를 입력하세요' });
        }
        
        // 이메일이 없으면 토큰에서 추출 (개발용)
        const adminEmail = email || 'admin@school.edu';
        
        // 비밀번호 해시 생성
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        const adminData = {
            isSetup: true,
            email: adminEmail,
            passwordHash: passwordHash,
            verificationTokens: {},
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };
        
        await global.writeData('admin', adminData);
        
        res.json({
            success: true,
            message: '관리자 계정이 성공적으로 설정되었습니다'
        });
    } catch (error) {
        console.error('관리자 설정 오류:', error);
        res.status(500).json({ success: false, error: '계정 설정 실패' });
    }
});

// 예산 요약 조회
router.get('/budget/summary', async (req, res) => {
    try {
        // system-config.json에서 전체 예산 읽기
        const systemConfig = await global.readData('systemConfig') || { totalBudget: 3500000 };
        const classes = await global.readData('classes');
        const classCount = Object.keys(classes).length;
        const classBudget = Math.floor(systemConfig.totalBudget / classCount);
        
        res.json({
            success: true,
            totalBudget: systemConfig.totalBudget,
            classCount: classCount,
            classBudget: classBudget
        });
    } catch (error) {
        console.error('예산 요약 조회 실패:', error);
        res.status(500).json({ success: false, error: '예산 정보 조회 실패' });
    }
});

// 전체 예산 설정
router.post('/budget/total', async (req, res) => {
    try {
        const { totalBudget } = req.body;
        
        if (!totalBudget || totalBudget < 0) {
            return res.status(400).json({ success: false, error: '유효한 예산을 입력하세요' });
        }
        
        // 1. 시스템 설정 업데이트
        const systemConfig = {
            totalBudget: totalBudget,
            lastUpdated: new Date().toISOString()
        };
        await global.writeData('systemConfig', systemConfig);
        
        // 2. 학급별 예산 계산
        const classes = await global.readData('classes');
        const classCount = Object.keys(classes).length;
        const classBudget = Math.floor(totalBudget / classCount);
        
        // 3. 모든 학급 예산 업데이트
        for (const classId in classes) {
            classes[classId].budget = classBudget;
            classes[classId].updatedAt = new Date().toISOString();
        }
        await global.writeData('classes', classes);
        
        console.log(`💰 전체 예산: ${totalBudget.toLocaleString()}원`);
        console.log(`💰 학급별 예산: ${classBudget.toLocaleString()}원 (${classCount}개 학급)`);
        
        res.json({
            success: true,
            message: '예산이 성공적으로 설정되었습니다',
            totalBudget: totalBudget,
            classBudget: classBudget,
            classCount: classCount
        });
    } catch (error) {
        console.error('전체 예산 설정 실패:', error);
        res.status(500).json({ success: false, error: '예산 설정 실패' });
    }
});

// 백업 목록 조회
router.get('/backups', async (req, res) => {
    try {
        const backups = await backupManager.getBackupList();
        res.json(backups);
    } catch (error) {
        console.error('백업 목록 조회 오류:', error);
        res.status(500).json({ error: '백업 목록을 불러올 수 없습니다.' });
    }
});

// 수동 백업 생성
router.post('/backups', async (req, res) => {
    try {
        const { description } = req.body;
        const backup = await backupManager.createManualBackup(description || '수동 백업');
        res.json({
            message: '백업이 성공적으로 생성되었습니다.',
            backup
        });
    } catch (error) {
        console.error('백업 생성 오류:', error);
        res.status(500).json({ error: '백업 생성에 실패했습니다.' });
    }
});

// 백업 복원
router.post('/backups/:backupName/restore', async (req, res) => {
    try {
        const { backupName } = req.params;
        const { selectedFiles } = req.body;
        
        const result = await backupManager.restoreBackup(backupName, selectedFiles);
        res.json({
            message: '백업이 성공적으로 복원되었습니다.',
            ...result
        });
    } catch (error) {
        console.error('백업 복원 오류:', error);
        res.status(500).json({ error: '백업 복원에 실패했습니다.' });
    }
});

// 백업 삭제
router.delete('/backups/:backupName', async (req, res) => {
    try {
        const { backupName } = req.params;
        await backupManager.deleteBackup(backupName);
        res.json({ message: '백업이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('백업 삭제 오류:', error);
        res.status(500).json({ error: '백업 삭제에 실패했습니다.' });
    }
});



module.exports = router; 