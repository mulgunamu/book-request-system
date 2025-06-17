const fs = require('fs').promises;
const path = require('path');

async function migrateData() {
    try {
        // 1. 현재 작업 디렉토리 기준으로 경로 설정
        const dataDir = path.join(process.cwd(), 'data');
        console.log('현재 작업 디렉토리:', process.cwd());
        console.log('데이터 디렉토리:', dataDir);

        // 2. 기존 데이터 읽기
        console.log('\n파일 읽기 시작...');
        
        const applicationsPath = path.join(dataDir, 'applications.json');
        
        console.log('applications.json 경로:', applicationsPath);
        
        // 파일 존재 여부 확인
        try {
            await fs.access(applicationsPath);
            console.log('applications.json 파일 확인됨');
        } catch (error) {
            throw new Error(`applications.json 파일을 찾을 수 없습니다: ${applicationsPath}`);
        }
        
        const applicationsData = await fs.readFile(applicationsPath, 'utf8');
        const applications = JSON.parse(applicationsData);
        
        console.log('\n파일 읽기 완료');
        console.log(`- applications.json: ${applications.length}개 항목`);
        
        // 3. applications 데이터를 books 형식으로 변환
        const convertedBooks = applications.map(app => ({
            id: app.id,
            title: app.title,
            author: app.author,
            authors: [app.author],
            publisher: app.publisher,
            price: app.price,
            isbn: app.isbn,
            gradeClass: app.classId,
            grade: parseInt(app.classId.split('-')[0]),
            classNumber: parseInt(app.classId.split('-')[1]),
            teacher: '',  // 나중에 classes.json에서 가져올 수 있음
            requestDate: app.appliedAt,
            requestTimestamp: new Date(app.appliedAt).getTime(),
            source: 'applications_migration',
            status: 'pending',
            isDuplicate: false,
            duplicateInfo: null
        }));
        
        console.log('\n데이터 변환 완료');
        console.log(`- 변환된 도서: ${convertedBooks.length}권`);
        
        // 4. 기존 applications.json 백업
        const backupPath = path.join(dataDir, 'applications.backup.json');
        await fs.copyFile(applicationsPath, backupPath);
        console.log('\napplications.json 백업 완료:', backupPath);
        
        // 5. 통합된 데이터 저장
        await fs.writeFile(applicationsPath, '[]');
        console.log('applications.json 초기화 완료');
        
        console.log('\n데이터 통합이 완료되었습니다.');
        console.log(`- 변환된 도서: ${convertedBooks.length}권`);
        
    } catch (error) {
        console.error('\n데이터 통합 중 오류 발생:', error.message);
        
        if (error.code === 'ENOENT') {
            console.error('\n파일을 찾을 수 없습니다.');
            console.error('현재 작업 디렉토리에 다음 파일들이 존재하는지 확인해주세요:');
            console.error('- data/applications.json');
        }
    }
}

// 스크립트 실행
migrateData(); 