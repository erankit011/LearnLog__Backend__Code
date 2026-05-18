const Journal = require('../models/journal.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const createJournal = asyncHandler(async (req, res) => {
  const { topicName, description, studyDuration, difficultyLevel, studyDate, tags, resources, notes } = req.body;

  if (!topicName || typeof topicName !== 'string') {
    throw new ApiError(400, 'Topic name is required and must be a string');
  }

  if (topicName.trim().length < 2) {
    throw new ApiError(400, 'Topic name must be at least 2 characters');
  }

  if (topicName.length > 100) {
    throw new ApiError(400, 'Topic name cannot exceed 100 characters');
  }

  if (!description || typeof description !== 'string') {
    throw new ApiError(400, 'Description is required and must be a string');
  }

  if (description.trim().length < 10) {
    throw new ApiError(400, 'Description must be at least 10 characters');
  }

  if (description.length > 2000) {
    throw new ApiError(400, 'Description cannot exceed 2000 characters');
  }

  if (!studyDuration || typeof studyDuration !== 'number') {
    throw new ApiError(400, 'Study duration is required and must be a number');
  }

  if (studyDuration < 1) {
    throw new ApiError(400, 'Study duration must be at least 1 minute');
  }

  if (studyDuration > 1440) {
    throw new ApiError(400, 'Study duration cannot exceed 1440 minutes (24 hours)');
  }

  if (!difficultyLevel || !['beginner', 'intermediate', 'advanced', 'expert'].includes(difficultyLevel)) {
    throw new ApiError(400, 'Difficulty level must be: beginner, intermediate, advanced, or expert');
  }

  if (tags && Array.isArray(tags) && tags.length > 10) {
    throw new ApiError(400, 'Cannot have more than 10 tags');
  }

  if (notes && notes.length > 1000) {
    throw new ApiError(400, 'Notes cannot exceed 1000 characters');
  }

  const journal = await Journal.create({
    user: req.user._id,
    topicName,
    description,
    studyDuration,
    difficultyLevel,
    studyDate: studyDate || Date.now(),
    tags: tags || [],
    resources: resources || [],
    notes: notes || '',
  });

  res.status(201).json(
    new ApiResponse(201, { journal }, 'Journal entry created successfully')
  );
});

const getAllJournals = asyncHandler(async (req, res) => {
  const { search, difficulty, startDate, endDate, page = 1, limit = 10 } = req.query;

  const query = { user: req.user._id };

  if (search) {
    query.$or = [
      { topicName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (difficulty) {
    query.difficultyLevel = difficulty;
  }

  if (startDate || endDate) {
    query.studyDate = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.studyDate.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.studyDate.$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const journals = await Journal.find(query)
    .sort({ studyDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Journal.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        journals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEntries: total,
          entriesPerPage: parseInt(limit),
        },
      },
      'Journal entries fetched successfully'
    )
  );
});

const getJournalById = asyncHandler(async (req, res) => {
  const { journalId } = req.params;

  const journal = await Journal.findOne({
    _id: journalId,
    user: req.user._id,
  });

  if (!journal) {
    throw new ApiError(404, 'Journal entry not found');
  }

  res.status(200).json(
    new ApiResponse(200, { journal }, 'Journal entry fetched successfully')
  );
});

const updateJournal = asyncHandler(async (req, res) => {
  const { journalId } = req.params;
  const { topicName, description, studyDuration, difficultyLevel, studyDate, tags, resources, notes } = req.body;

  if (topicName !== undefined) {
    if (!topicName || typeof topicName !== 'string') {
      throw new ApiError(400, 'Topic name must be a non-empty string');
    }
    if (topicName.trim().length < 2) {
      throw new ApiError(400, 'Topic name must be at least 2 characters');
    }
    if (topicName.length > 100) {
      throw new ApiError(400, 'Topic name cannot exceed 100 characters');
    }
  }

  if (description !== undefined) {
    if (!description || typeof description !== 'string') {
      throw new ApiError(400, 'Description must be a non-empty string');
    }
    if (description.trim().length < 10) {
      throw new ApiError(400, 'Description must be at least 10 characters');
    }
    if (description.length > 2000) {
      throw new ApiError(400, 'Description cannot exceed 2000 characters');
    }
  }

  if (studyDuration !== undefined) {
    if (typeof studyDuration !== 'number') {
      throw new ApiError(400, 'Study duration must be a number');
    }
    if (studyDuration < 1) {
      throw new ApiError(400, 'Study duration must be at least 1 minute');
    }
    if (studyDuration > 1440) {
      throw new ApiError(400, 'Study duration cannot exceed 1440 minutes (24 hours)');
    }
  }

  if (difficultyLevel !== undefined) {
    if (!['beginner', 'intermediate', 'advanced', 'expert'].includes(difficultyLevel)) {
      throw new ApiError(400, 'Difficulty level must be: beginner, intermediate, advanced, or expert');
    }
  }

  if (tags !== undefined && Array.isArray(tags) && tags.length > 10) {
    throw new ApiError(400, 'Cannot have more than 10 tags');
  }

  if (notes !== undefined && notes.length > 1000) {
    throw new ApiError(400, 'Notes cannot exceed 1000 characters');
  }

  const updateFields = {};
  if (topicName) updateFields.topicName = topicName;
  if (description) updateFields.description = description;
  if (studyDuration) updateFields.studyDuration = studyDuration;
  if (difficultyLevel) updateFields.difficultyLevel = difficultyLevel;
  if (studyDate) updateFields.studyDate = studyDate;
  if (tags !== undefined) updateFields.tags = tags;
  if (resources !== undefined) updateFields.resources = resources;
  if (notes !== undefined) updateFields.notes = notes;

  const journal = await Journal.findOneAndUpdate(
    {
      _id: journalId,
      user: req.user._id,
    },
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!journal) {
    throw new ApiError(404, 'Journal entry not found');
  }

  res.status(200).json(
    new ApiResponse(200, { journal }, 'Journal entry updated successfully')
  );
});

const deleteJournal = asyncHandler(async (req, res) => {
  const { journalId } = req.params;

  const journal = await Journal.findOneAndDelete({
    _id: journalId,
    user: req.user._id,
  });

  if (!journal) {
    throw new ApiError(404, 'Journal entry not found');
  }

  res.status(200).json(
    new ApiResponse(200, {}, 'Journal entry deleted successfully')
  );
});

const getRecentJournals = asyncHandler(async (req, res) => {
  const journals = await Journal.find({ user: req.user._id })
    .sort({ studyDate: -1, createdAt: -1 })
    .limit(5);

  res.status(200).json(
    new ApiResponse(200, { journals }, 'Recent journal entries fetched successfully')
  );
});

module.exports = {
  createJournal,
  getAllJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  getRecentJournals,
};
