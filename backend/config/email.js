/**
 * 이메일 설정
 */

// 이메일 설정
const emailConfig = {
    // 기본 설정
    default: {
        devMode: false, // 실제 이메일 전송 모드로 변경
        serverUrl: 'http://158.247.218.210:3000',
        from: {
            name: '교내 희망도서 신청시스템',
            address: 'gujeongmo@gmail.com' // 발신자 이메일 주소
        }
    },

    // Gmail SMTP 설정
    gmail: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'gujeongmo@gmail.com', // Gmail 주소
            pass: 'dquw adhu dnve ajit'  // Gmail 앱 비밀번호
        },
        tls: {
            rejectUnauthorized: false
        }
    },

    // Naver SMTP 설정
    naver: {
        service: 'naver',
        host: 'smtp.naver.com',
        port: 587,
        secure: false,
        auth: {
            user: '', // 네이버 이메일 주소
            pass: ''  // 네이버 비밀번호
        },
        tls: {
            rejectUnauthorized: false
        }
    }
};

module.exports = emailConfig; 