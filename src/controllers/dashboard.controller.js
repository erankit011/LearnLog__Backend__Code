const Journal = require('../models/journal.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const totalStudyMinutes = await Journal.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, totalMinutes: { $sum: '$studyDuration' } } },
  ]);

  const totalMinutes = totalStudyMinutes[0]?.totalMinutes || 0;
  const totalStudyHours = Math.round((totalMinutes / 60) * 100) / 100;

  const totalEntries = await Journal.countDocuments({ user: userId });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const entriesThisWeek = await Journal.countDocuments({
    user: userId,
    studyDate: { $gte: startOfWeek },
  });

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const entriesThisMonth = await Journal.countDocuments({
    user: userId,
    studyDate: { $gte: startOfMonth },
  });

  const avgDurationResult = await Journal.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, avgMinutes: { $avg: '$studyDuration' } } },
  ]);

  const avgStudyDuration = avgDurationResult[0]?.avgMinutes
    ? Math.round(avgDurationResult[0].avgMinutes)
    : 0;

  const allEntries = await Journal.find({ user: userId })
    .sort({ studyDate: -1 })
    .select('studyDate');

  let studyStreak = 0;
  if (allEntries.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(allEntries[0].studyDate);
    currentDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      studyStreak = 1;
      for (let i = 1; i < allEntries.length; i++) {
        const prevDate = new Date(allEntries[i - 1].studyDate);
        prevDate.setHours(0, 0, 0, 0);

        const currDate = new Date(allEntries[i].studyDate);
        currDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          studyStreak++;
        } else {
          break;
        }
      }
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalStudyHours,
        totalEntries,
        entriesThisWeek,
        entriesThisMonth,
        avgStudyDuration,
        studyStreak,
      },
      'Dashboard statistics fetched successfully'
    )
  );
});

const getWeeklySummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyEntries = await Journal.find({
    user: userId,
    studyDate: { $gte: sevenDaysAgo },
  }).sort({ studyDate: 1 });

  const dailyStats = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyStats[dateKey] = {
      date: dateKey,
      dayName: dayNames[date.getDay()],
      studyMinutes: 0,
      entryCount: 0,
    };
  }

  weeklyEntries.forEach((entry) => {
    const dateKey = new Date(entry.studyDate).toISOString().split('T')[0];
    if (dailyStats[dateKey]) {
      dailyStats[dateKey].studyMinutes += entry.studyDuration;
      dailyStats[dateKey].entryCount += 1;
    }
  });

  const weeklyData = Object.values(dailyStats).map((day) => ({
    ...day,
    studyHours: Math.round((day.studyMinutes / 60) * 100) / 100,
  }));

  const totalWeeklyMinutes = weeklyData.reduce((sum, day) => sum + day.studyMinutes, 0);
  const totalWeeklyEntries = weeklyData.reduce((sum, day) => sum + day.entryCount, 0);
  const totalWeeklyHours = Math.round((totalWeeklyMinutes / 60) * 100) / 100;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        weeklyData,
        weeklyTotals: {
          totalStudyHours: totalWeeklyHours,
          totalEntries: totalWeeklyEntries,
        },
      },
      'Weekly summary fetched successfully'
    )
  );
});

const getRecentTopics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const recentTopics = await Journal.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('topicName difficultyLevel studyDate studyDuration');

  res.status(200).json(
    new ApiResponse(200, { recentTopics }, 'Recent topics fetched successfully')
  );
});

const getProductivityOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { months = 6 } = req.query;

  const monthlyData = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const entries = await Journal.find({
      user: userId,
      studyDate: { $gte: startDate, $lte: endDate },
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.studyDuration, 0);

    monthlyData.push({
      month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
      studyHours: (totalMinutes / 60).toFixed(2),
      entryCount: entries.length,
    });
  }

  res.status(200).json(
    new ApiResponse(200, { monthlyData }, 'Productivity overview fetched successfully')
  );
});

const getLearningAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const difficultyDistribution = await Journal.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$difficultyLevel',
        count: { $sum: 1 },
        totalMinutes: { $sum: '$studyDuration' },
      },
    },
    {
      $project: {
        difficulty: '$_id',
        count: 1,
        totalHours: { $divide: ['$totalMinutes', 60] },
        _id: 0,
      },
    },
  ]);

  const topTopics = await Journal.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$topicName',
        count: { $sum: 1 },
        totalMinutes: { $sum: '$studyDuration' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $project: {
        topicName: '$_id',
        count: 1,
        totalHours: { $divide: ['$totalMinutes', 60] },
        _id: 0,
      },
    },
  ]);

  const allEntries = await Journal.find({ user: userId })
    .sort({ studyDate: -1 })
    .select('studyDate');

  let streak = 0;
  if (allEntries.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(allEntries[0].studyDate);
    currentDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak = 1;
      for (let i = 1; i < allEntries.length; i++) {
        const prevDate = new Date(allEntries[i - 1].studyDate);
        prevDate.setHours(0, 0, 0, 0);

        const currDate = new Date(allEntries[i].studyDate);
        currDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        difficultyDistribution,
        topTopics,
        studyStreak: streak,
      },
      'Learning analytics fetched successfully'
    )
  );
});

module.exports = {
  getDashboardStats,
  getWeeklySummary,
  getRecentTopics,
  getProductivityOverview,
  getLearningAnalytics,
};
