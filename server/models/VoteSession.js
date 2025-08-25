const mongoose = require('mongoose');

const VoteSessionSchema = new mongoose.Schema({
  title: String,                      // 투표 제목
  candidates: [String],               // 후보자 명
  status: { type: String, default: 'active' }, // active, finished
  createdAt: { type: Date, default: Date.now },
  finishedAt: Date,
});

module.exports = mongoose.model('VoteSession', VoteSessionSchema);
