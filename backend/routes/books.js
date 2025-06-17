const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 메모리 스토리지 설정 (CSV 파일 업로드용)
const upload = multer({ storage: multer.memoryStorage() });

// 제목과 저자를 정규화하는 함수
function normalizeText(text) {
    if (!text) return '';
    return text.replace(/[^\w가-힣]/g, '').toLowerCase().trim();
}

// 고유 식별자 생성 함수 (제목+저자)
function generateBookId(title, author) {
    const normalizedTitle = normalizeText(title);
    const normalizedAuthor = normalizeText(author || '');
    return `${normalizedTitle}_${normalizedAuthor}`;
}

// 기보유 도서 목록 조회
router.get('/owned', async (req, res) => {
    try {
        const ownedBooks = await global.readData('ownedBooks');
        res.json(ownedBooks);
    } catch (error) {
        res.status(500).json({ error: '기보유 도서 목록을 불러올 수 없습니다.' });
    }
});

// 기보유 도서 추가
router.post('/owned', async (req, res) => {
    try {
        const { title, author } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: '도서명은 필수입니다.' });
        }
        
        const ownedBooks = await global.readData('ownedBooks');
        
        // 중복 확인 (제목+저자 조합)
        const bookId = generateBookId(title, author);
        const exists = ownedBooks.some(book => 
            generateBookId(book.title, book.author) === bookId
        );
        
        if (exists) {
            return res.status(400).json({ error: '이미 등록된 도서입니다.' });
        }
        
        const newBook = {
            title,
            author: author || '',
            addedAt: new Date().toISOString()
        };
        
        ownedBooks.push(newBook);
        
        const success = await global.writeData('ownedBooks', ownedBooks);
        if (success) {
            res.status(201).json(newBook);
        } else {
            res.status(500).json({ error: '도서 등록에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('기보유 도서 추가 오류:', error);
        res.status(500).json({ error: '도서 등록 중 오류가 발생했습니다.' });
    }
});

// 기보유 도서 삭제 (제목+저자 기반)
router.delete('/owned/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const ownedBooks = await global.readData('ownedBooks');
        
        // identifier는 "제목_저자" 형태로 인코딩된 값
        const bookIndex = ownedBooks.findIndex(book => 
            generateBookId(book.title, book.author) === identifier
        );
        
        if (bookIndex === -1) {
            return res.status(404).json({ error: '도서를 찾을 수 없습니다.' });
        }
        
        const deletedBook = ownedBooks.splice(bookIndex, 1)[0];
        
        const success = await global.writeData('ownedBooks', ownedBooks);
        if (success) {
            res.json({ message: '도서가 삭제되었습니다.', book: deletedBook });
        } else {
            res.status(500).json({ error: '도서 삭제에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('기보유 도서 삭제 오류:', error);
        res.status(500).json({ error: '도서 삭제 중 오류가 발생했습니다.' });
    }
});

// CSV 파일로 기보유 도서 일괄 업로드 (제목+저자 기반)
router.post('/owned/upload-csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'CSV 파일을 선택해주세요.' });
        }
        
        const csvData = req.file.buffer.toString('utf8');
        const books = [];
        const errors = [];
        
        // CSV 파싱
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV 파일에 데이터가 없습니다.' });
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        
        // 헤더 디버깅
        console.log('📋 CSV 헤더 분석:');
        headers.forEach((header, index) => {
            console.log(`   [${index}] "${header}"`);
        });
        
        // 필수 컬럼 인덱스 찾기
        const titleIndex = headers.findIndex(h => h.includes('자료명') || h.includes('title') || h.includes('제목'));
        const authorIndex = headers.findIndex(h => h.includes('저자') || h.includes('author'));
        const publisherIndex = headers.findIndex(h => h.includes('출판사') || h.includes('publisher'));
        const yearIndex = headers.findIndex(h => h.includes('출판년도') || h.includes('year') || h.includes('연도'));
        const regNoIndex = headers.findIndex(h => h.includes('등록번호') || h.includes('registration'));
        
        console.log('🔍 컬럼 매핑 결과:');
        console.log(`   제목 컬럼: [${titleIndex}] "${headers[titleIndex] || '찾을 수 없음'}"`);
        console.log(`   저자 컬럼: [${authorIndex}] "${headers[authorIndex] || '찾을 수 없음'}"`);
        console.log(`   출판사 컬럼: [${publisherIndex}] "${headers[publisherIndex] || '찾을 수 없음'}"`);
        console.log(`   출판년도 컬럼: [${yearIndex}] "${headers[yearIndex] || '찾을 수 없음'}"`);
        console.log(`   등록번호 컬럼: [${regNoIndex}] "${headers[regNoIndex] || '찾을 수 없음'}"`);
        
        if (titleIndex === -1) {
            return res.status(400).json({ 
                error: 'CSV 파일에 자료명(title) 컬럼이 필요합니다.',
                headers: headers,
                suggestion: '컬럼명에 "자료명", "title", "제목" 중 하나가 포함되어야 합니다.'
            });
        }
        
        // 데이터 행 처리
        console.log('📊 데이터 행 처리 시작...');
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            // 처음 5개 행만 상세 로깅
            if (i <= 5) {
                console.log(`\n📝 행 ${i} 분석:`);
                values.forEach((value, index) => {
                    console.log(`   [${index}] "${value}"`);
                });
            }
            
            if (values.length > titleIndex) {
                const title = values[titleIndex];
                const author = authorIndex !== -1 ? values[authorIndex] : '';
                const publisher = publisherIndex !== -1 ? values[publisherIndex] : '';
                const year = yearIndex !== -1 ? values[yearIndex] : '';
                const regNo = regNoIndex !== -1 ? values[regNoIndex] : '';
                
                // 처음 5개 행만 매핑 결과 로깅
                if (i <= 5) {
                    console.log(`   ➡️ 매핑 결과:`);
                    console.log(`      제목: "${title}"`);
                    console.log(`      저자: "${author}"`);
                    console.log(`      출판사: "${publisher}"`);
                    console.log(`      출판년도: "${year}"`);
                    console.log(`      등록번호: "${regNo}"`);
                }
                
                if (title && title.length > 2) {
                    books.push({ 
                        title: title,
                        author: author,
                        publisher: publisher,
                        year: year,
                        regNo: regNo
                    });
                } else {
                    errors.push(`행 ${i + 1}: 자료명이 누락되거나 너무 짧음 ("${title}")`);
                }
            }
        }
        
        if (books.length === 0) {
            return res.status(400).json({ 
                error: '처리할 수 있는 도서 데이터가 없습니다.',
                errors 
            });
        }
        
        // 기존 데이터와 병합
        const ownedBooks = await global.readData('ownedBooks');
        let addedCount = 0;
        
        books.forEach(book => {
            const bookId = generateBookId(book.title, book.author);
            const exists = ownedBooks.some(existing => 
                generateBookId(existing.title, existing.author) === bookId
            );
            
            if (!exists) {
                ownedBooks.push({
                    title: book.title,
                    author: book.author,
                    addedAt: new Date().toISOString(),
                    source: 'csv'
                });
                addedCount++;
            }
        });
        
        const success = await global.writeData('ownedBooks', ownedBooks);
        if (success) {
            res.json({
                message: `${addedCount}권의 도서가 추가되었습니다.`,
                addedCount,
                totalProcessed: books.length,
                errors: errors.length > 0 ? errors : undefined
            });
        } else {
            res.status(500).json({ error: '도서 목록 저장에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('CSV 업로드 오류:', error);
        res.status(500).json({ error: 'CSV 파일 처리 중 오류가 발생했습니다.' });
    }
});

