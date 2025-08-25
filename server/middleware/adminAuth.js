// 관리자 인증 미들웨어
const adminAuth = (req, res, next) => {
  try {
    // 세션에서 관리자 로그인 상태 확인
    if (req.session && req.session.isAdmin === true) {
      next(); // 인증 성공, 다음 단계로 진행
    } else {
      console.log('❌ 관리자 인증 실패: 로그인되지 않음');
      return res.status(401).json({ 
        message: "관리자 권한이 필요합니다. 로그인해주세요." 
      });
    }
  } catch (err) {
    console.error('❌ 관리자 인증 미들웨어 오류:', err);
    return res.status(500).json({ 
      message: "인증 확인 중 오류가 발생했습니다." 
    });
  }
};

module.exports = adminAuth;
