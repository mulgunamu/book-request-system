/**
 * 학급 패스워드를 올바른 형태로 수정하는 스크립트
 * class2024! → class11^^, class12^^ 등의 형태로 변경
 */

const fs = require('fs').promises;
const path = require('path');

async function readData(filename) {
    try {
        const filePath = path.join(__dirname, 'backend', 'data', `${filename}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ ${filename} 읽기 실패:`, error.message);
        return {};
    }
}

async function writeData(filename, data) {
    try {
        const filePath = path.join(__dirname, 'backend', 'data', `${filename}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`❌ ${filename} 쓰기 실패:`, error.message);
        return false;
    }
}

async function fixPasswords() {
    console.log('🔐 학급 패스워드 수정 작업 시작...');
    
    try {
        // 현재 학급 데이터 로드
        const classes = await readData('classes');
        console.log('📊 현재 학급 수:', Object.keys(classes).length);
        
        let updatedCount = 0;
        
        // 각 학급의 패스워드 수정
        Object.entries(classes).forEach(([classId, classData]) => {
            const correctPassword = `class${classData.grade}${classData.class}^^`;
            
            if (classData.password !== correctPassword) {
                console.log(`🔄 ${classId} 패스워드 변경: ${classData.password} → ${correctPassword}`);
                classes[classId] = {
                    ...classData,
                    password: correctPassword,
                    updatedAt: new Date().toISOString()
                };
                updatedCount++;
            } else {
                console.log(`✅ ${classId} 패스워드 이미 올바름: ${correctPassword}`);
            }
        });
        
        if (updatedCount > 0) {
            // 수정된 데이터 저장
            const success = await writeData('classes', classes);
            
            if (success) {
                console.log(`✅ ${updatedCount}개 학급 패스워드 수정 완료!`);
                console.log('🎉 모든 작업이 완료되었습니다.');
            } else {
                console.error('❌ 데이터 저장 실패');
            }
        } else {
            console.log('✅ 모든 학급의 패스워드가 이미 올바른 형태입니다.');
        }
        
    } catch (error) {
        console.error('❌ 패스워드 수정 작업 실패:', error);
    }
}

// 스크립트 실행
if (require.main === module) {
    fixPasswords();
}

module.exports = { fixPasswords }; 