// 도서 소유 여부 확인 (제목+저자 기반)
router.get('/owned/check', async (req, res) => {
    try {
        const { title, author } = req.query;
        
        if (!title) {
            return res.status(400).json({ error: '도서명은 필수입니다.' });
        }
        
        const ownedBooks = await global.readData('ownedBooks');
        
        // 정규화된 제목과 저자로 매칭
        const searchId = generateBookId(title, author);
        const matchedBook = ownedBooks.find(book => 
            generateBookId(book.title, book.author) === searchId
        );
        
        if (matchedBook) {
            res.json({ 
                isOwned: true, 
                matchedBook,
                matchType: 'exact'
            });
        } else {
            // 부분 매칭 시도
            const normalizedSearchTitle = normalizeText(title);
            const partialMatches = ownedBooks.filter(book => {
                const normalizedBookTitle = normalizeText(book.title);
                return normalizedBookTitle.includes(normalizedSearchTitle) || 
                       normalizedSearchTitle.includes(normalizedBookTitle);
            });
            
            if (partialMatches.length > 0) {
                res.json({ 
                    isOwned: true, 
                    matchedBook: partialMatches[0],
                    matchType: 'partial',
                    allMatches: partialMatches
                });
            } else {
                res.json({ isOwned: false });
            }
        }
        
    } catch (error) {
        console.error('도서 소유 확인 오류:', error);
        res.status(500).json({ error: '도서 소유 확인 중 오류가 발생했습니다.' });
    }
});

// 기보유 도서 통계
router.get('/owned/stats', async (req, res) => {
    try {
        const ownedBooks = await global.readData('ownedBooks');
        const applications = await global.readData('applications');
        
        // 기보유 도서 중 신청된 도서 찾기 (제목+저자 기반)
        const ownedBookIds = new Set(ownedBooks.map(book => 
            generateBookId(book.title, book.author)
        ));
        
        const duplicateApplications = applications.filter(app => {
            const appId = generateBookId(app.title, app.author);
            return ownedBookIds.has(appId);
        });
        
        res.json({
            totalOwnedBooks: ownedBooks.length,
            duplicateApplications: duplicateApplications.length,
            recentlyAdded: ownedBooks
                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                .slice(0, 10)
        });
        
    } catch (error) {
        console.error('기보유 도서 통계 오류:', error);
        res.status(500).json({ error: '통계를 불러올 수 없습니다.' });
    }
});

// 도서관 보유 도서 CSV 업로드 (libraryholdings.csv) - 알라딘 API 연동
router.post('/library-holdings/upload-csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'CSV 파일을 선택해주세요.' });
        }
        
        const csvData = req.file.buffer.toString('utf8');
        const books = [];
        const errors = [];
        
        // CSV 파싱
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV 파일에 데이터가 없습니다.' });
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        
        // 헤더 디버깅
        console.log('📋 CSV 헤더 분석:');
        headers.forEach((header, index) => {
            console.log(`   [${index}] "${header}"`);
        });
        
        // 실제 CSV 구조에 맞는 컬럼 매핑
        // 로그를 보면: [0]번호, [1]단행본, [2]등록번호, [3]제목, [4~11]저자들, [12]출판사, [13]출판년도
        let titleIndex = -1;
        let authorStartIndex = -1;
        let publisherIndex = -1;
        let yearIndex = -1;
        let regNoIndex = -1;
        
        // 동적으로 컬럼 찾기
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].toLowerCase();
            
            // 제목 컬럼 찾기
            if (titleIndex === -1 && (header.includes('자료명') || header.includes('title') || header.includes('제목'))) {
                titleIndex = i;
            }
            // 등록번호 컬럼 찾기
            else if (regNoIndex === -1 && (header.includes('등록번호') || header.includes('registration'))) {
                regNoIndex = i;
            }
            // 출판사 컬럼 찾기
            else if (publisherIndex === -1 && (header.includes('출판사') || header.includes('publisher'))) {
                publisherIndex = i;
            }
            // 출판년도 컬럼 찾기
            else if (yearIndex === -1 && (header.includes('출판년도') || header.includes('year') || header.includes('연도'))) {
                yearIndex = i;
            }
        }
        
        // 헤더가 없는 경우 데이터 구조로 추정
        if (titleIndex === -1) {
            // 첫 번째 데이터 행을 분석하여 구조 추정
            if (lines.length > 1) {
                const firstDataRow = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));
                console.log('📊 첫 번째 데이터 행 분석으로 구조 추정:');
                firstDataRow.forEach((value, index) => {
                    console.log(`   [${index}] "${value}"`);
                });
                
                // 일반적인 도서관 CSV 구조 추정
                // [0]번호, [1]자료유형, [2]등록번호, [3]제목, [4~]저자들, 마지막 2개가 출판사/년도
                if (firstDataRow.length >= 4) {
                    titleIndex = 3; // 제목은 보통 4번째 컬럼
                    regNoIndex = 2; // 등록번호는 보통 3번째 컬럼
                    authorStartIndex = 4; // 저자는 5번째 컬럼부터 시작
                    
                    // 마지막 2개 컬럼을 출판사와 년도로 추정
                    if (firstDataRow.length >= 6) {
                        publisherIndex = firstDataRow.length - 2;
                        yearIndex = firstDataRow.length - 1;
                    }
                }
            }
        } else {
            // 헤더가 있는 경우 저자 시작 인덱스 찾기
            authorStartIndex = titleIndex + 1;
        }
        
        console.log('🔍 최종 컬럼 매핑 결과:');
        console.log(`   제목 컬럼: [${titleIndex}] "${headers[titleIndex] || '추정됨'}"`);
        console.log(`   저자 시작 컬럼: [${authorStartIndex}] "${headers[authorStartIndex] || '추정됨'}"`);
        console.log(`   출판사 컬럼: [${publisherIndex}] "${headers[publisherIndex] || '추정됨'}"`);
        console.log(`   출판년도 컬럼: [${yearIndex}] "${headers[yearIndex] || '추정됨'}"`);
        console.log(`   등록번호 컬럼: [${regNoIndex}] "${headers[regNoIndex] || '추정됨'}"`);
        
        if (titleIndex === -1) {
            return res.status(400).json({ 
                error: 'CSV 파일에서 제목 컬럼을 찾을 수 없습니다.',
                headers: headers,
                suggestion: '컬럼명에 "자료명", "title", "제목" 중 하나가 포함되거나, 4번째 컬럼이 제목이어야 합니다.'
            });
        }
        
        // 데이터 행 처리
        console.log('📊 데이터 행 처리 시작...');
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            // 처음 5개 행만 상세 로깅
            if (i <= 5) {
                console.log(`\n📝 행 ${i} 분석:`);
                values.forEach((value, index) => {
                    console.log(`   [${index}] "${value}"`);
                });
            }
            
            if (values.length > titleIndex) {
                const title = values[titleIndex];
                
                // 저자 정보 수집 (여러 컬럼에 나뉘어 있을 수 있음)
                let authors = [];
                if (authorStartIndex !== -1) {
                    // 저자 컬럼부터 출판사 컬럼 전까지 수집
                    const endIndex = publisherIndex !== -1 ? publisherIndex : values.length;
                    for (let j = authorStartIndex; j < endIndex && j < values.length; j++) {
                        const authorPart = values[j];
                        if (authorPart && authorPart.trim() && 
                            !authorPart.includes('출판') && 
                            !authorPart.match(/^\d{4}$/) && // 년도가 아닌
                            authorPart.length > 1) {
                            authors.push(authorPart.trim());
                        }
                    }
                }
                
                const author = authors.join(', ');
                const publisher = publisherIndex !== -1 && publisherIndex < values.length ? values[publisherIndex] : '';
                const year = yearIndex !== -1 && yearIndex < values.length ? values[yearIndex] : '';
                const regNo = regNoIndex !== -1 && regNoIndex < values.length ? values[regNoIndex] : '';
                
                // 처음 5개 행만 매핑 결과 로깅
                if (i <= 5) {
                    console.log(`   ➡️ 매핑 결과:`);
                    console.log(`      제목: "${title}"`);
                    console.log(`      저자: "${author}"`);
                    console.log(`      출판사: "${publisher}"`);
                    console.log(`      출판년도: "${year}"`);
                    console.log(`      등록번호: "${regNo}"`);
                }
                
                if (title && title.length > 2) {
                    books.push({ 
                        title: title,
                        author: author,
                        publisher: publisher,
                        year: year,
                        regNo: regNo
                    });
                } else {
                    errors.push(`행 ${i + 1}: 자료명이 누락되거나 너무 짧음 ("${title}")`);
                }
            }
        }
        
        if (books.length === 0) {
            return res.status(400).json({ 
                error: '처리할 수 있는 도서 데이터가 없습니다.',
                errors 
            });
        }

        // 응답을 먼저 보내고 백그라운드에서 처리
        res.json({
            message: `${books.length}권의 도서를 백그라운드에서 처리 중입니다. 알라딘 API를 통해 ISBN을 조회하고 있습니다...`,
            totalBooks: books.length,
            status: 'processing',
            note: '처리 완료까지 시간이 걸릴 수 있습니다. 서버 로그를 확인하거나 잠시 후 기보유 도서 목록을 새로고침해주세요.'
        });

        // 백그라운드에서 알라딘 API 조회 및 저장 처리
        processLibraryHoldingsWithAPI(books, errors);
        
    } catch (error) {
        console.error('CSV 업로드 오류:', error);
        res.status(500).json({ error: 'CSV 파일 처리 중 오류가 발생했습니다.' });
    }
});

