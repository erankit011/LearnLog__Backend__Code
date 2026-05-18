const User = require('../models/user.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio } = req.body;

  if (fullName !== undefined) {
    if (!fullName || typeof fullName !== 'string') {
      throw new ApiError(400, 'Full name must be a non-empty string');
    }
    if (fullName.trim().length < 2) {
      throw new ApiError(400, 'Full name must be at least 2 characters');
    }
    if (fullName.length > 50) {
      throw new ApiError(400, 'Full name cannot exceed 50 characters');
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      throw new ApiError(400, 'Bio must be a string');
    }
    if (bio.length > 200) {
      throw new ApiError(400, 'Bio cannot exceed 200 characters');
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        bio: bio !== undefined ? bio : req.user.bio,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select('-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry');

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile updated successfully')
  );
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  if (req.user.avatar) {
    const oldAvatarPath = path.join(__dirname, '../../', req.user.avatar);
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatarUrl,
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry');

  res.status(200).json(
    new ApiResponse(200, { user }, 'Avatar uploaded successfully')
  );
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || typeof oldPassword !== 'string') {
    throw new ApiError(400, 'Old password is required');
  }

  if (!newPassword || typeof newPassword !== 'string') {
    throw new ApiError(400, 'New password is required');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from old password');
  }

  const user = await User.findById(req.user._id).select('+password');

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Old password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {}, 'Password changed successfully')
  );
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry'
  );

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile fetched successfully')
  );
});

const deleteAccount = asyncHandler(async (req, res) => {

  if (req.user.avatar) {
    const avatarPath = path.join(__dirname, '../../', req.user.avatar);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
  }

  await User.findByIdAndDelete(req.user._id);

  res.status(200).json(
    new ApiResponse(200, {}, 'Account deleted successfully')
  );
});

module.exports = {
  updateProfile,
  uploadAvatar,
  changePassword,
  getProfile,
  deleteAccount,
};
