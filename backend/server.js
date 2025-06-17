const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const { BackupManager, backupManager, writeDataWithBackup } = require('./utils/backup');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙 (public_html)
app.use(express.static(path.join(__dirname, '../public_html')));

// 데이터 디렉토리 초기화
async function initializeDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch (error) {
        await fs.mkdir(dataDir, { recursive: true });
        console.log('데이터 디렉토리가 생성되었습니다.');
    }

    // 기본 학급 구조 정의
    const defaultClasses = {
        "1-1": { grade: 1, class: 1, classId: "1-1", teacher: "", password: "class2024!", budget: 500000 },
        "1-2": { grade: 1, class: 2, classId: "1-2", teacher: "", password: "class2024!", budget: 500000 },
        "2-1": { grade: 2, class: 1, classId: "2-1", teacher: "", password: "class2024!", budget: 500000 },
        "2-2": { grade: 2, class: 2, classId: "2-2", teacher: "", password: "class2024!", budget: 500000 },
        "3-1": { grade: 3, class: 1, classId: "3-1", teacher: "", password: "class2024!", budget: 500000 },
        "3-2": { grade: 3, class: 2, classId: "3-2", teacher: "", password: "class2024!", budget: 500000 },
        "4-1": { grade: 4, class: 1, classId: "4-1", teacher: "", password: "class2024!", budget: 500000 },
        "4-2": { grade: 4, class: 2, classId: "4-2", teacher: "", password: "class2024!", budget: 500000 },
        "5-1": { grade: 5, class: 1, classId: "5-1", teacher: "", password: "class2024!", budget: 500000 },
        "5-2": { grade: 5, class: 2, classId: "5-2", teacher: "", password: "class2024!", budget: 500000 },
        "6-1": { grade: 6, class: 1, classId: "6-1", teacher: "", password: "class2024!", budget: 500000 },
        "6-2": { grade: 6, class: 2, classId: "6-2", teacher: "", password: "class2024!", budget: 500000 }
    };

    // 기본 데이터 파일들 초기화 (classes.json 제외)
    const files = [
        { name: 'applications.json', content: [] },
        { name: 'budgets.json', content: {} },
        { name: 'owned-books.json', content: [] },
        { name: 'api-keys.json', content: { apiKey: 'ttbgujeongmo2105001' } },
        { name: 'admin.json', content: { isSetup: false, email: null, passwordHash: null, verificationTokens: {}, createdAt: null, lastLoginAt: null } }
    ];

    // 일반 파일들 처리 (classes.json 제외)
    for (const file of files) {
        const filePath = path.join(dataDir, file.name);
        try {
            await fs.access(filePath);
        } catch (error) {
            await fs.writeFile(filePath, JSON.stringify(file.content, null, 2));
            console.log(`${file.name} 파일이 생성되었습니다.`);
        }
    }

    // classes.json 특별 처리 - 기존 데이터 보존하며 누락된 필드 추가
    const classesFilePath = path.join(dataDir, 'classes.json');
    try {
        // 기존 파일이 있는 경우
        const existingData = await fs.readFile(classesFilePath, 'utf8');
        const existingClasses = JSON.parse(existingData);
        
        // 기존 데이터와 기본 구조를 병합
        const mergedClasses = { ...defaultClasses };
        
        for (const [classId, classData] of Object.entries(existingClasses)) {
            if (mergedClasses[classId]) {
                // 기존 데이터를 우선하되 누락된 필드는 기본값으로 채움
                mergedClasses[classId] = {
                    ...mergedClasses[classId], // 기본값
                    ...classData, // 기존 데이터로 덮어쓰기
                    createdAt: classData.createdAt || new Date().toISOString()
                };
                
                // budget이 없는 경우에만 기본값 설정
                if (classData.budget === undefined || classData.budget === null) {
                    mergedClasses[classId].budget = 500000;
                }
            } else {
                // 새로운 학급인 경우 (4-3, 6-3 등)
                mergedClasses[classId] = {
                    ...classData,
                    createdAt: classData.createdAt || new Date().toISOString()
                };
                
                // 필수 필드가 없는 경우 기본값 설정
                if (!classData.password) {
                    const [grade, classNum] = classId.split('-');
                    mergedClasses[classId].password = `class${grade}${classNum}^^`;
                }
                if (classData.budget === undefined || classData.budget === null) {
                    mergedClasses[classId].budget = 500000;
                }
            }
        }
        
        await fs.writeFile(classesFilePath, JSON.stringify(mergedClasses, null, 2));
        console.log('classes.json 파일이 업데이트되었습니다.');
        
    } catch (error) {
        // 파일이 없는 경우 새로 생성
        const classesWithTimestamp = {};
        for (const [classId, classData] of Object.entries(defaultClasses)) {
            classesWithTimestamp[classId] = {
                ...classData,
                createdAt: new Date().toISOString()
            };
        }
        
        await fs.writeFile(classesFilePath, JSON.stringify(classesWithTimestamp, null, 2));
        console.log('classes.json 파일이 생성되었습니다.');
    }
}

