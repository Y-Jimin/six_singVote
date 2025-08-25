const express = require('express');
const authRouter = require('./authRouter');
const voteRouter = require('./voteRouter');

const router = express.Router();

router.use('/auth', authRouter);   // /api/auth/...
router.use('/vote', voteRouter);   // /api/vote/...

module.exports = router;
