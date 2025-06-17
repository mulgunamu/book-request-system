/**
 * server.js - API 키 관리를 위한 Node.js 서버
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 정적 파일 서빙

// 설정 파일 경로
const CONFIG_DIR = path.join(__dirname, 'config');
const API_KEYS_FILE = path.join(CONFIG_DIR, 'api-keys.json');
const STATS_FILE = path.join(CONFIG_DIR, 'stats.json');

// 암호화 키 (실제 환경에서는 환경변수로 관리)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-32-chars';
const ALGORITHM = 'aes-256-cbc';

/**
 * 디렉토리 및 파일 초기화
 */
async function initializeConfigFiles() {
    try {
        // config 디렉토리 생성
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        
        // API 키 파일 초기화
        try {
            await fs.access(API_KEYS_FILE);
        } catch (error) {
            await fs.writeFile(API_KEYS_FILE, JSON.stringify({}));
        }
        
        // 통계 파일 초기화
        try {
            await fs.access(STATS_FILE);
        } catch (error) {
            const initialStats = {
                todayRequests: 0,
                monthRequests: 0,
                lastRequest: null,
                dailyStats: {},
                monthlyStats: {}
            };
            await fs.writeFile(STATS_FILE, JSON.stringify(initialStats, null, 2));
        }
        
        console.log('설정 파일 초기화 완료');
    } catch (error) {
        console.error('설정 파일 초기화 오류:', error);
    }
}

/**
 * 문자열 암호화
 */
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * 문자열 복호화
 */
function decrypt(encryptedText) {
    try {
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encrypted = textParts.join(':');
        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('복호화 오류:', error);
        return null;
    }
}

/**
 * API 키 파일 읽기
 */
async function readApiKeys() {
    try {
        const data = await fs.readFile(API_KEYS_FILE, 'utf8');
        const encryptedKeys = JSON.parse(data);
        
        // 복호화
        const decryptedKeys = {};
        for (const [key, value] of Object.entries(encryptedKeys)) {
            if (value) {
                decryptedKeys[key] = decrypt(value);
            }
        }
        
        return decryptedKeys;
    } catch (error) {
        console.error('API 키 읽기 오류:', error);
        return {};
    }
}

/**
 * API 키 파일 저장
 */
async function saveApiKeys(apiKeys) {
    try {
        // 암호화
        const encryptedKeys = {};
        for (const [key, value] of Object.entries(apiKeys)) {
            if (value) {
                encryptedKeys[key] = encrypt(value);
            }
        }
        
        await fs.writeFile(API_KEYS_FILE, JSON.stringify(encryptedKeys, null, 2));
        return true;
    } catch (error) {
        console.error('API 키 저장 오류:', error);
        return false;
    }
}

/**
 * 통계 데이터 읽기
 */
async function readStats() {
    try {
        const data = await fs.readFile(STATS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('통계 읽기 오류:', error);
        return {
            todayRequests: 0,
            monthRequests: 0,
            lastRequest: null,
            dailyStats: {},
            monthlyStats: {}
        };
    }
}

/**
 * 통계 데이터 저장
 */
async function saveStats(stats) {
    try {
        await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
        return true;
    } catch (error) {
        console.error('통계 저장 오류:', error);
        return false;
    }
}

/**
 * API 사용 통계 업데이트
 */
async function updateUsageStats() {
    const stats = await readStats();
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // 오늘 요청 수 증가
    if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = 0;
    }
    stats.dailyStats[today]++;
    stats.todayRequests = stats.dailyStats[today];
    
    // 이번 달 요청 수 증가
    if (!stats.monthlyStats[currentMonth]) {
        stats.monthlyStats[currentMonth] = 0;
    }
    stats.monthlyStats[currentMonth]++;
    stats.monthRequests = stats.monthlyStats[currentMonth];
    
    // 마지막 요청 시간 업데이트
    stats.lastRequest = new Date().toISOString();
    
    await saveStats(stats);
}

// =====================================
// API 엔드포인트
// =====================================

/**
 * 1. API 키 목록 조회 (마스킹된 형태)
 */
