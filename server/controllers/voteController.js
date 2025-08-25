const VoteSession = require('../models/VoteSession');
const VoteResult = require('../models/VoteResult');
const User = require('../models/User');

exports.createSession = async (req, res) => {
  try {
    const { title, candidates } = req.body;
    if (!title || !Array.isArray(candidates) || candidates.length < 2) {
      return res.status(400).json({ message: "투표 제목과 후보 2~3명을 입력하세요." });
    }
    const session = await VoteSession.create({ title, candidates });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "투표 세션 생성 오류" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const updated = await VoteSession.findByIdAndUpdate(sessionId, {
      status: 'finished',
      finishedAt: new Date()
    }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "세션 종료 오류" });
  }
};

exports.submitVote = async (req, res) => {
  try {
    console.log('🗳️ 투표 제출 요청 받음');
    console.log('인증된 사용자:', req.user);
    
    const { voteId, choice, userLat, userLng } = req.body;
    const userId = req.user._id; // 인증 미들웨어에서 설정된 사용자 ID
    
    console.log('투표 데이터:', { voteId, userId, choice, userLat, userLng });
    
    // 유효성 검사
    if (!voteId || !choice) {
      console.log('❌ 필수값 누락:', { voteId, choice });
      return res.status(400).json({ 
        message: "투표 ID와 선택한 후보를 입력해주세요." 
      });
    }
    
    // 위치 정보 검증
    if (!userLat || !userLng) {
      console.log('❌ 위치 정보 누락:', { userLat, userLng });
      return res.status(400).json({ 
        message: "위치 정보가 필요합니다. 위치 권한을 허용해주세요." 
      });
    }
    
    // 투표 세션 존재 확인
    const voteSession = await VoteSession.findById(voteId);
    if (!voteSession) {
      console.log('❌ 투표 세션을 찾을 수 없음:', voteId);
      return res.status(404).json({ 
        message: "존재하지 않는 투표입니다." 
      });
    }
    
    if (voteSession.status !== 'active') {
      console.log('❌ 비활성 투표 세션:', voteSession.status);
      return res.status(400).json({ 
        message: "현재 진행 중인 투표가 아닙니다." 
      });
    }
    
    // 후보 번호 유효성 검사
    if (choice < 1 || choice > voteSession.candidates.length) {
      console.log('❌ 유효하지 않은 후보 번호:', choice);
      return res.status(400).json({ 
        message: `1번부터 ${voteSession.candidates.length}번까지의 후보 중 선택해주세요.` 
      });
    }
    
    // 위치 기반 투표 검증
    if (!global.votingLocation) {
      console.log('❌ 투표 위치가 설정되지 않음');
      return res.status(400).json({ 
        message: "투표 위치가 설정되지 않았습니다. 관리자에게 문의해주세요." 
      });
    }
    
    // 사용자 위치와 투표 장소 간의 거리 계산
    const distance = calculateDistance(
      userLat, userLng,
      global.votingLocation.lat, global.votingLocation.lng
    );
    
    console.log('📍 위치 정보:', {
      userLocation: { lat: userLat, lng: userLng },
      votingLocation: global.votingLocation,
      distance: `${distance.toFixed(1)}m`,
      allowedRadius: `${global.votingLocation.radius}m`
    });
    
    // 허용 반경 내에 있는지 확인 (10m로 고정)
    const allowedRadius = 10; // 10m
    if (distance > allowedRadius) {
      console.log('❌ 투표 장소 밖에 있음:', `${distance.toFixed(1)}m > ${allowedRadius}m`);
      return res.status(403).json({ 
        message: `행사장을 벗어났습니다. 현재 거리: ${distance.toFixed(1)}m, 허용 거리: ${allowedRadius}m`,
        distance: distance,
        allowedRadius: allowedRadius,
        userLocation: { lat: userLat, lng: userLng },
        votingLocation: global.votingLocation
      });
    }
    
    // 중복 투표 체크
    const existingVote = await VoteResult.findOne({ voteId, userId });
    if (existingVote) {
      console.log('❌ 이미 투표한 사용자:', userId);
      return res.status(400).json({ 
        message: "이미 투표하셨습니다. 한 번만 투표할 수 있습니다." 
      });
    }
    
    // 투표 결과 저장 (위치 정보 포함)
    const voteResult = await VoteResult.create({ 
      voteId, 
      userId, 
      choice,
      userLat,
      userLng,
      distance,
      votedAt: new Date()
    });
    
    console.log('✅ 투표 제출 성공:', voteResult._id);
    
    res.json({ 
      message: "투표가 성공적으로 제출되었습니다!",
      voteId: voteResult._id,
      choice: choice,
      candidateName: voteSession.candidates[choice - 1],
      distance: distance,
      allowedRadius: allowedRadius
    });
    
  } catch (err) {
    console.error('❌ 투표 제출 중 오류 발생:');
    console.error('에러 타입:', err.name);
    console.error('에러 메시지:', err.message);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "투표 데이터 검증 오류: " + Object.values(err.errors).map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({ 
      message: "투표 제출 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 두 지점 간의 거리 계산 (Haversine 공식)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
};

exports.getVoteResults = async (req, res) => {
  try {
    console.log('📊 투표 결과 조회 요청');
    console.log('인증된 사용자:', req.user);
    
    const results = await VoteResult.find()
      .populate('voteId', 'title status candidates')
      .populate('userId', 'email name')
      .sort({ votedAt: -1 })
      .lean();
    
    console.log(`✅ ${results.length}개의 투표 결과 조회 완료`);
    
    res.json(results);
  } catch (err) {
    console.error('❌ 투표 결과 조회 중 오류:', err);
    res.status(500).json({ 
      message: '투표 결과 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};


exports.getActiveSession = async (req, res) => {
  try {
    console.log('📋 활성 투표 세션 조회 요청');
    
    const session = await VoteSession.findOne({ status: 'active' })
      .sort({ createdAt: -1 }) // 최근 생성된 active 세션
      .lean();

    if (!session) {
      return res.status(404).json({ message: '현재 진행 중인 투표가 없습니다.' });
    }

    console.log('✅ 활성 투표 세션 조회 완료');
    res.json(session);
  } catch (err) {
    console.error('❌ 활성 세션 조회 오류:', err);
    res.status(500).json({ 
      message: '활성 세션 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 모든 투표 세션 조회 (관리자용)
exports.getAllSessions = async (req, res) => {
  try {
    console.log('📋 모든 투표 세션 조회 요청');
    
    const sessions = await VoteSession.find()
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ ${sessions.length}개의 투표 세션 조회 완료`);
    
    res.json(sessions);
  } catch (err) {
    console.error('❌ 투표 세션 조회 중 오류:', err);
    res.status(500).json({ 
      message: '투표 세션 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 특정 세션의 투표 결과 조회
exports.getSessionResults = async (req, res) => {
  try {
    console.log('📊 특정 세션 투표 결과 조회 요청');
    console.log('인증된 사용자:', req.user);
    
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: "세션 ID가 필요합니다." });
    }
    
    // 투표 세션 존재 확인
    const voteSession = await VoteSession.findById(sessionId);
    if (!voteSession) {
      return res.status(404).json({ message: "존재하지 않는 투표 세션입니다." });
    }
    
    // 해당 세션의 투표 결과만 조회
    const results = await VoteResult.find({ voteId: sessionId })
      .populate('userId', 'email name')
      .sort({ votedAt: -1 })
      .lean();
    
    console.log(`✅ ${results.length}개의 투표 결과 조회 완료 (세션: ${sessionId})`);
    
    res.json(results);
  } catch (err) {
    console.error('❌ 세션별 투표 결과 조회 중 오류:', err);
    res.status(500).json({ 
      message: '투표 결과 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 투표 세션 삭제 (관리자용)
exports.deleteSession = async (req, res) => {
  try {
    console.log('🗑️ 투표 세션 삭제 요청');
    
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: "세션 ID가 필요합니다." });
    }
    
    // 투표 세션 존재 확인
    const voteSession = await VoteSession.findById(sessionId);
    if (!voteSession) {
      return res.status(404).json({ message: "존재하지 않는 투표 세션입니다." });
    }
    
    // 진행 중인 투표는 삭제 불가
    if (voteSession.status === 'active') {
      return res.status(400).json({ message: "진행 중인 투표는 삭제할 수 없습니다. 먼저 투표를 종료해주세요." });
    }
    
    console.log(`🗑️ 세션 삭제 시작: ${voteSession.title} (ID: ${sessionId})`);
    
    // 1. 관련된 투표 결과 삭제
    const deletedResults = await VoteResult.deleteMany({ voteId: sessionId });
    console.log(`🗑️ ${deletedResults.deletedCount}개의 투표 결과 삭제 완료`);
    
    // 2. 투표 세션 삭제
    await VoteSession.findByIdAndDelete(sessionId);
    console.log(`🗑️ 투표 세션 삭제 완료: ${voteSession.title}`);
    
    res.json({ 
      message: "투표 세션이 성공적으로 삭제되었습니다.",
      deletedSession: voteSession.title,
      deletedResultsCount: deletedResults.deletedCount
    });
    
  } catch (err) {
    console.error('❌ 투표 세션 삭제 중 오류:', err);
    res.status(500).json({ 
      message: '투표 세션 삭제 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 투표 위치 조회
exports.getVotingLocation = async (req, res) => {
  try {
    console.log('📍 투표 위치 조회 요청');
    
    // 간단한 메모리 기반 위치 저장 (실제로는 데이터베이스에 저장해야 함)
    // 여기서는 전역 변수로 관리 (서버 재시작 시 초기화됨)
    if (!global.votingLocation) {
      return res.json({ location: null });
    }
    
    console.log('✅ 투표 위치 조회 완료');
    res.json({ location: global.votingLocation });
    
  } catch (err) {
    console.error('❌ 투표 위치 조회 중 오류:', err);
    res.status(500).json({ 
      message: '투표 위치 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 투표 위치 설정
exports.setVotingLocation = async (req, res) => {
  try {
    console.log('📍 투표 위치 설정 요청');
    console.log('요청 본문:', req.body);
    
    const { lat, lng, name, radius } = req.body;
    
    // 입력값 검증
    if (!lat || !lng || !name || !radius) {
      return res.status(400).json({ 
        message: "위도, 경도, 위치 이름, 허용 반경이 모두 필요합니다." 
      });
    }
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ 
        message: "위도와 경도는 숫자여야 합니다." 
      });
    }
    
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ 
        message: "위도는 -90에서 90 사이의 값이어야 합니다." 
      });
    }
    
    if (lng < -180 || lng > 180) {
      return res.status(400).json({ 
        message: "경도는 -180에서 180 사이의 값이어야 합니다." 
      });
    }
    
    if (typeof radius !== 'number' || radius < 5 || radius > 100) {
      return res.status(400).json({ 
        message: "허용 반경은 5에서 100 사이의 숫자여야 합니다." 
      });
    }
    
    // 위치 정보 저장 (전역 변수로 관리)
    global.votingLocation = {
      lat,
      lng,
      name: name.trim(),
      radius,
      setAt: new Date().toISOString()
    };
    
    console.log('✅ 투표 위치 설정 완료:', global.votingLocation);
    
    res.json({ 
      message: "투표 장소 위치가 성공적으로 설정되었습니다!",
      location: global.votingLocation
    });
    
  } catch (err) {
    console.error('❌ 투표 위치 설정 중 오류:', err);
    res.status(500).json({ 
      message: '투표 위치 설정 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : '내부 서버 오류'
    });
  }
};

// 두 지점 간의 거리 계산 (Haversine 공식)