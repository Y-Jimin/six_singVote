const express = require('express');
const {
  createSession,
  endSession,
  submitVote,
  getVoteResults,
  getActiveSession,
  getAllSessions,
  getSessionResults,
  deleteSession,
  getVotingLocation,
  setVotingLocation
} = require('../controllers/voteController');
const auth = require('../middleware/auth'); // 사용자 인증 미들웨어
const adminAuth = require('../middleware/adminAuth'); // 관리자 인증 미들웨어
const router = express.Router();

// 관리자 전용 (관리자 인증 필요)
router.post('/session', adminAuth, createSession);
router.post('/session/end', adminAuth, endSession);
router.delete('/session/:sessionId', adminAuth, deleteSession); // 투표 세션 삭제
router.get('/sessions', adminAuth, getAllSessions); // 모든 투표 세션 조회

// 위치 관련 API (관리자 인증 필요)
router.get('/location', getVotingLocation); // 투표 위치 조회 (공개)
router.post('/location', adminAuth, setVotingLocation); // 투표 위치 설정 (관리자만)

// 사용자 인증 필요
router.post('/submit', auth, submitVote); // 인증 미들웨어 적용
router.get('/results', auth, getVoteResults); // 인증 미들웨어 적용
router.get('/results/:sessionId', auth, getSessionResults); // 특정 세션 결과 조회

// 공개 접근 가능
router.get('/session/active', getActiveSession);

module.exports = router;
