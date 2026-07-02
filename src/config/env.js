require('dotenv').config();
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8080,

  FRONTEND_URL: process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:5173' : 'http://localhost:5174'),
  MONGODB_URI: process.env.MONGODB_URI,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,

  PASSWORD_RESET_SECRET: process.env.PASSWORD_RESET_SECRET,
  PASSWORD_RESET_EXPIRY: process.env.PASSWORD_RESET_EXPIRY,

  APP_NAME: process.env.APP_NAME,

  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_EMAIL: process.env.BREVO_EMAIL,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || process.env.BREVO_EMAIL,

  isDevelopment,
  isProduction,
};