// 전역 데이터 관리 함수들
global.readData = async function(dataType) {
    const dataDir = path.join(__dirname, 'data');
    const fileMap = {
        'applications': 'applications.json',
        'classes': 'classes.json',
        'ownedBooks': 'owned-books.json',
        'apiKeys': 'api-keys.json',
        'admin': 'admin.json',
        'systemConfig': 'system-config.json'
    };
    
    const fileName = fileMap[dataType];
    if (!fileName) {
        throw new Error(`알 수 없는 데이터 타입: ${dataType}`);
    }
    
    try {
        const filePath = path.join(dataDir, fileName);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`데이터 읽기 오류 (${dataType}):`, error);
        // 기본값 반환
        if (dataType === 'applications' || dataType === 'ownedBooks') return [];
        if (dataType === 'classes') return {};
        if (dataType === 'apiKeys') return { aladinApiKey: 'ttbgujeongmo2105001' };
        if (dataType === 'admin') return { isSetup: false };
        if (dataType === 'systemConfig') return { totalBudget: 3500000 };
        return null;
    }
};

// 백업 시스템 통합
global.writeData = async function(dataType, data) {
    const dataDir = path.join(__dirname, 'data');
    const fileMap = {
        'applications': 'applications.json',
        'classes': 'classes.json',
        'budgets': 'budgets.json',
        'ownedBooks': 'owned-books.json',
        'apiKeys': 'api-keys.json',
        'admin': 'admin.json'
    };
    
    const fileName = fileMap[dataType];
    if (!fileName) {
        throw new Error(`알 수 없는 데이터 타입: ${dataType}`);
    }
    
    try {
        const filePath = path.join(dataDir, fileName);
        
        // 중요한 데이터 변경 시 즉시 백업
        if (backupManager && ['classes', 'applications'].includes(dataType)) {
            await backupManager.createCriticalBackup(fileName, `${dataType}_update`);
        }
        
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        
        // 일반 백업 생성
        if (backupManager) {
            await backupManager.createAutoBackup(fileName, 'data_update');
        }
        
        console.log(`💾 ${dataType} 데이터 저장 완료 (백업 포함)`);
        return true;
    } catch (error) {
        console.error(`데이터 쓰기 오류 (${dataType}):`, error);
        return false;
    }
};

// API 라우트 설정
const applicationsRouter = require('./routes/applications');
const classesRouter = require('./routes/classes');
const booksRouter = require('./routes/books');
const adminRouter = require('./routes/admin');

app.use('/api/applications', applicationsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/books', booksRouter);
app.use('/api/admin', adminRouter);

// 관리자 인증 페이지 라우트
app.get('/admin/verify', (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html/admin/verify.html'));
});

app.get('/admin/setup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html/admin/setup.html'));
});

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html/index.html'));
});

// 404 처리
app.use((req, res) => {
    res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
});

// 에러 처리
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 서버 시작
async function startServer() {
    try {
        await initializeDataDirectory();
        
        // 서버 시작 시 초기 백업 생성
        console.log('🔄 초기 백업 생성 중...');
        await backupManager.createManualBackup('서버 시작 백업');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
            console.log(`📱 로컬 접속: http://localhost:${PORT}`);
            console.log(`🌐 원격 접속: http://158.247.218.210:${PORT}`);
            console.log(`🔧 API: http://158.247.218.210:${PORT}/api`);
            console.log(`💾 자동 백업 시스템이 활성화되었습니다 (6시간 간격)`);
        });
    } catch (error) {
        console.error('서버 시작 오류:', error);
        process.exit(1);
    }
}

startServer(); 