const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.googleAuth = (req, res) => {
  try {
    // 환경 변수 확인 및 기본값 설정
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
    
    if (!clientId) {
      console.error('❌ GOOGLE_CLIENT_ID 환경 변수가 설정되지 않음');
      return res.status(500).json({ 
        error: 'Google OAuth 설정이 완료되지 않았습니다.',
        message: '서버 관리자에게 문의하세요.'
      });
    }
    
    console.log('🔐 Google OAuth 로그인 요청');
    console.log('Client ID:', clientId ? '설정됨' : '설정되지 않음');
    console.log('Redirect URI:', redirectUri);
    
    const scope = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");
    
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;
    
    console.log('✅ Google OAuth URL 생성 완료');
    res.json({ url: authUrl });
    
  } catch (error) {
    console.error('❌ Google OAuth URL 생성 실패:', error);
    res.status(500).json({ 
      error: 'Google OAuth 설정 오류',
      message: error.message 
    });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    console.log('🔄 Google OAuth 콜백 처리 시작');
    console.log('Authorization Code:', code ? '수신됨' : '수신되지 않음');
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code가 없습니다.' });
    }
    
    // 환경 변수 확인
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    
    if (!clientId || !clientSecret) {
      console.error('❌ Google OAuth 환경 변수 누락');
      return res.status(500).json({ 
        error: 'Google OAuth 설정이 완료되지 않았습니다.' 
      });
    }
    
    console.log('🔑 Access Token 교환 중...');
    
    // 토큰 교환
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      params,
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000 // 10초 타임아웃
      }
    );
    
    const { access_token } = tokenRes.data;
    console.log('✅ Access Token 획득 성공');
    
    // 사용자 정보 요청
    console.log('👤 사용자 정보 요청 중...');
    const userRes = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      { 
        headers: { Authorization: `Bearer ${access_token}` },
        timeout: 10000
      }
    );
    
    const profile = userRes.data;
    console.log('✅ 사용자 정보 획득:', profile.email);
    
    // 사용자 DB에 등록/조회
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      console.log('🆕 새 사용자 생성:', profile.email);
      user = await User.create({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        profilePicture: profile.picture || null,
        lastLoginAt: new Date()
      });
    } else {
      console.log('👤 기존 사용자 로그인:', profile.email);
      // 마지막 로그인 시간 업데이트
      user.lastLoginAt = new Date();
      await user.save();
    }
    
    // JWT 발급
    const token = jwt.sign({
      userId: user._id,
      email: user.email,
      googleId: user.googleId,
      name: user.name,
    }, jwtSecret, { expiresIn: "2h" });
    
    console.log('🎫 JWT 토큰 발급 완료');
    
    // 세션에 사용자 정보 저장
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    
    // 쿠키 설정 및 리다이렉트
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2시간
    }).redirect("http://localhost:5173/vote");
    
    console.log('✅ Google 로그인 완료, 투표 페이지로 리다이렉트');
    
  } catch (err) {
    console.error("❌ Google 로그인 에러:");
    console.error("에러 타입:", err.name);
    console.error("에러 메시지:", err.message);
    
    if (err.response) {
      console.error("응답 상태:", err.response.status);
      console.error("응답 데이터:", err.response.data);
    }
    
    // 사용자 친화적인 에러 메시지
    let errorMessage = "Google 로그인 중 오류가 발생했습니다.";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "Google 서버 연결 시간이 초과되었습니다. 다시 시도해주세요.";
    } else if (err.response?.status === 400) {
      errorMessage = "잘못된 요청입니다. 다시 로그인해주세요.";
    } else if (err.response?.status === 401) {
      errorMessage = "Google 인증에 실패했습니다. 다시 시도해주세요.";
    }
    
    res.status(500).json({ 
      error: 'Google login error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 관리자 로그인
exports.adminLogin = async (req, res) => {
  try {
    console.log('🔐 관리자 로그인 요청');
    
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        message: "비밀번호를 입력해주세요." 
      });
    }
    
    // 환경변수에서 관리자 비밀번호 가져오기
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (password === adminPassword) {
      // 세션에 관리자 로그인 상태 저장
      req.session.isAdmin = true;
      req.session.adminLoginTime = new Date();
      
      console.log('✅ 관리자 로그인 성공');
      
      res.json({ 
        message: "관리자 로그인 성공",
        isAdmin: true
      });
    } else {
      console.log('❌ 관리자 로그인 실패: 잘못된 비밀번호');
      res.status(401).json({ 
        message: "잘못된 비밀번호입니다." 
      });
    }
    
  } catch (err) {
    console.error('❌ 관리자 로그인 중 오류:', err);
    res.status(500).json({ 
      message: '로그인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 관리자 로그아웃
exports.adminLogout = async (req, res) => {
  try {
    console.log('🔓 관리자 로그아웃 요청');
    
    // 세션에서 관리자 정보 제거
    req.session.isAdmin = false;
    delete req.session.adminLoginTime;
    
    console.log('✅ 관리자 로그아웃 성공');
    
    res.json({ 
      message: "로그아웃 성공",
      isAdmin: false
    });
    
  } catch (err) {
    console.error('❌ 관리자 로그아웃 중 오류:', err);
    res.status(500).json({ 
      message: '로그아웃 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 관리자 인증 상태 확인
exports.checkAdminAuth = async (req, res) => {
  try {
    const isAdmin = req.session.isAdmin === true;
    
    res.json({ 
      isAdmin: isAdmin,
      loginTime: req.session.adminLoginTime
    });
    
  } catch (err) {
    console.error('❌ 관리자 인증 상태 확인 중 오류:', err);
    res.status(500).json({ 
      message: '인증 상태 확인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 사용자 로그아웃
exports.logout = async (req, res) => {
  try {
    console.log('🔓 사용자 로그아웃 요청');
    
    // 세션에서 사용자 정보 제거
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('❌ 세션 삭제 오류:', err);
          return res.status(500).json({ 
            message: '로그아웃 중 오류가 발생했습니다.' 
          });
        }
        
        console.log('✅ 사용자 로그아웃 성공');
        res.json({ 
          message: "로그아웃 성공" 
        });
      });
    } else {
      res.json({ 
        message: "이미 로그아웃된 상태입니다." 
      });
    }
    
  } catch (err) {
    console.error('❌ 로그아웃 중 오류:', err);
    res.status(500).json({ 
      message: '로그아웃 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 사용자 인증 상태 확인
exports.checkAuth = async (req, res) => {
  try {
    const isAuthenticated = req.session && req.session.userId;
    
    if (isAuthenticated) {
      // 사용자 정보 조회
      const user = await User.findById(req.session.userId).select('-__v');
      
      if (user) {
        res.json({ 
          isAuthenticated: true,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            picture: user.profilePicture
          }
        });
      } else {
        // 사용자가 존재하지 않는 경우 세션 정리
        req.session.destroy();
        res.json({ 
          isAuthenticated: false,
          message: "사용자 정보를 찾을 수 없습니다." 
        });
      }
    } else {
      res.json({ 
        isAuthenticated: false 
      });
    }
    
  } catch (err) {
    console.error('❌ 인증 상태 확인 중 오류:', err);
    res.status(500).json({ 
      message: '인증 상태 확인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};
