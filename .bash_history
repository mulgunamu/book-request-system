whoami
cd ~
pwd
cd public_html/
ls -la
cd js
ls -l;a
ls -la
cd ~/public_html/
ls -la
chmod -R 755 ~/public_html
chmod -R 644 ~/public_html/*
sudo chmod -R 644 ~/public_html/*
chmod 775 ~/public_html/js
ls -la ~/public_html/
cd ~/public_html/js
ls -la
touch test_file.txt
ls -la
exit
whoami
pwd
ls -la
cd public_html/
ls -la
cd js
ls
ls -la
cd ..
pwd
ls -la
ls -la public_html/
node --version
nmp --version
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
cd ~
pwd
mkdir backend
mkdir data
ls -la
cd backend/
pwd
npm init -y
npm install express cors
ls -la
cat package.json
nano server.js
node server.js
sudo nano /etc/apache2/sites-available/book.koowoo.kr.conf
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite book.koowoo.kr
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo systemctl status apache2
curl http://localhost:3001/api/test
curl http://book.koowoo.kr/api/test
curl https://book.koowoo.kr/api/test
sudo nano /etc/apache2/sites-available/book.koowoo.kr.conf
sudo a2enmod ssl
sudo apache2ctl configtest
sudo systemctl reload apache2
curl https://book.koowoo.kr/api/test
ps aux | grep node
netstat -tlnp | grep 3001
sudo tail -f /var/log/apache2/book.koowoo.kr_ssl_error.log
curl http://localhost:3001/api/test
cd /home/book/backend
node server.js
ps aux | grep node
cd /home/book/backend
node server.js
sudo tail -10 /var/log/apache2/error.log
sudo tail -10 /var/log/apache2/book.koowoo.kr_ssl_error.log
curl https://book.koowoo.kr/api/test
curl http://localhost:3001/api/test
sudo a2ensite book.koowoo.kr
sudo apache2ctl -S
sudo apache2ctl -M | grep proxy
sudo apache2ctl -M | grep ssl
# Let's Encrypt SSL 설정 파일 편집
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf
sudo apache2ctl configtest
sudo systemctl restart apache2
sudo systemctl status apache2
cd /var/www/book.koowoo.kr
cd /home/book/public_html
ls -la
whoami
sudo apach2ctl configtest
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo systemctl status apache2
ps aux | grep node
netstat -tlnp | grep 3001
curl https://book.koowoo.kr/api/test
curl http://localhost:3001/api/test
cd /home/book/public_html
ls -la
ls -la js/
mkdir /home/book/backup_old
mv /home/book/public_html/* /home/book/backup_old/
ls -la
p0wd
pwd
cd ..
ls -la
cd /home/book/public_html
ls -la
mkdir -p js pages
ls -la
more index.html 
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
curl -I https://book.koowoo.kr
cd ..
ls -la
cd backend
ls -la
nano server.js
node server.js
ㅊㅇ ..
cd ..
ls -la
cd data
ls -la
pwd
cd ..
ps aux | grep node
ls -la /home/book/data/
pkill -f "node server.js"
cd /home/book/backend
ls -la server.js
node server.js
curl https://book.koowoo.kr/api/admin/statistics
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf
sudo systemctl reload apache2
curl https://book.koowoo.kr/api/test
ps aux | grep node
netstat -tlnp | grep 3001
curl http://localhost:3001/api/test
pkill -f node
cd /home/book/backend
ls -la server.js
node server.js
curl http://localhost:3001/api/test
curl https://book.koowoo.kr/api/test
ls -la /home/book/public_html/js/
find . -name "*owned*" -o -name "*book*" -o -name "*.backup" -o -name "*.bak" | head -20
ls -la data/
cd ..
cd ~/book
cd ~book
pwd
cd public_html/
ls
cd data
ls -la
cd ..
ls -la
cd data
ls -la
pwd
cd ..
cd admin
ls -la
cd ..
wc -l data/books.json
cd ..
wc -l data/books.json
find . -name "*.json" -size +10k -exec ls -lh {} \;
find . -name "*.json" -size +1k -not -path "./node_modules/*" -exec ls -lh {} \;
head -20 data/books.json
ps aux | grep node
ls -la /home/book/backend/data/
cat /home/book/backend/data/owned-books.json
find /home/book -name "*.json" -size +10k -exec ls -lh {} \;
find /home/book -name "*book*" -o -name "*owned*" -o -name "*.backup" -o -name "*csv*" | head -20
wc -l /home/book/public_html/data/libraryholdings.csv
head -50 /home/book/backend/routes/books.js
grep -n -A 10 -B 5 "API" /home/book/backend/routes/books.js
find . -name "*backup*" -o -name "*classes*" -type f | head -20
cat ./data/classes.json
cat ./backup_old
ls -la ./backup_old/
pkill -f "node.*server.js"
nohup node backend/server.js > server.log 2>&1 &
ps aux | grep "node.*server.js"
ls -la /home/book/backend/data/backups/
ls /home/book/backend/data/backups/ | wc -l
sudo apt-get update && sudo apt-get install -y tmux
tmux new-session -A -s book-server
ls -la
ps aux | grep "node.*server.js"
pkill -f "node.*server.js"
ps aux | grep "node.*server.js"
pkill -f "node.*server.js"
ps aux | grep "node.*server.js"
nohup node backend/server.js > server.log 2>&1 &
ps aux | grep "node.*server.js"
pkill -f "node.*server.js"
sleep 2
ps aux | grep server.js
ls /home/book/backend/data/backups/ | wc -l
ls -lt /home/book/backend/data/backups/
pkill -f "node.*server.js"
nohup node backend/server.js > server.log 2>&1 &
# 원격 서버 접속 후
echo '{"isSetup": false, "email": null, "passwordHash": null, "verificationTokens": {}, "createdAt": null, "lastLoginAt": null}' > /home/book/backend/data/admin.json
cat /home/book/backend/data/admin.json
# 백업에서 설정된 admin.json 찾기 (isSetup: true인 것들)
for backup in /home/book/backend/data/backups/*/; do     echo "=== $(basename "$backup") ===";     if [ -f "$backup/admin.json" ]; then         setup_status=$(cat "$backup/admin.json" | grep '"isSetup"' | grep 'true');         if [ ! -z "$setup_status" ]; then             echo "✅ 설정된 계정 발견!";             cat "$backup/admin.json" | grep -E '"isSetup"|"email"|"createdAt"';         else             echo "초기 상태";         fi;     else         echo "admin.json 없음";     fi;     echo ""; done
cp /home/book/backend/data/backups/2025-06-07T06-51-16-592Z_manual_full/admin.json /home/book/backend/data/admin.json
cat /home/book/backend/data/admin.json
curl -X POST http://localhost:3000/api/admin/set-password   -H "Content-Type: application/json"   -d '{"email": "mkrule@gyo6.net", "password": "kooclean9109*!"}'
clear
cat /home/book/backend/data/classes.json | grep '4-3'
cat /home/book/backend/data/classes.json | jq '.["4-3"]'
pkill -f "node.*server.js"
cd /home/book
nohup node backend/server.js > server.log 2>&1 &
curl -X GET http://localhost:3000/api/classes/settings
ps aux | grep "node server.js" | grep -v grep
nohup node server.js > server.log 2>&1 &
tail -f server.log
cd backend && nohup node server.js > server.log 2>&1 &
ps aux | grep "node server.js" | grep -v grep
pwd
cd backend
nohup node server.js > server.log 2>&1 &
npm install
node server.js
cd backend && node server.js
cd backend && npm install axios
npm install axios
tmux new-session -A -s book-server
tmux attach -t book-server
tmux ls
tmux attach -t book-server
nset TMUX && tmux attach -t book-server
unset TMUX && tmux attach -t book-server
tmux attach -t book-server
tmux new-session -s book-server
pkill -f tmux
nohup node server.js > server.log 2>&1 &
ps aux | grep "node server.js" | grep -v grep
pkill -f "node.*server.js"
ps aux | grep "node server.js" | grep -v grep
nohup node server.js > server.log 2>&1 &
find .. -name "*.json" -type f
find .. -type f -name "*.json" -exec grep -l "결국 국민이 합니다" {} \;
find . -type f -name "*.json" -exec grep -l "결국 국민이 합니다" {} \;
find . -type f -name "*.json" -exec grep -i "결국 국민이 합니다" {} \;
find . -type f -name "*.json" -exec grep -i "청춘의 독서" {} \;
find . -type f -name "*.json" -exec grep -l -i "청춘의 독서" {} \;
find . -type f -name "*.json" -exec grep -i "그의 운명에 대한 아주 개인적인 생각" {} \;
find . -type f -name "*.json" -exec grep -i '"classId": "1-2"' {} \;
find . -type f -name "*.json" -exec grep -l '"classId": "1-2"' {} \;
find . -type f -name "*.json" -exec grep -i '"price": 16800' {} \;
d .. && find . -type f -name "*appl*.json" -o -name "*request*.json" -o -name "*book*.json"
cd .. && find . -type f -name "*appl*.json" -o -name "*request*.json" -o -name "*book*.json"
node data-migration.js
pwd
cd book
cd backend/
node data-migration.js
pm2 restart all
pwd
cat /home/book/backend/data/books.json | cat
cat /home/book/backend/data/applications.json | cat
ls -la /home/book/backend/data/backups/ | cat
tail -n 100 /home/book/.pm2/logs/book-system-out.log | cat
cat /home/book/backend/server.js | cat
curl -s http://localhost:3000/api/books | cat
pm2 list | cat
curl -s http://localhost:3000/api/applications | cat
curl -s http://book.school.kr/api/applications | cat
curl -s http://book.school.kr/api/books | cat
tail -n 100 /home/book/.pm2/logs/book-system-out.log | grep -i "청춘의 독서\|결국 국민이" | cat
ls -la /home/book/backend/data/[^b]*.json | cat
pm2 start server.js --name book-server
ls -la
cd backend
pm2 start server.js --name book-server
pm stop book-server
pm2 stop book-server
pm2 delete book-server
http://localhost:3000/api/applications
hostname -I | awk '{print $1}'
pwd
pm2 list
pm2 restart book-system
pm2 restart book-system  
pm2 describe
pm2 describe book-system
pwd
ls -la
cd routes
pwd
ls -la
cat classes.js 
cd ..
cd b
cd backend/
ls
cd routes
ls -la
cat classes.js 
pm2 restart book-system  
pm2 restart book-system
tail -f /home/book/.pm2/logs/book-system-out.log
pm2 restart all
pm2 restart book-system
pm2 log
pm2 list
cd backend/
ls -la
pwd
sudo nano /etc/nginx/sites-enabled/default
sudo nano /etc/nginx/nginx.conf
cd etc
cd /etc
ls
cd apache2
cd sites-enabled/
ls
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr.conf
sudo systemctl restart apache2
sudo netstat -tlnp | grep 3000
curl -X POST http://localhost:3000/api/classes/authenticate   -H "Content-Type: application/json"   -d '{"classId":"1-1","password":"class11^^"}'
sudo tail -n 100 /var/log/apache2/error.log
√
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf
sudo tail -n 100 /var/log/apache2/book.koowoo.kr-access.log
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr.conf
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf 
sudo systemctl restart apache2
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr.conf
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf 
apachectl -S | cat
..
apachectl -S | cat
cd ..
apachectl -S | cat
clear
apache2ctl -S | cat
which apache2
sudo which apache2
/usr/sbin/apache2ctl -S | cat
cat /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf | cat
cat /etc/apache2/sites-enabled/book.koowoo.kr.conf | cat
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr.conf
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf 
sudo systemctl restart apache2
cat /home/book/backend/routes/classes.js | cat
pm2 restart
pm2 restart all
cd /home/book/backend
git pull
nano /home/book/backend/routes/classes.js
tail -f /var/log/apache2/book.koowoo.kr-access.log
sudo tail -f /var/log/apache2/book.koowoo.kr-access.log
pm2 logs | cat
date
timedatectl status
sudo timedatectl set-timezone Asia/Seoul
timedatectl status
exit
curl -X POST http://localhost:3000/api/classes/authenticate   -H "Content-Type: application/json"   -d '{"classId":"1-1","password":"class11^^"}'
cat /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf
sudo nano /etc/apache2/sites-enabled/book.koowoo.kr-le-ssl.conf
sudo systemctl restart apache2
sudo apachectl configtest
sudo a2enmod headers
sudo systemctl restart apache2
pwd
cd public_html/
ls -la
la -la js
cat /home/book/backend/data/classes.json | cat
curl -s http://localhost:3000/api/applications | head -c 2000
pm2 restart all
pwd
ls -la
cd js
ls
more main.js
cat main.js -5
cat --help
cat main.js
pm2 restart all
pm2 logs book-system --lines 5
find . -name "main.js" -type f
find ~ -name "main.js" -type f
cp /home/book/js/main.js /home/book/public_html/js/main.js
head -5 /home/book/public_html/js/main.js
cp /home/book/js/api-handler.js /home/book/public_html/js/api-handler.js
head -5 /home/book/public_html/js/api-handler.js
ls -la /home/book/
pm2 show book-system
ls -la /home/book/backend/
ls -la /home/book/public_html/
cat /home/book/backend/server.js | grep -A 10 -B 10 "static"
pm2 restart book-system
head -10 /home/book/public_html/js/api-handler.js
tail -10 /home/book/public_html/js/api-handler.js
grep -n "AladinAPI\|class.*API" /home/book/public_html/js/api-client.js
grep -n "AladinAPI\|class.*API" /home/book/public_html/js/utils.js
sed -i 's/window.AladinAPI = AladinAPI;/const AladinAPI = new AladinAPI();\nwindow.AladinAPI = AladinAPI;/' /home/book/public_html/js/api-handler.js
tail -5 /home/book/public_html/js/api-handler.js
sed -i 's/const AladinAPI = new AladinAPI();/const AladinAPIInstance = new AladinAPI();/' /home/book/public_html/js/api-handler.js
sed -i 's/window.AladinAPI = AladinAPI;/window.AladinAPI = AladinAPIInstance;/' /home/book/public_html/js/api-handler.js
tail -5 /home/book/public_html/js/api-handler.js
sed -i 's/const AladinAPI = new AladinAPI();/const AladinAPIInstance = new AladinAPI();/' /home/book/public_html/js/api-handler.js
sed -i 's/window.AladinAPI = AladinAPI;/window.AladinAPI = AladinAPIInstance;/' /home/book/public_html/js/api-handler.js
tail -5 /home/book/public_html/js/api-handler.js
sed -n '405,415p' /home/book/public_html/js/api-handler.js
grep -n "AladinAPIInstance" /home/book/public_html/js/api-handler.js
grep -n "const.*AladinAPI\|window.AladinAPI" /home/book/public_html/js/api-handler.js
sed -i '393d' /home/book/public_html/js/api-handler.js
grep -n "AladinAPIInstance" /home/book/public_html/js/api-handler.js
tail -5 /home/book/public_html/js/api-handler.js
cat >> /tmp/api_fix.txt << 'EOF'
// 전역으로 내보내기
const AladinAPIInstance = new AladinAPI();
window.AladinAPI = AladinAPI;        // 클래스 자체 (정적 메서드용)
window.aladinAPI = AladinAPIInstance; // 인스턴스 (인스턴스 메서드용)
EOF

