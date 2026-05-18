require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const PORT = env.PORT || 8585;

const startServer = async () => {
  try {
    await connectDB();
    console.log('[OK] Database connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Server is running on port ${PORT}`);
      console.log(`[INFO] Environment: ${env.NODE_ENV}`);
      console.log(`[WEB] API URL: http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[ERROR] Port ${PORT} is already in use`);
      } else {
        console.error('[ERROR] Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('[ERROR] Unhandled Rejection:', err);
  console.error('Shutting down the server due to unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught Exception:', err);
  console.error('Shutting down the server due to uncaught exception');
  process.exit(1);
});

startServer();
