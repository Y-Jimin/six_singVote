require('dotenv').config();
require('./config/env'); // 환경 변수 설정 파일 로드
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./config/db');
const apiRoutes = require('./routes'); // routes/index.js

const app = express();
connectDB();

// CORS 설정 (Vercel 배포 시)
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app', 'https://your-domain.vercel.app'] 
    : "http://localhost:5173", 
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

// 세션 미들웨어 설정 (Vercel 환경 고려)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  // Vercel 환경에서는 메모리 세션 사용 (프로덕션에서는 Redis 권장)
  store: process.env.NODE_ENV === 'production' ? null : undefined
}));

app.use('/api', apiRoutes); // 모든 라우터 통합

// Vercel 배포를 위한 포트 설정
const PORT = process.env.PORT || 5000;

// Vercel 환경에서는 app.listen을 호출하지 않음
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`🌐 클라이언트: http://localhost:5173`);
    console.log(`🔧 API 서버: http://localhost:${PORT}/api`);
  });
}

// Vercel 배포를 위해 export
module.exports = app;
