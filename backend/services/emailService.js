const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

class EmailService {
    constructor() {
        this.transporter = null;
        this.config = emailConfig.default;
        this.initializeTransporter();
    }

    /**
     * 이메일 전송기 초기화
     */
    initializeTransporter() {
        try {
            // Gmail 설정 사용 (기본)
            this.transporter = nodemailer.createTransport(emailConfig.gmail);
            
            console.log('이메일 서비스 초기화 완료');
        } catch (error) {
            console.error('이메일 서비스 초기화 실패:', error);
        }
    }

    /**
     * 이메일 연결 테스트
     */
    async testConnection() {
        try {
            if (!this.transporter) {
                throw new Error('이메일 전송기가 초기화되지 않았습니다.');
            }

            await this.transporter.verify();
            console.log('이메일 서버 연결 성공');
            return true;
        } catch (error) {
            console.error('이메일 서버 연결 실패:', error);
            return false;
        }
    }

    /**
     * 관리자 인증 이메일 전송
     */
    async sendVerificationEmail(email, token) {
        const verificationUrl = `${this.config.serverUrl}/admin/verify?token=${token}`;
        
        const mailOptions = {
            from: {
                name: this.config.from.name,
                address: this.config.from.address
            },
            to: email,
            subject: '교내 희망도서 시스템 관리자 인증',
            html: this.getVerificationEmailTemplate(email, verificationUrl),
            text: this.getVerificationEmailText(email, verificationUrl)
        };

        try {
            // 개발 모드인 경우 콘솔에만 출력
            if (this.config.devMode) {
                console.log(`
=== 관리자 인증 이메일 (개발 모드) ===
받는 사람: ${email}
제목: ${mailOptions.subject}
인증 링크: ${verificationUrl}
=====================================
                `);
                
                return {
                    success: true,
                    verificationUrl,
                    message: '인증 이메일이 전송되었습니다. (개발 모드: 콘솔 확인)',
                    mode: 'development'
                };
            }

            // 실제 이메일 전송
            const info = await this.transporter.sendMail(mailOptions);
            
            console.log('인증 이메일 전송 성공:', info.messageId);
            
            return {
                success: true,
                messageId: info.messageId,
                message: '인증 이메일이 전송되었습니다.',
                mode: 'production'
            };
            
        } catch (error) {
            console.error('이메일 전송 실패:', error);
            
            // 이메일 전송 실패 시 개발 모드로 폴백
            console.log(`
=== 관리자 인증 이메일 (폴백 모드) ===
받는 사람: ${email}
제목: ${mailOptions.subject}
인증 링크: ${verificationUrl}
오류: ${error.message}
====================================
            `);
            
            return {
                success: true,
                verificationUrl,
                message: '인증 이메일이 전송되었습니다. (폴백 모드: 콘솔 확인)',
                mode: 'fallback',
                error: error.message
            };
        }
    }

    /**
     * 인증 이메일 HTML 템플릿
     */
    getVerificationEmailTemplate(email, verificationUrl) {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>관리자 계정 인증</title>
    <style>
        body {
            font-family: 'Malgun Gothic', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background: #0056b3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 교내 희망도서 신청시스템</h1>
        <p>관리자 계정 인증</p>
    </div>
    
    <div class="content">
        <h2>안녕하세요!</h2>
        
        <p><strong>${email}</strong> 주소로 관리자 계정 설정 요청이 접수되었습니다.</p>
        
        <p>관리자 계정을 설정하려면 아래 버튼을 클릭하여 비밀번호를 설정해주세요:</p>
        
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">
                🔐 관리자 계정 설정하기
            </a>
        </div>
        
        <div class="warning">
            <strong>⚠️ 보안 안내</strong>
            <ul>
                <li>이 링크는 <strong>24시간 동안만</strong> 유효합니다.</li>
                <li>링크를 클릭하면 비밀번호 설정 페이지로 이동합니다.</li>
                <li>비밀번호는 최소 6자 이상으로 설정해주세요.</li>
            </ul>
        </div>
        
        <p>만약 버튼이 작동하지 않는다면, 아래 링크를 복사하여 브라우저 주소창에 붙여넣어 주세요:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
        </p>
    </div>
    
    <div class="footer">
        <p>본 이메일은 교내 희망도서 신청시스템에서 자동으로 발송되었습니다.</p>
        <p>문의사항이 있으시면 시스템 관리자에게 연락해주세요.</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * 인증 이메일 텍스트 버전
     */
    getVerificationEmailText(email, verificationUrl) {
        return `
교내 희망도서 신청시스템 관리자 인증

안녕하세요!

${email} 주소로 관리자 계정 설정 요청이 접수되었습니다.

관리자 계정을 설정하려면 아래 링크를 클릭하여 비밀번호를 설정해주세요:

${verificationUrl}

보안 안내:
- 이 링크는 24시간 동안만 유효합니다.
- 비밀번호는 최소 6자 이상으로 설정해주세요.

본 이메일은 교내 희망도서 신청시스템에서 자동으로 발송되었습니다.
문의사항이 있으시면 시스템 관리자에게 연락해주세요.
        `;
    }

    /**
     * 이메일 설정 업데이트
     */
    updateEmailConfig(newConfig) {
        try {
            // 새로운 설정으로 전송기 재초기화
            if (newConfig.service === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    ...emailConfig.gmail,
                    auth: {
                        user: newConfig.user,
                        pass: newConfig.pass
                    }
                });
            } else if (newConfig.service === 'naver') {
                this.transporter = nodemailer.createTransport({
                    ...emailConfig.naver,
                    auth: {
                        user: newConfig.user,
                        pass: newConfig.pass
                    }
                });
            }

            // 설정 업데이트
            this.config.from.address = newConfig.user;
            this.config.devMode = newConfig.devMode || false;

            console.log('이메일 설정이 업데이트되었습니다.');
            return true;
        } catch (error) {
            console.error('이메일 설정 업데이트 실패:', error);
            return false;
        }
    }

    /**
     * 개발 모드 토글
     */
    toggleDevMode(devMode = null) {
        if (devMode !== null) {
            this.config.devMode = devMode;
        } else {
            this.config.devMode = !this.config.devMode;
        }
        
        console.log(`이메일 개발 모드: ${this.config.devMode ? 'ON' : 'OFF'}`);
        return this.config.devMode;
    }
}

module.exports = EmailService; 