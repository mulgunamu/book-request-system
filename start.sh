#!/bin/bash

echo "🚀 교내 희망도서 신청시스템 시작 중..."

# Node.js 설치 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    echo "Node.js를 설치한 후 다시 실행해주세요."
    exit 1
fi

# npm 의존성 설치
echo "📦 의존성 설치 중..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 의존성 설치에 실패했습니다."
    exit 1
fi

# 서버 시작
echo "🌐 서버 시작 중..."
echo "웹사이트: http://localhost:3000"
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

npm start 