app.get('/api/config/api-keys', async (req, res) => {
    try {
        const apiKeys = await readApiKeys();
        
        // API 키를 마스킹하여 반환
        const maskedKeys = {};
        for (const [key, value] of Object.entries(apiKeys)) {
            maskedKeys[key] = value ? '••••••••••••••••' : null;
        }
        
        res.json(maskedKeys);
    } catch (error) {
        console.error('API 키 조회 오류:', error);
        res.status(500).json({ error: 'API 키 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 2. API 키 저장
 */
app.post('/api/config/api-keys', async (req, res) => {
    try {
        const { type, apiKey } = req.body;
        
        if (!type || !apiKey) {
            return res.status(400).json({ error: 'API 키 타입과 값이 필요합니다.' });
        }
        
        // 기존 API 키 읽기
        const existingKeys = await readApiKeys();
        
        // 새 API 키 추가/업데이트
        existingKeys[type] = apiKey;
        
        // 저장
        const success = await saveApiKeys(existingKeys);
        
        if (success) {
            res.json({ message: 'API 키가 성공적으로 저장되었습니다.' });
        } else {
            res.status(500).json({ error: 'API 키 저장에 실패했습니다.' });
        }
    } catch (error) {
        console.error('API 키 저장 오류:', error);
        res.status(500).json({ error: 'API 키 저장 중 오류가 발생했습니다.' });
    }
});

/**
 * 3. API 키 삭제
 */
app.delete('/api/config/api-keys/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        if (!type) {
            return res.status(400).json({ error: 'API 키 타입이 필요합니다.' });
        }
        
        // 기존 API 키 읽기
        const existingKeys = await readApiKeys();
        
        // API 키 삭제
        delete existingKeys[type];
        
        // 저장
        const success = await saveApiKeys(existingKeys);
        
        if (success) {
            res.json({ message: 'API 키가 성공적으로 삭제되었습니다.' });
        } else {
            res.status(500).json({ error: 'API 키 삭제에 실패했습니다.' });
        }
    } catch (error) {
        console.error('API 키 삭제 오류:', error);
        res.status(500).json({ error: 'API 키 삭제 중 오류가 발생했습니다.' });
    }
});

/**
 * 4. 특정 API 키 조회 (실제 값)
 */
app.get('/api/config/api-keys/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const apiKeys = await readApiKeys();
        
        if (apiKeys[type]) {
            res.json({ apiKey: apiKeys[type] });
        } else {
            res.status(404).json({ error: 'API 키를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('API 키 조회 오류:', error);
        res.status(500).json({ error: 'API 키 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 5. 카카오 도서 검색 프록시
 */
app.get('/api/search/kakao', async (req, res) => {
    try {
        const { query, page = 1, size = 50 } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: '검색어가 필요합니다.' });
        }
        
        // API 키 가져오기
        const apiKeys = await readApiKeys();
        const kakaoApiKey = apiKeys.kakao;
        
        if (!kakaoApiKey) {
            return res.status(500).json({ error: '카카오 API 키가 설정되지 않았습니다.' });
        }
        
        // 카카오 API 호출
        const fetch = (await import('node-fetch')).default;
        const url = new URL('https://dapi.kakao.com/v3/search/book');
        url.searchParams.set('query', query);
        url.searchParams.set('page', page);
        url.searchParams.set('size', size);
        
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `KakaoAK ${kakaoApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`카카오 API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 사용 통계 업데이트
        await updateUsageStats();
        
        res.json(data);
        
    } catch (error) {
        console.error('카카오 검색 오류:', error);
        res.status(500).json({ error: '도서 검색 중 오류가 발생했습니다.' });
    }
});

/**
 * 6. 사용 통계 조회
 */
app.get('/api/stats/usage', async (req, res) => {
    try {
        const stats = await readStats();
        
        // 오늘 날짜로 통계 업데이트
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const response = {
            todayRequests: stats.dailyStats[today] || 0,
            monthRequests: stats.monthlyStats[currentMonth] || 0,
            lastRequest: stats.lastRequest ? new Date(stats.lastRequest).toLocaleString('ko-KR') : '없음'
        };
        
        res.json(response);
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * 7. 시스템 상태 확인
 */
app.get('/api/health', async (req, res) => {
    try {
        const apiKeys = await readApiKeys();
        const stats = await readStats();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            apiKeys: {
                kakao: !!apiKeys.kakao,
                aladin: !!apiKeys.aladin
            },
            stats: {
                totalRequests: Object.values(stats.dailyStats || {}).reduce((a, b) => a + b, 0)
            }
        };
        
        res.json(health);
    } catch (error) {
        console.error('상태 확인 오류:', error);
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error.message 
        });
    }
});

// =====================================
// 에러 핸들링 미들웨어
// =====================================

app.use((err, req, res, next) => {
    console.error('서버 오류:', err);
    res.status(500).json({ 
        error: '서버 내부 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
    });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ 
        error: '요청하신 경로를 찾을 수 없습니다.',
        path: req.path
    });
});

// =====================================
// 서버 시작
// =====================================

async function startServer() {
    try {
        // 초기화
        await initializeConfigFiles();
        
        // 서버 시작
        app.listen(PORT, () => {
            console.log(`📚 희망 도서 관리 시스템 서버가 시작되었습니다.`);
            console.log(`🌐 포트: ${PORT}`);
            console.log(`📁 설정 디렉토리: ${CONFIG_DIR}`);
            console.log(`🔑 API 키 파일: ${API_KEYS_FILE}`);
            console.log(`📊 통계 파일: ${STATS_FILE}`);
            console.log(`\n🚀 관리자 페이지: http://localhost:${PORT}/pages/admin.html`);
        });
        
    } catch (error) {
        console.error('서버 시작 오류:', error);
        process.exit(1);
    }
}

// 서버 시작
startServer();

// 그레이스풀 셧다운
process.on('SIGTERM', () => {
    console.log('서버 종료 신호를 받았습니다. 종료 중...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('서버 종료 신호를 받았습니다. 종료 중...');
    process.exit(0);
});