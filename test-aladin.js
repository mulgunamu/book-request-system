const https = require('https');
const url = require('url');

// 알라딘 API 테스트 함수
async function testAladinAPI() {
    const apiKey = 'ttbgujeongmo2105001';
    const testQueries = [
        '해리포터',
        '마틸다',
        '에듀테크',
        '교실에서 바로 통하는',
        '(교실에서 바로 통하는)배움중심수업'
    ];
    
    for (const query of testQueries) {
        console.log(`\n🔍 테스트 검색: "${query}"`);
        
        try {
            const searchUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${apiKey}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=3&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=MidBig`;
            
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
                    console.log(`✅ 검색 성공: ${parsedData.item.length}개 결과`);
                    parsedData.item.forEach((item, index) => {
                        console.log(`   ${index + 1}. "${item.title}" - ${item.author} (ISBN: ${item.isbn13 || item.isbn})`);
                    });
                } else {
                    console.log(`❌ 검색 결과 없음`);
                }
            } else {
                console.log(`❌ API 호출 실패 (${result.statusCode})`);
                console.log(`응답: ${result.data.substring(0, 200)}`);
            }
            
        } catch (error) {
            console.log(`💥 오류: ${error.message}`);
        }
        
        // 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testAladinAPI(); 