// 알라딘 API를 통한 도서 정보 조회 및 저장 함수 (개선된 버전)
async function processLibraryHoldingsWithAPI(books, errors) {
    const https = require('https');
    const url = require('url');
    
    console.log(`\n🚀 도서관 보유 도서 처리 시작: 총 ${books.length}권`);
    
    // API 호출 제한 설정
    const DAILY_API_LIMIT = 4500;
    const API_DELAY = 1000; // 1초 대기
    
    // 진행 상황 파일 경로
    const progressFile = path.join(__dirname, '../data/processing-progress.json');
    
    // 기존 진행 상황 확인
    let progress = { processedCount: 0, lastProcessedDate: null, apiCallsToday: 0 };
    try {
        const progressData = await fs.readFile(progressFile, 'utf8');
        progress = JSON.parse(progressData);
        
        // 날짜가 바뀌었으면 API 호출 횟수 초기화
        const today = new Date().toDateString();
        if (progress.lastProcessedDate !== today) {
            progress.apiCallsToday = 0;
            progress.lastProcessedDate = today;
        }
    } catch (error) {
        console.log('   📝 새로운 작업 시작');
    }
    
    const ownedBooks = await global.readData('ownedBooks');
    let addedCount = 0;
    let notFoundCount = 0;
    let duplicateCount = 0;
    let apiCallsToday = progress.apiCallsToday;
    
    // 알라딘 API 키 가져오기
    const apiKeys = await global.readData('apiKeys') || {};
    const apiKey = apiKeys.aladinApiKey || 'ttbgujeongmo2105001';
    
    console.log(`   📊 진행 상황: ${progress.processedCount}/${books.length}권 처리 완료`);
    console.log(`   🔢 오늘 API 호출: ${apiCallsToday}/${DAILY_API_LIMIT}회`);
    
    // 오늘 API 제한에 도달했는지 확인
    if (apiCallsToday >= DAILY_API_LIMIT) {
        console.log(`\n⚠️  오늘의 API 호출 제한(${DAILY_API_LIMIT}회)에 도달했습니다.`);
        console.log(`   📅 내일 다시 실행해주세요.`);
        return;
    }
    
    // 이미 처리된 도서들 건너뛰기
    const startIndex = progress.processedCount;
    const remainingBooks = books.slice(startIndex);
    
    console.log(`   ⏭️  ${startIndex}권은 이미 처리됨. ${remainingBooks.length}권 남음`);
    
    for (let i = 0; i < remainingBooks.length; i++) {
        const currentIndex = startIndex + i;
        const book = remainingBooks[i];
        const overallProgress = Math.round(((currentIndex + 1) / books.length) * 100);
        
        // API 제한 확인
        if (apiCallsToday >= DAILY_API_LIMIT) {
            console.log(`\n⚠️  일일 API 호출 제한(${DAILY_API_LIMIT}회)에 도달했습니다.`);
            console.log(`   💾 진행 상황을 저장하고 내일 계속합니다.`);
            break;
        }
        
        console.log(`\n📖 [${currentIndex + 1}/${books.length}] (${overallProgress}%) 처리 중: "${book.title}"`);
        console.log(`   👤 저자: ${book.author || '정보없음'}`);
        console.log(`   🔢 오늘 API 호출: ${apiCallsToday}/${DAILY_API_LIMIT}회`);
        
        try {
            // 중복 확인 (제목+저자 기반)
            const bookId = generateBookId(book.title, book.author);
            const exists = ownedBooks.some(existing => 
                generateBookId(existing.title, existing.author) === bookId
            );
            
            if (exists) {
                console.log(`   ⚠️  이미 등록된 도서 (건너뜀)`);
                duplicateCount++;
                // 진행 상황 업데이트 (API 호출 없음)
                progress.processedCount = currentIndex + 1;
                continue;
            }
            
            // 제목 정리
            let cleanTitle = book.title
                .replace(/\([^)]*\)/g, '')
                .replace(/\[[^\]]*\]/g, '')
                .replace(/[:.]/g, ' ')
                .replace(/[^\w가-힣\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (cleanTitle.length < 3) {
                cleanTitle = book.title.replace(/[^\w가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim();
            }
            
            // 저자 정리
            let cleanAuthor = '';
            if (book.author) {
                cleanAuthor = book.author
                    .replace(/\s*(지은이|지음|글쓴이|글|그림|옮긴이|편저|편역|저자|저|역자|역|번역|감수|감역|편집|엮음|엮은이|구성|기획|원작|원저|삽화|일러스트|사진)\s*/g, '')
                    .replace(/[;,()·]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(' ')[0];
            }
            
            const query = cleanTitle;
            console.log(`   🔍 검색어: "${cleanTitle}" (저자: ${cleanAuthor || '없음'})`);
            
            // API 호출
            const searchUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${apiKey}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=MidBig`;
            
            const parsedUrl = url.parse(searchUrl);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.path,
                method: 'GET',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            
            apiCallsToday++; // API 호출 카운트 증가
            
            const result = await new Promise((resolve, reject) => {
                const req = https.request(options, (response) => {
                    let data = '';
                    response.on('data', (chunk) => { data += chunk; });
                    response.on('end', () => {
                        resolve({ statusCode: response.statusCode, data: data });
                    });
                });
                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('요청 시간 초과')); });
                req.setTimeout(10000);
                req.end();
            });
            
            if (result.statusCode === 200) {
                let jsonData = result.data;
                const callbackMatch = jsonData.match(/^[^(]*\((.*)\);?\s*$/);
                if (callbackMatch) {
                    jsonData = callbackMatch[1];
                }
                
                const parsedData = JSON.parse(jsonData);
                
                if (parsedData.item && parsedData.item.length > 0) {
                    // 가장 적합한 도서 찾기
                    let bestMatch = null;
                    let bestSimilarity = 0;
                    
                    for (const item of parsedData.item) {
                        const cleanAladinTitle = item.title
                            .replace(/\([^)]*\)/g, '')
                            .replace(/\[[^\]]*\]/g, '')
                            .replace(/[^\w가-힣\s]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        
                        const titleSimilarity = calculateSimilarity(
                            normalizeText(cleanTitle),
                            normalizeText(cleanAladinTitle)
                        );
                        
                        let authorSimilarity = 1.0;
                        if (cleanAuthor && item.author) {
                            const cleanAladinAuthor = item.author
                                .replace(/\s*(지은이|글|그림|옮긴이|편저|편역|저|역)\s*/g, '')
                                .replace(/[;,()]/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .split(' ')[0];
                            
                            authorSimilarity = calculateSimilarity(
                                normalizeText(cleanAuthor),
                                normalizeText(cleanAladinAuthor)
                            );
                        }
                        
                        const combinedSimilarity = (titleSimilarity * 0.8) + (authorSimilarity * 0.2);
                        
                        if (combinedSimilarity > bestSimilarity && combinedSimilarity >= 0.5) {
                            bestSimilarity = combinedSimilarity;
                            bestMatch = item;
                        }
                    }
                    
                    if (bestMatch) {
                        const isbn = bestMatch.isbn13 || bestMatch.isbn;
                        const isbnExists = ownedBooks.some(existing => existing.isbn === isbn);
                        
                        if (isbnExists) {
                            console.log(`   ⚠️  ISBN 중복 도서 (건너뜀): ${isbn}`);
                            duplicateCount++;
                        } else {
                            const newBook = {
                                title: bestMatch.title,
                                author: bestMatch.author,
                                isbn: isbn,
                                publisher: bestMatch.publisher,
                                year: bestMatch.pubDate || book.year,
                                regNo: book.regNo,
                                addedAt: new Date().toISOString(),
                                source: 'csv_with_api'
                            };
                            
                            ownedBooks.push(newBook);
                            addedCount++;
                            
                            console.log(`   ✅ 추가 완료 (ISBN: ${isbn})`);
                            console.log(`   📚 알라딘 제목: "${bestMatch.title}"`);
                            console.log(`   👤 알라딘 저자: "${bestMatch.author}"`);
                        }
                    } else {
                        console.log(`   ❌ 적합한 도서를 찾을 수 없음 (유사도 부족)`);
                        notFoundCount++;
                    }
                } else {
                    console.log(`   ❌ 검색 결과 없음`);
                    notFoundCount++;
                }
            } else {
                console.log(`   ❌ API 호출 실패 (상태코드: ${result.statusCode})`);
                notFoundCount++;
            }
        } catch (error) {
            console.error(`   💥 오류 발생: ${error.message}`);
            notFoundCount++;
        }
        
        // 진행 상황 업데이트
        progress.processedCount = currentIndex + 1;
        progress.apiCallsToday = apiCallsToday;
        progress.lastProcessedDate = new Date().toDateString();
        
        // API 호출 간격
        if (i < remainingBooks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, API_DELAY));
        }
        
        // 10권마다 중간 저장
        if ((currentIndex + 1) % 10 === 0 || apiCallsToday >= DAILY_API_LIMIT) {
            console.log(`\n💾 중간 저장 중... (${currentIndex + 1}권 처리 완료)`);
            try {
                // 도서 데이터 저장
                await global.writeData('ownedBooks', ownedBooks);
                // 진행 상황 저장
                await fs.writeFile(progressFile, JSON.stringify(progress, null, 2));
                console.log(`   ✅ 중간 저장 성공 (현재 ${ownedBooks.length}권)`);
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (saveError) {
                console.error(`   ❌ 중간 저장 실패:`, saveError);
            }
        }
    }
    
    // 최종 저장
    console.log(`\n💾 데이터 저장 중...`);
    const success = await global.writeData('ownedBooks', ownedBooks);
    
    // 진행 상황 최종 저장
    try {
        await fs.writeFile(progressFile, JSON.stringify(progress, null, 2));
    } catch (error) {
        console.error('진행 상황 저장 실패:', error);
    }
    
    if (success) {
        console.log(`\n🎉 오늘 작업 완료!`);
        console.log(`   ✅ 추가된 도서: ${addedCount}권`);
        console.log(`   ⚠️  중복 도서: ${duplicateCount}권`);
        console.log(`   ❌ 찾을 수 없는 도서: ${notFoundCount}권`);
        console.log(`   📊 전체 보유 도서: ${ownedBooks.length}권`);
        console.log(`   🔢 사용된 API 호출: ${apiCallsToday}/${DAILY_API_LIMIT}회`);
        console.log(`   📈 전체 진행률: ${Math.round((progress.processedCount / books.length) * 100)}% (${progress.processedCount}/${books.length})`);
        
        if (progress.processedCount < books.length) {
            console.log(`\n📅 작업 미완료 - 내일 계속하려면 같은 CSV 파일로 다시 업로드하세요.`);
            console.log(`   남은 도서: ${books.length - progress.processedCount}권`);
        } else {
            console.log(`\n🎊 모든 도서 처리 완료!`);
            // 진행 상황 파일 삭제
            try {
                await fs.unlink(progressFile);
                console.log(`   🗑️  진행 상황 파일 정리 완료`);
            } catch (error) {
                console.log(`   ⚠️  진행 상황 파일 정리 실패 (무시 가능)`);
            }
        }
    } else {
        console.error(`\n💥 데이터 저장 실패`);
    }
}

// 알라딘 API에서 도서 검색하는 함수
async function searchBookInAladin(title, author, apiKey) {
    const https = require('https');
    const url = require('url');
    
    try {
        // 제목 정리: 괄호 제거, 특수문자 정리 (개선된 버전)
        let cleanTitle = title
            .replace(/\([^)]*\)/g, '') // 괄호와 괄호 안 내용 제거
            .replace(/\[[^\]]*\]/g, '') // 대괄호와 대괄호 안 내용 제거
            .replace(/[:.]/g, ' ') // 콜론과 마침표를 공백으로
            .replace(/[^\w가-힣\s]/g, ' ') // 특수문자를 공백으로 변경
            .replace(/\s+/g, ' ') // 연속된 공백을 하나로
            .trim();
        
        // 너무 짧은 제목은 원본 사용
        if (cleanTitle.length < 3) {
            cleanTitle = title.replace(/[^\w가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim();
        }
        
        // 저자 정리: 불필요한 정보 제거
        let cleanAuthor = '';
        if (author) {
            cleanAuthor = author
                .replace(/\s*(지은이|지음|글쓴이|글|그림|옮긴이|편저|편역|저자|저|역자|역|번역|감수|감역|편집|엮음|엮은이|구성|기획|원작|원저|삽화|일러스트|사진)\s*/g, '')
                .replace(/[;,()·]/g, ' ') // 세미콜론, 콤마, 괄호, 중점을 공백으로
                .replace(/\s+/g, ' ')
                .trim()
                .split(' ')[0]; // 첫 번째 이름만 사용
        }
        
        // 검색 쿼리 구성 (제목만 사용 - 더 높은 성공률)
        const query = cleanTitle;
        
        console.log(`   🔍 검색어: "${cleanTitle}" (저자: ${cleanAuthor || '없음'})`);
        
        const searchUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${apiKey}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=MidBig`;
        
        const parsedUrl = url.parse(searchUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const result = await new Promise((resolve, reject) => {
            const req = https.request(options, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        data: data
                    });
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('요청 시간 초과'));
            });
            
            req.setTimeout(10000);
            req.end();
        });
        
        if (result.statusCode === 200) {
            // JSONP 응답을 JSON으로 변환
            let jsonData = result.data;
            const callbackMatch = jsonData.match(/^[^(]*\((.*)\);?\s*$/);
            if (callbackMatch) {
                jsonData = callbackMatch[1];
            }
            
            const parsedData = JSON.parse(jsonData);
            
            if (parsedData.item && parsedData.item.length > 0) {
                // 가장 적합한 도서 찾기 (제목 유사도 기반)
                let bestMatch = null;
                let bestSimilarity = 0;
                
                for (const item of parsedData.item) {
                    // 알라딘 제목도 정리해서 비교
                    const cleanAladinTitle = item.title
                        .replace(/\([^)]*\)/g, '')
                        .replace(/\[[^\]]*\]/g, '')
                        .replace(/[^\w가-힣\s]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    const titleSimilarity = calculateSimilarity(
                        normalizeText(cleanTitle),
                        normalizeText(cleanAladinTitle)
                    );
                    
                    let authorSimilarity = 1.0;
                    if (cleanAuthor && item.author) {
                        const cleanAladinAuthor = item.author
                            .replace(/\s*(지은이|글|그림|옮긴이|편저|편역|저|역)\s*/g, '')
                            .replace(/[;,()]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .split(' ')[0]; // 첫 번째 이름만 사용
                        
                        authorSimilarity = calculateSimilarity(
                            normalizeText(cleanAuthor),
                            normalizeText(cleanAladinAuthor)
                        );
                    }
                    
                    // 제목 유사도 80%, 저자 유사도 20% 가중치
                    const combinedSimilarity = (titleSimilarity * 0.8) + (authorSimilarity * 0.2);
                    
                    if (combinedSimilarity > bestSimilarity && combinedSimilarity >= 0.5) {
                        bestSimilarity = combinedSimilarity;
                        bestMatch = item;
                    }
                }
                
                if (bestMatch) {
                    return {
                        title: bestMatch.title,
                        author: bestMatch.author,
                        isbn: bestMatch.isbn13 || bestMatch.isbn,
                        publisher: bestMatch.publisher,
                        pubDate: bestMatch.pubDate,
                        similarity: bestSimilarity
                    };
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error(`   💥 알라딘 API 검색 오류: ${error.message}`);
        return null;
    }
}

// 도서관 보유 도서 검색 (제목 기반)
router.get('/library-holdings/search', async (req, res) => {
    try {
        const { title, author } = req.query;
        
        if (!title) {
            return res.status(400).json({ error: '검색할 도서명을 입력해주세요.' });
        }
        
        const ownedBooks = await global.readData('ownedBooks');
        
        // 제목과 저자로 검색
        const results = ownedBooks.filter(book => {
            const titleMatch = book.title && book.title.toLowerCase().includes(title.toLowerCase());
            const authorMatch = !author || (book.author && book.author.toLowerCase().includes(author.toLowerCase()));
            return titleMatch && authorMatch;
        });
        
        res.json({
            results,
            totalCount: results.length
        });
        
    } catch (error) {
        console.error('도서관 보유 도서 검색 오류:', error);
        res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
    }
});

// 도서 신청 가능 여부 확인 (ISBN 기반)
router.post('/check-availability', async (req, res) => {
    try {
        console.log('=== check-availability 요청 상세 분석 ===');
        console.log('req.body 전체:', JSON.stringify(req.body, null, 2));
        console.log('req.body.books:', req.body.books);
        console.log('Array.isArray(req.body.books):', Array.isArray(req.body.books));
        console.log('typeof req.body.books:', typeof req.body.books);
        
        const books = req.body.books;
        if (!Array.isArray(books)) {
            console.log('❌ books가 배열이 아님:', typeof books, books);
            return res.status(400).json({ error: '도서 목록이 필요합니다.' });
        }

        if (books.length === 0) {
            console.log('❌ 빈 배열 전송됨');
            return res.status(400).json({ error: '확인할 도서가 없습니다.' });
        }

        console.log('✅ books 배열 확인 완료:', books.length, '개');

        const ownedBooks = await global.readData('ownedBooks');
        const applications = await global.readData('applications');
        
        console.log(`기보유 도서 수: ${ownedBooks.length}, 신청 도서 수: ${applications.length}`);
        
        // 스마트 필터링: 의미있는 도서만 확인
        const filteredBooks = books.filter(book => {
            const title = book.title || '';
            const normalizedTitle = normalizeText(title);
            
            // 제목이 너무 짧거나 일반적인 단어만 있는 경우 제외
            if (normalizedTitle.length < 3) return false;
            
            // 일반적인 단어들 필터링
            const commonWords = ['도서', '책', '교재', '문제집', '참고서'];
            if (commonWords.some(word => normalizedTitle === word)) return false;
            
            return true;
        });

        console.log(`필터링 후 도서 수: ${filteredBooks.length} (원본: ${books.length})`);

        const results = filteredBooks.map(book => {
            const { title, author, isbn } = book;
            
            // ISBN 기반 매칭
            let isOwned = false;
            let matchedBook = null;
            let matchType = 'none';
            let similarBooks = [];
            
            if (isbn) {
                // ISBN으로 정확한 매칭
                matchedBook = ownedBooks.find(owned => owned.isbn === isbn);
                
                if (matchedBook) {
                    isOwned = true;
                    matchType = 'isbn_exact';
                    console.log(`✅ ISBN 매칭 발견: "${title}" (ISBN: ${isbn})`);
                }
            }
            
            // ISBN 매칭이 없는 경우, 제목 유사도 검사 (경고용)
            if (!isOwned && title) {
                const normalizedSearchTitle = normalizeText(title);
                
                // 유사한 제목의 도서 찾기
                similarBooks = ownedBooks.filter(owned => {
                    if (!owned.title) return false;
                    
                    const normalizedOwnedTitle = normalizeText(owned.title);
                    const similarity = calculateSimilarity(normalizedSearchTitle, normalizedOwnedTitle);
                    
                    // 60% 이상 유사하면 경고 대상
                    return similarity >= 0.6;
                }).map(owned => ({
                    title: owned.title,
                    author: owned.author,
                    isbn: owned.isbn,
                    similarity: calculateSimilarity(normalizedSearchTitle, normalizeText(owned.title))
                })).sort((a, b) => b.similarity - a.similarity);
                
                if (similarBooks.length > 0) {
                    console.log(`⚠️ 유사한 제목의 도서 발견: "${title}"`);
                    similarBooks.forEach(similar => {
                        console.log(`   - "${similar.title}" (유사도: ${(similar.similarity * 100).toFixed(1)}%)`);
                    });
                }
            }
            
            // 신청 여부 확인 (ISBN 기반)
            let isApplied = false;
            if (isbn) {
                isApplied = applications.some(app => app.isbn === isbn);
            }
            
            const result = {
                title,
                author,
                isbn,
                isOwned,
                isApplied,
                canApply: !isOwned && !isApplied,
                matchType,
                matchedBook: matchedBook ? {
                    title: matchedBook.title,
                    author: matchedBook.author,
                    isbn: matchedBook.isbn,
                    publisher: matchedBook.publisher,
                    regNo: matchedBook.regNo
                } : null,
                similarBooks: similarBooks.length > 0 ? similarBooks.slice(0, 3) : undefined // 최대 3개까지
            };
            
            if (isOwned) {
                console.log(`✅ 보유중 발견: "${title}" -> "${matchedBook.title}" (ISBN: ${isbn})`);
            }
            
            return result;
        });

        console.log(`✅ 처리 완료: ${results.length}개 결과 반환`);
        
        const responseData = { results };
        console.log('📤 응답 데이터 전송:', JSON.stringify(responseData, null, 2));
        
        res.json(responseData);
        console.log('📤 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 도서 신청 가능 여부 확인 오류:', error);
        res.status(500).json({ error: '도서 확인 중 오류가 발생했습니다.' });
    }
});

// 도서관 보유 도서 통계
router.get('/library-holdings/stats', async (req, res) => {
    try {
        const ownedBooks = await global.readData('ownedBooks');
        
        // 출처별 통계
        const sourceStats = {};
        const yearStats = {};
        
        ownedBooks.forEach(book => {
            const source = book.source || 'manual';
            sourceStats[source] = (sourceStats[source] || 0) + 1;
            
            const year = book.year || 'unknown';
            yearStats[year] = (yearStats[year] || 0) + 1;
        });
        
        res.json({
            totalBooks: ownedBooks.length,
            sourceStats,
            yearStats,
            recentlyAdded: ownedBooks
                .filter(book => book.addedAt)
                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                .slice(0, 20)
        });
        
    } catch (error) {
        console.error('도서관 보유 도서 통계 오류:', error);
        res.status(500).json({ error: '통계를 불러올 수 없습니다.' });
    }
});

// API 키 관리 엔드포인트들

// 현재 API 키 조회
router.get('/api-key', async (req, res) => {
    try {
        const apiKeys = await global.readData('apiKeys') || {};
        const currentKey = apiKeys.aladinApiKey || 'ttbdlwlrma1232001'; // 기본값
        
        // 보안을 위해 키를 마스킹하여 반환
        const maskedKey = currentKey.length > 9 
            ? currentKey.substring(0, 6) + '*'.repeat(currentKey.length - 9) + currentKey.substring(currentKey.length - 3)
            : currentKey;
        
        res.json({
            maskedKey,
            isDefault: currentKey === 'ttbdlwlrma1232001',
            lastUpdated: apiKeys.lastUpdated || null
        });
        
    } catch (error) {
        console.error('API 키 조회 오류:', error);
        res.status(500).json({ error: 'API 키 조회 중 오류가 발생했습니다.' });
    }
});

// 실제 API 키 조회 (내부 사용용)
router.get('/api-key/actual', async (req, res) => {
    try {
        const apiKeys = await global.readData('apiKeys') || {};
        const currentKey = apiKeys.aladinApiKey || 'ttbdlwlrma1232001';
        
        res.json({
            apiKey: currentKey,
            isDefault: currentKey === 'ttbdlwlrma1232001'
        });
        
    } catch (error) {
        console.error('실제 API 키 조회 오류:', error);
        res.status(500).json({ error: 'API 키 조회 중 오류가 발생했습니다.' });
    }
});

// API 키 설정
router.put('/api-key', async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey || typeof apiKey !== 'string') {
            return res.status(400).json({ error: 'API 키를 입력해주세요.' });
        }
        
        const trimmedKey = apiKey.trim();
        
        if (trimmedKey && !trimmedKey.startsWith('ttb')) {
            return res.status(400).json({ error: 'TTB 키는 "ttb"로 시작해야 합니다.' });
        }
        
        const apiKeys = await global.readData('apiKeys') || {};
        apiKeys.aladinApiKey = trimmedKey || 'ttbdlwlrma1232001';
        apiKeys.lastUpdated = new Date().toISOString();
        
        const success = await global.writeData('apiKeys', apiKeys);
        
        if (success) {
            const maskedKey = apiKeys.aladinApiKey.length > 9 
                ? apiKeys.aladinApiKey.substring(0, 6) + '*'.repeat(apiKeys.aladinApiKey.length - 9) + apiKeys.aladinApiKey.substring(apiKeys.aladinApiKey.length - 3)
                : apiKeys.aladinApiKey;
            
            res.json({
                message: 'API 키가 저장되었습니다.',
                maskedKey,
                isDefault: apiKeys.aladinApiKey === 'ttbdlwlrma1232001'
            });
        } else {
            res.status(500).json({ error: 'API 키 저장에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('API 키 설정 오류:', error);
        res.status(500).json({ error: 'API 키 설정 중 오류가 발생했습니다.' });
    }
});

// API 키 초기화 (기본값으로 복원)
router.delete('/api-key', async (req, res) => {
    try {
        const apiKeys = await global.readData('apiKeys') || {};
        apiKeys.aladinApiKey = 'ttbdlwlrma1232001';
        apiKeys.lastUpdated = new Date().toISOString();
        
        const success = await global.writeData('apiKeys', apiKeys);
        
        if (success) {
            res.json({
                message: '기본 API 키로 복원되었습니다.',
                maskedKey: 'ttbdlw***001',
                isDefault: true
            });
        } else {
            res.status(500).json({ error: 'API 키 초기화에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('API 키 초기화 오류:', error);
        res.status(500).json({ error: 'API 키 초기화 중 오류가 발생했습니다.' });
    }
});

// API 키로 알라딘 API 연결 테스트
router.post('/api-key/test', async (req, res) => {
    try {
        const { apiKey } = req.body;
        const testKey = apiKey || (await global.readData('apiKeys') || {}).aladinApiKey || 'ttbdlwlrma1232001';
        
        // Node.js 내장 https 모듈 사용
        const https = require('https');
        const url = require('url');
        
        const testUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${testKey}&Query=test&QueryType=Title&MaxResults=1&start=1&SearchTarget=Book&output=xml&Version=20131101`;
        const parsedUrl = url.parse(testUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'GET',
            timeout: 10000
        };
        
        const testRequest = new Promise((resolve, reject) => {
            const req = https.request(options, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        data: data
                    });
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('요청 시간 초과'));
            });
            
            req.setTimeout(10000);
            req.end();
        });
        
        const result = await testRequest;
        
        if (result.statusCode === 200 && (result.data.includes('<object>') || result.data.includes('<item>'))) {
            res.json({
                success: true,
                message: 'API 키가 정상적으로 작동합니다.'
            });
        } else if (result.data.includes('Invalid TTBKey') || result.data.includes('API출력이 금지된 회원입니다')) {
            res.json({
                success: false,
                message: '유효하지 않은 API 키이거나 사용이 제한된 키입니다.'
            });
        } else {
            console.log('API 테스트 응답:', result.data.substring(0, 200)); // 디버깅용
            res.json({
                success: false,
                message: 'API 연결에 실패했습니다.'
            });
        }
        
    } catch (error) {
        console.error('API 테스트 오류:', error);
        res.json({
            success: false,
            message: `API 테스트 중 오류가 발생했습니다: ${error.message}`
        });
    }
});

// 알라딘 API 프록시 엔드포인트 (개선된 버전)
router.get('/aladin-proxy', async (req, res) => {
    try {
        const { endpoint, ttbkey, ...otherParams } = req.query;
        
        // 기본 API 키 사용 (쿼리에 없는 경우)
        const apiKey = ttbkey || (await global.readData('apiKeys') || {}).aladinApiKey || 'ttbgujeongmo2105001';
        
        const https = require('https');
        const url = require('url');
        
        // 엔드포인트 검증
        const validEndpoints = ['ItemSearch.aspx', 'ItemList.aspx', 'ItemLookUp.aspx', 'ItemOffStoreList.aspx'];
        const targetEndpoint = endpoint || 'ItemSearch.aspx';
        
        if (!validEndpoints.includes(targetEndpoint)) {
            return res.status(400).json({ error: '지원하지 않는 API 엔드포인트입니다.' });
        }
        
        // 기본 파라미터 설정
        const params = new URLSearchParams({
            ttbkey: apiKey,
            output: 'js',
            Version: '20131101',
            Cover: 'MidBig',
            ...otherParams
        });
        
        // 엔드포인트별 기본값 설정
        if (targetEndpoint === 'ItemSearch.aspx') {
            if (!params.has('Query')) params.set('Query', 'test');
            if (!params.has('QueryType')) params.set('QueryType', 'Title');
            if (!params.has('MaxResults')) params.set('MaxResults', '20');
            if (!params.has('start')) params.set('start', '1');
            if (!params.has('SearchTarget')) params.set('SearchTarget', 'Book');
        } else if (targetEndpoint === 'ItemList.aspx') {
            if (!params.has('QueryType')) params.set('QueryType', 'Bestseller');
            if (!params.has('MaxResults')) params.set('MaxResults', '20');
            if (!params.has('start')) params.set('start', '1');
            if (!params.has('SearchTarget')) params.set('SearchTarget', 'Book');
        } else if (targetEndpoint === 'ItemLookUp.aspx') {
            if (!params.has('ItemId')) {
                return res.status(400).json({ error: 'ItemId가 필요합니다.' });
            }
            if (!params.has('ItemIdType')) params.set('ItemIdType', 'ISBN13');
        }
        
        // API URL 구성
        const apiUrl = `https://www.aladin.co.kr/ttb/api/${targetEndpoint}?${params.toString()}`;
        console.log('알라딘 API 호출:', apiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
        
        const parsedUrl = url.parse(apiUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'GET',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const apiRequest = new Promise((resolve, reject) => {
            const req = https.request(options, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        data: data,
                        headers: response.headers
                    });
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('요청 시간 초과'));
            });
            
            req.setTimeout(15000);
            req.end();
        });
        
        const result = await apiRequest;
        
        if (result.statusCode === 200) {
            // JSONP 응답을 JSON으로 변환
            let jsonData = result.data;
            
            // JSONP 콜백 함수 제거
            const callbackMatch = jsonData.match(/^[^(]*\((.*)\);?\s*$/);
            if (callbackMatch) {
                jsonData = callbackMatch[1];
            }
            
            try {
                const parsedData = JSON.parse(jsonData);
                
                // 응답 로깅 (디버깅용)
                console.log(`API 응답 성공 (${targetEndpoint}):`, {
                    totalResults: parsedData.totalResults || 0,
                    itemCount: parsedData.item?.length || 0,
                    query: params.get('Query') || params.get('QueryType') || params.get('ItemId')
                });
                
                res.json(parsedData);
            } catch (parseError) {
                console.error('JSON 파싱 오류:', parseError);
                console.error('원본 응답 (처음 500자):', result.data.substring(0, 500));
                res.status(500).json({ error: 'API 응답 파싱 실패' });
            }
        } else {
            console.error(`API 호출 실패 (${result.statusCode}):`, result.data.substring(0, 200));
            res.status(result.statusCode).json({ error: 'API 호출 실패' });
        }
        
    } catch (error) {
        console.error('알라딘 API 프록시 오류:', error);
        res.status(500).json({ error: `API 프록시 오류: ${error.message}` });
    }
});

// 문자열 유사도 계산 함수 (Levenshtein distance 기반)
function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
}

// 기보유 도서 목록 조회 (library-holdings 경로)
router.get('/library-holdings', async (req, res) => {
    try {
        const ownedBooks = await global.readData('ownedBooks');
        res.json(ownedBooks);
    } catch (error) {
        console.error('기보유 도서 목록 조회 오류:', error);
        res.status(500).json({ error: '기보유 도서 목록을 불러올 수 없습니다.' });
    }
});

// 기보유 도서 삭제 (library-holdings 경로)
router.delete('/library-holdings/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const ownedBooks = await global.readData('ownedBooks');
        
        // ISBN 또는 제목으로 도서 찾기
        const bookIndex = ownedBooks.findIndex(book => 
            book.isbn === identifier || book.title === identifier
        );
        
        if (bookIndex === -1) {
            return res.status(404).json({ error: '도서를 찾을 수 없습니다.' });
        }
        
        const deletedBook = ownedBooks.splice(bookIndex, 1)[0];
        
        const success = await global.writeData('ownedBooks', ownedBooks);
        if (success) {
            res.json({ message: '도서가 삭제되었습니다.', book: deletedBook });
        } else {
            res.status(500).json({ error: '도서 삭제에 실패했습니다.' });
        }
        
    } catch (error) {
        console.error('기보유 도서 삭제 오류:', error);
        res.status(500).json({ error: '도서 삭제 중 오류가 발생했습니다.' });
    }
});

// CSV 다운로드 엔드포인트 추가
router.get('/library-holdings/download-csv', async (req, res) => {
    try {
        const ownedBooks = await global.readData('ownedBooks');
        
        // CSV 헤더
        const headers = ['제목', '저자', '출판사', '출판년도', '등록번호', '추가일'];
        
        // CSV 데이터 생성
        const csvRows = [headers.join(',')];
        
        ownedBooks.forEach(book => {
            const row = [
                `"${(book.title || '').replace(/"/g, '""')}"`,
                `"${(book.author || '').replace(/"/g, '""')}"`,
                `"${(book.publisher || '').replace(/"/g, '""')}"`,
                `"${(book.year || '').replace(/"/g, '""')}"`,
                `"${(book.regNo || '').replace(/"/g, '""')}"`,
                `"${(book.addedAt || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        
        // CSV 파일로 응답
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="library-holdings.csv"');
        res.send('\uFEFF' + csvContent); // BOM 추가로 한글 깨짐 방지
        
    } catch (error) {
        console.error('CSV 다운로드 오류:', error);
        res.status(500).json({ error: 'CSV 다운로드 중 오류가 발생했습니다.' });
    }
});

// 도서관 보유 도서 처리 진행 상황 조회
router.get('/library-holdings/progress', async (req, res) => {
    try {
        const progressFile = path.join(__dirname, '../data/processing-progress.json');
        
        try {
            const progressData = await fs.readFile(progressFile, 'utf8');
            const progress = JSON.parse(progressData);
            
            res.json({
                isProcessing: true,
                processedCount: progress.processedCount,
                apiCallsToday: progress.apiCallsToday,
                lastProcessedDate: progress.lastProcessedDate,
                dailyLimit: 4000
            });
        } catch (error) {
            res.json({
                isProcessing: false,
                processedCount: 0,
                apiCallsToday: 0,
                lastProcessedDate: null,
                dailyLimit: 4000
            });
        }
    } catch (error) {
        console.error('진행 상황 조회 오류:', error);
        res.status(500).json({ error: '진행 상황을 조회할 수 없습니다.' });
    }
});

// 도서관 보유 도서 처리 재시작
router.post('/library-holdings/resume', async (req, res) => {
    try {
        const progressFile = path.join(__dirname, '../data/processing-progress.json');
        
        // 진행 상황 파일이 있는지 확인
        try {
            const progressData = await fs.readFile(progressFile, 'utf8');
            const progress = JSON.parse(progressData);
            
            // 오늘 API 제한 확인
            const today = new Date().toDateString();
            let apiCallsToday = progress.apiCallsToday;
            
            if (progress.lastProcessedDate !== today) {
                apiCallsToday = 0;
            }
            
            if (apiCallsToday >= 4000) {
                return res.status(400).json({ 
                    error: '오늘의 API 호출 제한에 도달했습니다. 내일 다시 시도해주세요.',
                    apiCallsToday,
                    dailyLimit: 4000
                });
            }
            
            res.json({
                message: '이전 작업을 계속하려면 같은 CSV 파일을 다시 업로드해주세요.',
                progress: {
                    processedCount: progress.processedCount,
                    apiCallsToday,
                    lastProcessedDate: progress.lastProcessedDate
                }
            });
            
        } catch (error) {
            res.status(404).json({ error: '진행 중인 작업이 없습니다.' });
        }
    } catch (error) {
        console.error('작업 재시작 오류:', error);
        res.status(500).json({ error: '작업 재시작 중 오류가 발생했습니다.' });
    }
});

// 도서관 보유 도서 처리 취소 (진행 상황 삭제)
router.delete('/library-holdings/progress', async (req, res) => {
    try {
        const progressFile = path.join(__dirname, '../data/processing-progress.json');
        
        try {
            await fs.unlink(progressFile);
            res.json({ message: '진행 상황이 삭제되었습니다. 새로 시작할 수 있습니다.' });
        } catch (error) {
            res.status(404).json({ error: '삭제할 진행 상황이 없습니다.' });
        }
    } catch (error) {
        console.error('진행 상황 삭제 오류:', error);
        res.status(500).json({ error: '진행 상황 삭제 중 오류가 발생했습니다.' });
    }
});

// 알라딘 API 설정
const ALADIN_TTB_KEY = 'ttbkubum1124001';
const ALADIN_API_URL = 'http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx';

// 도서 커버 이미지 가져오기
router.get('/cover/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        
        if (!isbn) {
            return res.status(400).json({ error: 'ISBN이 필요합니다.' });
        }
        
        // 알라딘 API에서 도서 정보 조회
        const response = await axios.get(ALADIN_API_URL, {
            params: {
                ttbkey: ALADIN_TTB_KEY,
                ItemId: isbn,
                ItemIdType: 'ISBN',
                output: 'JS',
                Version: '20131101'
            },
            timeout: 10000
        });

        if (response.data && response.data.item && response.data.item.length > 0) {
            const book = response.data.item[0];
            res.json({ 
                cover: book.cover,
                title: book.title,
                author: book.author
            });
        } else {
            res.status(404).json({ error: '도서를 찾을 수 없습니다.' });
        }
        
    } catch (error) {
        console.error('도서 커버 조회 오류:', error);
        res.status(500).json({ error: '도서 커버 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router; 