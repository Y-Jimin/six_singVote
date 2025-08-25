// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import "./LoginPage.css";

function LoginPage() {
  const [loginUrl, setLoginUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 서버에서 로그인 URL 가져오기
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/google", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setLoginUrl(data.url);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <img src="/src/assets/SIX로고.jpg" alt="SIX 로고" className="logo" />
            </div>
            <h1 className="main-title">🎵 가요제 투표 프로그램</h1>
            <p className="subtitle">당신의 소중한 한 표를 행사하세요</p>
          </div>
          
          <div className="login-body">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>로그인 준비 중...</p>
              </div>
            ) : loginUrl ? (
              <div className="google-login-section">
                <div className="login-description">
                  <p>구글 계정으로 간편하게 로그인하여</p>
                  <p>투표에 참여하실 수 있습니다</p>
                </div>
                <a href={loginUrl} className="google-login-btn">
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>구글 계정으로 로그인</span>
                </a>
                <div className="login-footer">
                  <p>🔒 안전한 투표 시스템</p>
                  <p>📱 모바일에서도 편리하게</p>
                </div>
              </div>
            ) : (
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <p>로그인 서비스를 준비할 수 없습니다.</p>
                <p>잠시 후 다시 시도해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
