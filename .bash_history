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
