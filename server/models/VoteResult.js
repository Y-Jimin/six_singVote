const mongoose = require('mongoose');

const VoteResultSchema = new mongoose.Schema({
  voteId: { type: mongoose.Schema.Types.ObjectId, ref: 'VoteSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  choice: { type: Number, required: true },
  userLat: { type: Number, required: true }, // 사용자 위도
  userLng: { type: Number, required: true }, // 사용자 경도
  distance: { type: Number, required: true }, // 투표 장소와의 거리 (미터)
  votedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VoteResult', VoteResultSchema);
