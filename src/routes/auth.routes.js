const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  verifyOTP,
  resendOTP,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} = require('../controllers/auth.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/logout', verifyJWT, logout);
router.get('/current-user', verifyJWT, getCurrentUser);

module.exports = router;
