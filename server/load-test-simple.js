const axios = require('axios');

// 테스트 설정
const CONFIG = {
  baseURL: 'http://localhost:5000',
  totalUsers: 50,
  concurrentUsers: 10,
  testDuration: 60000, // 1분
  delayBetweenRequests: 100 // 100ms
};

// 테스트 통계
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: []
};

// 랜덤 위치 생성 (서울 지역)
function generateRandomLocation() {
  return {
    lat: 37.5 + Math.random() * 0.1, // 37.5 ~ 37.6
    lng: 126.9 + Math.random() * 0.1  // 126.9 ~ 127.0
  };
}

// 단일 사용자 시뮬레이션
async function simulateUser(userId) {
  const location = generateRandomLocation();
  
  try {
    // 1. 투표 세션 조회
    const startTime = Date.now();
    const sessionRes = await axios.get(`${CONFIG.baseURL}/api/vote/session/active`);
    const responseTime = Date.now() - startTime;
    
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.responseTimes.push(responseTime);
    
    console.log(`👤 사용자 ${userId}: 세션 조회 성공 (${responseTime}ms)`);
    
    // 2. 투표 제출 (실제 투표 세션이 있을 때만)
    if (sessionRes.data && sessionRes.data._id) {
      try {
        const voteStartTime = Date.now();
        const voteRes = await axios.post(`${CONFIG.baseURL}/api/vote/submit`, {
          voteId: sessionRes.data._id,
          choice: Math.floor(Math.random() * 3) + 1,
          userLat: location.lat,
          userLng: location.lng
        });
        
        const voteResponseTime = Date.now() - voteStartTime;
        stats.totalRequests++;
        stats.successfulRequests++;
        stats.responseTimes.push(voteResponseTime);
        
        console.log(`🗳️ 사용자 ${userId}: 투표 제출 성공 (${voteResponseTime}ms)`);
      } catch (voteError) {
        stats.totalRequests++;
        stats.failedRequests++;
        stats.errors.push({
          userId,
          type: 'vote_submit',
          error: voteError.message
        });
        
        console.log(`❌ 사용자 ${userId}: 투표 제출 실패 - ${voteError.message}`);
      }
    }
    
  } catch (error) {
    stats.totalRequests++;
    stats.failedRequests++;
    stats.errors.push({
      userId,
      type: 'session_fetch',
      error: error.message
    });
    
    console.log(`❌ 사용자 ${userId}: 세션 조회 실패 - ${error.message}`);
  }
}

// 동시 사용자 처리
async function processConcurrentUsers(userIds) {
  const promises = userIds.map(userId => simulateUser(userId));
  await Promise.all(promises);
}

// 메인 테스트 실행
async function runLoadTest() {
  console.log('🚀 부하 테스트 시작...');
  console.log(`📊 총 사용자: ${CONFIG.totalUsers}명`);
  console.log(`⚡ 동시 처리: ${CONFIG.concurrentUsers}명`);
  console.log(`⏱️ 테스트 시간: ${CONFIG.testDuration / 1000}초`);
  console.log('=' * 50);
  
  const startTime = Date.now();
  
  // 사용자들을 그룹으로 나누어 순차 처리
  for (let i = 0; i < CONFIG.totalUsers; i += CONFIG.concurrentUsers) {
    const userGroup = [];
    for (let j = 0; j < CONFIG.concurrentUsers && i + j < CONFIG.totalUsers; j++) {
      userGroup.push(i + j + 1);
    }
    
    console.log(`\n🔄 사용자 그룹 ${Math.floor(i / CONFIG.concurrentUsers) + 1} 처리 중...`);
    await processConcurrentUsers(userGroup);
    
    // 다음 그룹 전 대기
    if (i + CONFIG.concurrentUsers < CONFIG.totalUsers) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // 결과 출력
  console.log('\n' + '=' * 50);
  console.log('📈 부하 테스트 결과');
  console.log('=' * 50);
  console.log(`⏱️ 총 소요 시간: ${totalTime}ms`);
  console.log(`📊 총 요청 수: ${stats.totalRequests}`);
  console.log(`✅ 성공한 요청: ${stats.successfulRequests}`);
  console.log(`❌ 실패한 요청: ${stats.failedRequests}`);
  console.log(`📊 성공률: ${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%`);
  
  if (stats.responseTimes.length > 0) {
    const avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
    const maxResponseTime = Math.max(...stats.responseTimes);
    const minResponseTime = Math.min(...stats.responseTimes);
    
    console.log(`⚡ 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🚀 최소 응답 시간: ${minResponseTime}ms`);
    console.log(`🐌 최대 응답 시간: ${maxResponseTime}ms`);
  }
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ 주요 오류들:`);
    stats.errors.slice(0, 5).forEach(error => {
      console.log(`  - 사용자 ${error.userId}: ${error.type} - ${error.error}`);
    });
  }
  
  console.log('\n🎯 권장사항:');
  if (stats.failedRequests > stats.totalRequests * 0.1) {
    console.log('  ⚠️ 오류율이 높습니다. 서버 성능 개선이 필요합니다.');
  }
  if (stats.responseTimes.some(time => time > 5000)) {
    console.log('  ⚠️ 응답 시간이 느립니다. 데이터베이스 최적화가 필요합니다.');
  }
  if (stats.successfulRequests / stats.totalRequests > 0.9) {
    console.log('  ✅ 현재 시스템이 안정적으로 작동하고 있습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, simulateUser };
