const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 쿠키에서 토큰 추출
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        message: '로그인이 필요합니다.',
        error: 'TOKEN_MISSING'
      });
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: '유효하지 않은 사용자입니다.',
        error: 'USER_NOT_FOUND'
      });
    }

    // req 객체에 사용자 정보 추가
    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      googleId: user.googleId
    };

    next();
  } catch (error) {
    console.error('🔐 인증 미들웨어 오류:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: '유효하지 않은 토큰입니다.',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({ 
      message: '인증 처리 중 오류가 발생했습니다.',
      error: 'AUTH_ERROR'
    });
  }
};

module.exports = auth;

