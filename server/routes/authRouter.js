const express = require('express');
const { googleAuth, googleCallback, logout, checkAuth } = require('../controllers/authController');
const { adminLogin, adminLogout, checkAdminAuth } = require('../controllers/authController');
const router = express.Router();

// Google OAuth 라우트
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/logout', logout);
router.get('/check', checkAuth);

// 관리자 인증 라우트
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.get('/admin/check', checkAdminAuth);

module.exports = router;
