/**
 * 기존 신청 데이터에 cover 이미지 URL 추가 스크립트
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// 알라딘 API 설정
const ALADIN_TTB_KEY = 'ttbkubum1124001'; // 실제 API 키로 교체 필요
const ALADIN_API_URL = 'http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx';

// 데이터 파일 경로
const APPLICATIONS_FILE = path.join(__dirname, 'backend/data/applications.json');

/**
 * 알라딘 API에서 도서 정보 조회
 */
async function getBookInfo(isbn) {
    try {
        const response = await axios.get(ALADIN_API_URL, {
            params: {
                ttbkey: ALADIN_TTB_KEY,
                ItemId: isbn,
                ItemIdType: 'ISBN',
                output: 'JS',
                Version: '20131101',
                OptResult: 'ratingInfo'
            },
            timeout: 10000
        });

        if (response.data && response.data.item && response.data.item.length > 0) {
            const book = response.data.item[0];
            return {
                cover: book.cover,
                title: book.title,
                author: book.author,
                publisher: book.publisher
            };
        }
        return null;
    } catch (error) {
        console.warn(`ISBN ${isbn} 조회 실패:`, error.message);
        return null;
    }
}

/**
 * 신청 데이터 업데이트
 */
async function updateApplicationCovers() {
    try {
        console.log('📚 신청 데이터 cover 필드 업데이트 시작...');
        
        // 기존 데이터 읽기
        const applicationsData = await fs.readFile(APPLICATIONS_FILE, 'utf8');
        const applications = JSON.parse(applicationsData);
        
        if (!Array.isArray(applications) || applications.length === 0) {
            console.log('❌ 업데이트할 신청 데이터가 없습니다.');
            return;
        }
        
        console.log(`📋 총 ${applications.length}개의 신청 데이터 발견`);
        
        let updateCount = 0;
        let skipCount = 0;
        
        // 각 신청에 대해 cover 필드 추가
        for (let i = 0; i < applications.length; i++) {
            const app = applications[i];
            
            // 이미 cover 필드가 있으면 스킵
            if (app.cover) {
                console.log(`⏭️  [${i+1}/${applications.length}] 이미 cover 있음: ${app.title}`);
                skipCount++;
                continue;
            }
            
            console.log(`🔍 [${i+1}/${applications.length}] 조회 중: ${app.title} (ISBN: ${app.isbn})`);
            
            // 알라딘 API에서 도서 정보 조회
            const bookInfo = await getBookInfo(app.isbn);
            
            if (bookInfo && bookInfo.cover) {
                app.cover = bookInfo.cover;
                updateCount++;
                console.log(`✅ [${i+1}/${applications.length}] 업데이트 완료: ${app.title}`);
            } else {
                console.log(`❌ [${i+1}/${applications.length}] 커버 이미지 없음: ${app.title}`);
            }
            
            // API 호출 간격 (알라딘 API 제한 고려)
            if (i < applications.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // 업데이트된 데이터 저장
        await fs.writeFile(APPLICATIONS_FILE, JSON.stringify(applications, null, 2), 'utf8');
        
        console.log('\n📊 업데이트 완료:');
        console.log(`✅ 업데이트된 신청: ${updateCount}개`);
        console.log(`⏭️  스킵된 신청: ${skipCount}개`);
        console.log(`❌ 실패한 신청: ${applications.length - updateCount - skipCount}개`);
        
    } catch (error) {
        console.error('❌ 업데이트 중 오류:', error);
    }
}

// 스크립트 실행
if (require.main === module) {
    updateApplicationCovers();
}

module.exports = { updateApplicationCovers }; 