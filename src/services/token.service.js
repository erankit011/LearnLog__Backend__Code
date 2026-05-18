const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
} = require('../utils/generateTokens');
const env = require('../config/env');

const generateAuthTokens = async (user, res) => {
  try {
    const accessToken = generateAccessToken({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({ _id: user._id });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('[ERROR] Error generating auth tokens:', error.message);
    throw new Error('Failed to generate authentication tokens');
  }
};

const refreshAccessToken = async (incomingRefreshToken, res) => {
  try {
    if (!incomingRefreshToken) {
      throw new Error('Refresh token is required');
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new Error('Refresh token expired or used');
    }

    const tokens = await generateAuthTokens(user, res);

    return tokens;
  } catch (error) {
    console.error('[ERROR] Error refreshing access token:', error.message);
    throw error;
  }
};

const generateResetToken = async (user) => {
  try {
    const resetToken = generatePasswordResetToken({
      _id: user._id,
      email: user.email,
    });

    const hashedToken = await bcrypt.hash(resetToken, 10);

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = expiryDate;
    await user.save({ validateBeforeSave: false });

    return resetToken;
  } catch (error) {
    console.error('[ERROR] Error generating password reset token:', error.message);
    throw new Error('Failed to generate password reset token');
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: '/',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

module.exports = {
  generateAuthTokens,
  refreshAccessToken,
  generateResetToken,
  clearAuthCookies,
};
