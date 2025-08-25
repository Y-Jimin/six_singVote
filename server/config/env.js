// 환경 변수 설정 파일
// 실제 운영 환경에서는 .env 파일을 사용하세요

console.log('🔧 환경 변수 설정 시작...');

// Google OAuth 설정
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id-here';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret-here';
process.env.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

// JWT 설정
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

// 서버 설정
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || 5000;

// MongoDB 설정
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/singVote';

console.log('🔧 환경 변수 설정 완료');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MongoDB:', process.env.MONGO_URI ? '설정됨' : '기본값 사용');

// Google OAuth 설정 상태 상세 확인
console.log('🔐 Google OAuth 설정 상태:');
console.log('  - CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : '설정되지 않음');
console.log('  - CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  `${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : '설정되지 않음');
console.log('  - REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

console.log('🔑 JWT Secret:', process.env.JWT_SECRET !== 'your-super-secret-jwt-key-here' ? 
  `${process.env.JWT_SECRET.substring(0, 10)}...` : '기본값 사용');

// 환경 변수 유효성 검사
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => 
  !process.env[varName] || process.env[varName].includes('your-')
);

if (missingVars.length > 0) {
  console.error('❌ 필수 환경 변수가 설정되지 않음:', missingVars);
  console.error('💡 .env 파일을 확인하고 올바른 값을 설정하세요');
} else {
  console.log('✅ 모든 필수 환경 변수가 설정됨');
}

module.exports = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  },
  jwt: {
    secret: process.env.JWT_SECRET
  },
  server: {
    port: process.env.PORT,
    env: process.env.NODE_ENV
  },
  database: {
    uri: process.env.MONGO_URI
  }
};
