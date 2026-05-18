const User = require('../models/user.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const { generateAuthTokens } = require('../services/token.service');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
const { generateResetToken, clearAuthCookies } = require('../services/token.service');
const { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS, OTP_COOLDOWN_MINUTES, BCRYPT_ROUNDS } = require('../constants/auth.constants');
const env = require('../config/env');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, BCRYPT_ROUNDS);
};

const verifyOTPHash = async (plainOTP, hashedOTP) => {
  return await bcrypt.compare(plainOTP, hashedOTP);
};

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, 'Full name, email, and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const user = await User.create({
    fullName,
    email,
    password,
    isEmailVerified: false,
    otp: hashedOTP,
    otpExpiry,
    otpAttempts: 0,
    lastOTPAttempt: new Date(),
  });

  try {
    await sendOTPEmail(email, otp, fullName);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken -otp -otpExpiry -otpAttempts -lastOTPAttempt'
  );

  res.status(201).json(
    new ApiResponse(
      201,
      { user: createdUser },
      'Registration successful. OTP sent to your email.'
    )
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user.otp = hashedOTP;
  user.otpExpiry = otpExpiry;
  user.otpAttempts = 0;
  user.lastOTPAttempt = new Date();
  await user.save();

  try {
    await sendOTPEmail(user.email, otp, user.fullName);
  } catch (emailError) {
    console.error('[ERROR] Failed to send OTP email:', emailError.message);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { 
        email: user.email,
        requiresOTP: true,
        isEmailVerified: user.isEmailVerified
      },
      'OTP has been sent to your email. Please verify to continue.'
    )
  );
});

const logout = asyncHandler(async (req, res) => {
  const { addToBlacklist } = require('../services/blacklist.service');
  
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    const accessTokenExpiry = 15 * 60;
    addToBlacklist(token, accessTokenExpiry);
  }

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  clearAuthCookies(res);

  res.status(200).json(
    new ApiResponse(200, {}, 'User logged out successfully')
  );
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const user = await User.findOne({ email }).select('+otp +otpExpiry +otpAttempts +lastOTPAttempt');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.otp || !user.otpExpiry) {
    throw new ApiError(400, 'No OTP found. Please request a new one.');
  }

  if (new Date() > user.otpExpiry) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    const lastAttemptTime = user.lastOTPAttempt ? new Date(user.lastOTPAttempt) : new Date();
    const cooldownDuration = OTP_COOLDOWN_MINUTES * 60 * 1000;
    const timeSinceLastAttempt = Date.now() - lastAttemptTime.getTime();

    if (timeSinceLastAttempt < cooldownDuration) {
      const remainingTime = Math.ceil((cooldownDuration - timeSinceLastAttempt) / 1000 / 60);
      throw new ApiError(429, `Too many failed attempts. Please try again in ${remainingTime} minutes.`);
    }

    user.otpAttempts = 0;
  }

  const isOTPValid = await verifyOTPHash(otp, user.otp);

  if (!isOTPValid) {
    user.otpAttempts += 1;
    user.lastOTPAttempt = new Date();
    await user.save({ validateBeforeSave: false });

    const attemptsLeft = Math.max(0, 5 - user.otpAttempts);
    const message = attemptsLeft > 0
      ? `Invalid OTP. ${attemptsLeft} attempts remaining.`
      : 'Too many failed attempts. Please request a new OTP.';
    throw new ApiError(400, message);
  }

  const isFirstTimeVerification = !user.isEmailVerified;

  if (isFirstTimeVerification) {
    user.isEmailVerified = true;
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  user.lastOTPAttempt = undefined;
  await user.save({ validateBeforeSave: false });

  if (isFirstTimeVerification) {
    try {
      await sendWelcomeEmail(email, user.fullName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  await generateAuthTokens(user, res);

  const verifiedUser = await User.findById(user._id).select(
    '-password -refreshToken -otp -otpExpiry -otpAttempts'
  );

  const message = isFirstTimeVerification 
    ? 'Email verified successfully! Welcome to LearnLog.' 
    : 'Login successful! Welcome back to LearnLog.';

  res.status(200).json(
    new ApiResponse(
      200,
      { user: verifiedUser },
      message
    )
  );
});

const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user.otp = hashedOTP;
  user.otpExpiry = otpExpiry;
  user.otpAttempts = 0;
  user.lastOTPAttempt = new Date();
  await user.save({ validateBeforeSave: false });

  let emailSent = false;
  try {
    await sendOTPEmail(email, otp, user.fullName);
    emailSent = true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);

    if (env.isProduction) {
      throw new ApiError(500, 'Failed to send OTP email. Please try again.');
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {},
      emailSent
        ? 'OTP sent successfully. Please check your email.'
        : 'OTP has been generated. Please check your email for the verification code.'
    )
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  const tokenService = require('../services/token.service');
  const tokens = await tokenService.refreshAccessToken(incomingRefreshToken, res);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Access token refreshed successfully'
    )
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(200).json(
      new ApiResponse(
        200,
        {},
        'If an account with this email exists, a password reset link has been sent.'
      )
    );
    return;
  }

  const resetToken = await generateResetToken(user);

  try {
    await sendPasswordResetEmail(user.email, resetToken, user.fullName);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {},
      'If an account with this email exists, a password reset link has been sent.'
    )
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const user = await User.findOne({
    forgotPasswordExpiry: { $gt: Date.now() },
  }).select('+forgotPasswordToken');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const isTokenValid = await bcrypt.compare(resetToken, user.forgotPasswordToken);

  if (!isTokenValid) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {}, 'Password reset successfully')
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry'
  );

  res.status(200).json(
    new ApiResponse(200, { user }, 'Current user fetched successfully')
  );
});

module.exports = {
  register,
  login,
  logout,
  verifyOTP,
  resendOTP,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