sed -i '$d' /home/book/public_html/js/api-handler.js
cat /tmp/api_fix.txt >> /home/book/public_html/js/api-handler.js
tail -5 /home/book/public_html/js/api-handler.js
grep -n -A 20 "class AladinAPI" /home/book/public_html/js/api-handler.js
grep -n -A 5 -B 5 "getBestSellers" /home/book/public_html/js/api-handler.js
grep -n -A 5 -B 5 "checkApiStatus" /home/book/public_html/js/api-handler.js
sed -i 's/AladinAPI.checkApiStatus()/window.AladinAPI.checkApiStatus()/g' /home/book/public_html/js/api-handler.js
grep -n -A 2 -B 2 "checkApiStatus()" /home/book/public_html/js/api-handler.js
grep -n "AladinAPI\." /home/book/public_html/js/main.js
sed -i 's/AladinAPI\.getBestSellers/window.AladinAPI.getBestSellers/g' /home/book/public_html/js/main.js
sed -i 's/AladinAPI\./window.AladinAPI./g' /home/book/public_html/js/main.js
grep -n "window.AladinAPI" /home/book/public_html/js/main.js
sed -i 's/window\.window\.AladinAPI/window.AladinAPI/g' /home/book/public_html/js/main.js
grep -n "window.*AladinAPI" /home/book/public_html/js/main.js
tail -10 /home/book/public_html/js/api-handler.js
grep -n "window.AladinAPI.*AladinAPI[^I]" /home/book/public_html/js/api-handler.js
sed -i 's/window.AladinAPI = AladinAPI;/window.AladinAPI = AladinAPIInstance;/' /home/book/public_html/js/api-handler.js
tail -5 /home/book/public_html/js/api-handler.js
grep -n -A 20 "async getBestSellers" /home/book/public_html/js/api-handler.js
grep -n -A 15 -B 5 "fetchBooksFromAPI.*category" /home/book/public_html/js/main.js
grep -n -A 10 -B 5 "bestseller\|special\|new\|editor" /home/book/public_html/js/main.js
tail -10 /home/book/public_html/js/main.js
sed -i 's/bookApp = new BookRequestApp();/bookApp = new BookRequestApp();\n    window.bookApp = bookApp;/' /home/book/public_html/js/main.js
tail -8 /home/book/public_html/js/main.js
sed -i 's/http:\/\/www\.aladin\.co\.kr/https:\/\/www.aladin.co.kr/g' /home/book/public_html/js/api-handler.js
grep -n "aladin.co.kr" /home/book/public_html/js/api-handler.js
grep -n -i "aladin\|baseurl\|http" /home/book/public_html/js/api-handler.js
grep -n -A 10 -B 5 "aladin-proxy\|ItemList" /home/book/backend/*.js
# 백엔드 디렉토리 구조 확인
ls -la /home/book/backend/
ls -la /home/book/backend/routes/
# 모든 js 파일에서 aladin 관련 코드 검색
find /home/book/backend -name "*.js" -exec grep -l "aladin\|proxy" {} \;
# 더 넓은 범위로 검색
grep -r -n "aladin\|proxy" /home/book/backend/ 2>/dev/null
# 서버 메인 파일 확인
cat /home/book/backend/server.js | grep -A 10 -B 5 "aladin\|proxy\|books"
ls -la /home/book/backend/
ls -la /home/book/backend/routes/
grep -n -A 10 -B 5 "aladin\|proxy" /home/book/backend/routes/books.js
tail -f /home/book/.pm2/logs/book-system-out.log | grep "알라딘 API 호출"
grep -n -A 10 -B 5 "Year\|Month\|Week" /home/book/public_html/js/api-handler.js
sed -i '59,61d' /home/book/public_html/js/api-handler.js
grep -n -A 10 -B 5 "Year\|Month\|Week" /home/book/public_html/js/api-handler.js
36-    async getBestSellers(start = 1, maxResults = 50) {
37-        await this.enforceDelay();
38-        
39-        // 현재 날짜 기준으로 주간 계산
40-        const now = new Date();
41:        const currentYear = now.getFullYear();
42:        const currentMonth = now.getMonth() + 1;
43:        const currentWeek = Math.ceil((now.getDate() + (new Date(now.getFullYear(), now.getMonth(), 1).getDay())) / 7);
44-        
45-        // 이전 주간 계산
46:        const prevWeek = Math.max(1, currentWeek - 1);
47:        const prevMonth = currentWeek === 1 ? Math.max(1, currentMonth - 1) : currentMonth;
48:        const prevYear = currentWeek === 1 && currentMonth === 1 ? currentYear - 1 : currentYear;
49-        
50-        // 현재 주간 데이터 조회
51-        const currentParams = {
52-            ttbkey: this.apiKey,
53-            QueryType: 'Bestseller',
54-            MaxResults: Math.min(maxResults, this.maxResults),
55-            start: start,
56-            SearchTarget: 'Book',
57-            output: this.output,
58-            Version: this.version,
59-        };
60-        
61:        console.log(`📊 현재 주간 베스트셀러 API 요청: start=${start}, maxResults=${maxResults}, Year=${currentYear}, Month=${currentMonth}, Week=${currentWeek}`);
62-        
63-        const currentResult = await this.makeRequest('ItemList.aspx', currentParams);
64-        
65-        // 현재 주간 데이터가 100권 미만이면 이전 주간 데이터도 조회
66-        if (currentResult.meta.totalCount < 100 && start > 100) {
67:            console.log(`📊 이전 주간 베스트셀러 조회: Year=${prevYear}, Month=${prevMonth}, Week=${prevWeek}`);
68-            
69-            const prevParams = {
70-                ...currentParams,
71:                Year: prevYear,
72:                Month: prevMonth,
73:                Week: prevWeek,
74-                start: start - 100 // 이전 주간에서의 시작 위치 조정
75-            };
76-            
77-            const prevResult = await this.makeRequest('ItemList.aspx', prevParams);
78-            
79-            // 이전 주간 데이터 반환
80-            return {
81-                books: prevResult.books,
82-                meta: {
83-                    totalCount: prevResult.meta.totalCount + 100, // 현재 주간 100권 + 이전 주간 데이터
book@vultr:~$ 
cat > /tmp/simple_bestsellers.txt << 'EOF'
    async getBestSellers(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'Bestseller',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`📊 베스트셀러 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('ItemList.aspx', params);
    }
EOF

cp /home/book/public_html/js/api-handler.js /home/book/public_html/js/api-handler.js.backup
tail -f /home/book/.pm2/logs/book-system-out.log | grep "알라딘 API 호출"
sed -n '59,61p' /home/book/public_html/js/api-handler.js
sed -n '36,100p' /home/book/public_html/js/api-handler.js | grep -n -A 5 -B 5 "이전\|prev\|Week\|조회"
cp /home/book/public_html/js/api-handler.js /home/book/public_html/js/api-handler.js.complex
cat > /tmp/simple_bestsellers.js << 'EOF'
    async getBestSellers(start = 1, maxResults = 50) {
        await this.enforceDelay();
        
        const params = {
            ttbkey: this.apiKey,
            QueryType: 'Bestseller',
            MaxResults: Math.min(maxResults, this.maxResults),
            start: start,
            SearchTarget: 'Book',
            output: this.output,
            Version: this.version
        };
        
        console.log(`📊 베스트셀러 API 요청: start=${start}, maxResults=${maxResults}`);
        
        return await this.makeRequest('ItemList.aspx', params);
    }
EOF

sed -i '36,95c\    async getBestSellers(start = 1, maxResults = 50) {\
        await this.enforceDelay();\
        \
        const params = {\
            ttbkey: this.apiKey,\
            QueryType: '\''Bestseller'\'',\
            MaxResults: Math.min(maxResults, this.maxResults),\
            start: start,\
            SearchTarget: '\''Book'\'',\
            output: this.output,\
            Version: this.version\
        };\
        \
        console.log(`📊 베스트셀러 API 요청: start=${start}, maxResults=${maxResults}`);\
        \
        return await this.makeRequest('\''ItemList.aspx'\'', params);\
    }' /home/book/public_html/js/api-handler.js
sed -n '36,52p' /home/book/public_html/js/api-handler.js
sed -n '50,55p' /home/book/public_html/js/api-handler.js
sed -i '53,55d' /home/book/public_html/js/api-handler.js
sed -n '50,60p' /home/book/public_html/js/api-handler.js
sed -i '54d' /home/book/public_html/js/api-handler.js
sed -n '50,60p' /home/book/public_html/js/api-handler.js
sed -i '54d' /home/book/public_html/js/api-handler.js
sed -n '50,60p' /home/book/public_html/js/api-handler.js
sed -i '54d' /home/book/public_html/js/api-handler.js
sed -i '54s/\* /\/\*\* /' /home/book/public_html/js/api-handler.js
sed -n '50,60p' /home/book/public_html/js/api-handler.js
cp /home/book/public_html/js/api-handler.js.complex /home/book/public_html/js/api-handler.js
sed -i '66,83s/^/\/\/ /' /home/book/public_html/js/api-handler.js
sed -n '64,70p' /home/book/public_html/js/api-handler.js
sed -i '/Year:/d; /Month:/d; /Week:/d' /home/book/public_html/js/api-handler.js
sed -n '55,65p' /home/book/public_html/js/api-handler.js
sed -n '80,85p' /home/book/public_html/js/api-handler.js
cp /home/book/public_html/js/api-handler.js.complex /home/book/public_html/js/api-handler.js
sed -i 's/start > 100/start > 999/' /home/book/public_html/js/api-handler.js
sed -i '/Year: currentYear,/d' /home/book/public_html/js/api-handler.js
sed -i '/Month: currentMonth,/d' /home/book/public_html/js/api-handler.js  
sed -i '/Week: currentWeek/d' /home/book/public_html/js/api-handler.js
grep -n "start > 999" /home/book/public_html/js/api-handler.js
sed -n '59,65p' /home/book/public_html/js/api-handler.js
pwd
ls -la
cd public_html/
ls -la
book@vultr:~/public_html$ ls -la
합계 4380
drwxr-xr-x  8 book www-data    4096  5월 26일  23:43 .
drwxr-xr-x 18 book book        4096  6월  8일  20:33 ..
-rw-r--r--  1 book book        8196  6월  4일  20:41 .DS_Store
drwxr-xr-x  2 book www-data    4096  5월 22일  17:48 .vscode
-rw-r--r--  1 book book        6106  5월 26일  18:07 README.md
drwxr-xr-x  2 book book        4096  5월 27일  21:56 admin
-rw-r--r--  1 book book       18620  6월 14일  12:20 admin.html
-rw-r--r--  1 book book     1883094  5월 26일  23:43 aladin_Category_CID_20210927.csv
-rw-r--r--  1 book book     2438656  5월 26일  23:37 aladin_Category_CID_20210927.xls
-rw-r--r--  1 book book       40717  6월 14일  20:27 applications.html
drwxr-xr-x  2 book book        4096  5월 26일  21:19 css
drwxr-xr-x  2 book book        4096  5월 27일  19:19 data
-rw-r--r--  1 book book       43759  6월 18일  18:51 index.html
drwxr-xr-x  2 book book        4096  6월 18일  18:08 js
drwxr-xr-x  2 book book        4096  5월 22일  22:07 pages
book@vultr:~/public_html$ 
cd ..
pwd
ls -la public_html/js/
ls -la js/
grep -n "setupCategoryEvents" public_html/js/main.js
grep -n "category\|Category" public_html/js/main.js
grep -n "addEventListener\|click\|categoryList" public_html/js/main.js
sed -n '60,70p' public_html/js/main.js
sed -n '58,95p' public_html/js/main.js
grep -n -A5 -B5 "categoryButtons" public_html/js/main.js
sed -n '105,115p' public_html/js/main.js
sed -n '100,120p' public_html/js/main.js
sed -n '90,130p' public_html/js/main.js
grep -n -A20 "setupEventListeners()" public_html/js/main.js
wc -l public_html/js/main.js
sed -n '106,140p' public_html/js/main.js
grep -n "^class\|^}\|^function" public_html/js/main.js
tail -20 public_html/js/main.js
sed -n '125,135p' public_html/js/main.js
cp public_html/js/main.js public_html/js/main.js.backup
sed -i '107,129d' public_html/js/main.js
sed -n '105,115p' public_html/js/main.js
sed -n '535,545p' public_html/js/main.js
sed -n '530,550p' public_html/js/main.js
grep -n "^}\|class\|function.*{" public_html/js/main.js | tail -10
grep -n -B5 -A5 "^}" public_html/js/main.js | head -20
sed -n '520,530p' public_html/js/main.js
sed -i 's/this\.loadCategoryBooks/window.bookApp.loadCategoryBooks/g' public_html/js/main.js
sed -i 's/this\.handleCategoryClick/window.bookApp.handleCategoryClick/g' public_html/js/main.js
grep -n "this\." public_html/js/main.js | tail -10
sed -n '555,580p' public_html/js/main.js | grep -n "this"
sed -n '536,542p' public_html/js/main.js
sed -i 's/^handleCategoryClick(/function handleCategoryClick(/' public_html/js/main.js
sed -i 's/^handleCategoryToggle(/function handleCategoryToggle(/' public_html/js/main.js
grep -n "^function handle" public_html/js/main.js
sed -n '110,115p' public_html/js/main.js
grep -n -A5 "loadInitialBooks" public_html/js/main.js
sed -i 's/await window.bookApp.loadCategoryBooks/await this.loadCategoryBooks/' public_html/js/main.js
sed -n '110,115p' public_html/js/main.js
sed -n '68,75p' public_html/js/main.js
sed -i 's/this\.handleCategoryToggle/handleCategoryToggle/g' public_html/js/main.js
sed -i 's/this\.handleCategoryClick/handleCategoryClick/g' public_html/js/main.js
sed -n '68,80p' public_html/js/main.js
sed -i 's/window\.bookApp\.handleCategoryClick/handleCategoryClick/g' public_html/js/main.js
sed -n '75,80p' public_html/js/main.js
pwd
ls -la
grep -r "start.*50" .
find . -name "*.js" -exec grep -l "start.*[0-9]" {} \;
grep -rn "loadMore\|nextPage\|currentPage" . --include="*.js"
grep -rn "MaxResults" . --include="*.js"
pwd
cd public_html/
ls
find ./public_html -name "*.js" -exec grep -Hn "start" {} \;
cd ..
find ./public_html -name "*.js" -exec grep -Hn "start" {} \;
grep -rn "51" . --include="*.js" | grep -v node_modules
pwd
echo "=== start 파라미터 계산 패턴 검색 ==="
grep -rn "start.*\*\|start.*+\|start.*-" . --include="*.js"
echo "=== 페이지 계산 패턴 검색 ==="  
grep -rn "page.*\*.*50\|page.*\*.*MaxResults" . --include="*.js"
echo "=== 더보기 관련 함수 검색 ==="
grep -rn "loadMore\|더.*보기" . --include="*.js"
# 프로젝트 디렉토리에서 실행
grep -r "51" . --include="*.js" | grep -v node_modules
