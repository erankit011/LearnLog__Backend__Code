const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getWeeklySummary,
  getRecentTopics,
  getProductivityOverview,
  getLearningAnalytics,
} = require('../controllers/dashboard.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.get('/stats', verifyJWT, getDashboardStats);
router.get('/weekly-summary', verifyJWT, getWeeklySummary);
router.get('/recent-topics', verifyJWT, getRecentTopics);
router.get('/productivity', verifyJWT, getProductivityOverview);
router.get('/analytics', verifyJWT, getLearningAnalytics);

module.exports = router;
