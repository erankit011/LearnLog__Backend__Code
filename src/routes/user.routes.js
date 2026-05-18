const express = require('express');
const router = express.Router();
const {
  updateProfile,
  uploadAvatar,
  changePassword,
  getProfile,
  deleteAccount,
} = require('../controllers/user.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/multer.middleware');

router.get('/profile', verifyJWT, getProfile);
router.patch('/update-profile', verifyJWT, updateProfile);
router.post('/upload-avatar', verifyJWT, uploadSingle('avatar'), uploadAvatar);
router.post('/change-password', verifyJWT, changePassword);
router.delete('/delete-account', verifyJWT, deleteAccount);

module.exports = router;
