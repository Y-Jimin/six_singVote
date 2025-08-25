const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 로컬 MongoDB 우선 사용 (개발 환경)
    const localURI = 'mongodb://127.0.0.1:27017/singVote';
    
    console.log('🏠 로컬 MongoDB 연결 시도...');
    console.log('연결 URI:', localURI);
    
    const options = {
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(localURI, options);
    
    console.log("✅ 로컬 MongoDB 연결 성공!");
    console.log(`데이터베이스: ${mongoose.connection.name}`);
    console.log(`호스트: ${mongoose.connection.host}`);
    console.log(`포트: ${mongoose.connection.port}`);
    
  } catch (err) {
    console.error("❌ 로컬 MongoDB 연결 실패:");
    console.error("에러 타입:", err.name);
    console.error("에러 메시지:", err.message);
    
    console.error("💡 해결 방법:");
    console.error("1. MongoDB Community Edition 설치:");
    console.error("   https://www.mongodb.com/try/download/community");
    console.error("2. MongoDB 서비스 시작:");
    console.error("   Windows: net start MongoDB");
    console.error("   또는 MongoDB Compass 실행");
    console.error("3. Docker 사용:");
    console.error("   docker run -d --name mongodb -p 27017:27017 mongo:latest");
    
    // MongoDB 설치 안내
    console.error("\n📥 MongoDB 설치 방법:");
    console.error("1. https://www.mongodb.com/try/download/community 방문");
    console.error("2. Windows x64 버전 다운로드");
    console.error("3. 설치 시 'Install MongoDB as a Service' 체크");
    console.error("4. 설치 완료 후 서비스 시작");
    
    process.exit(1);
  }
};

module.exports = connectDB;
