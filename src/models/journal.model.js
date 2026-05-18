const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    topicName: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
      minlength: [2, 'Topic name must be at least 2 characters'],
      maxlength: [100, 'Topic name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    studyDuration: {
      type: Number,
      required: [true, 'Study duration is required'],
      min: [1, 'Study duration must be at least 1 minute'],
      max: [1440, 'Study duration cannot exceed 1440 minutes (24 hours)'],
    },

    difficultyLevel: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced', 'expert'],
        message: 'Difficulty level must be: beginner, intermediate, advanced, or expert',
      },
    },

    studyDate: {
      type: Date,
      required: [true, 'Study date is required'],
      default: Date.now,
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },

    resources: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

journalSchema.index({ user: 1, studyDate: -1 });

journalSchema.index({ topicName: 'text', description: 'text' });

journalSchema.virtual('studyDurationInHours').get(function () {
  return (this.studyDuration / 60).toFixed(2);
});

journalSchema.set('toJSON', { virtuals: true });
journalSchema.set('toObject', { virtuals: true });

const Journal = mongoose.model('Journal', journalSchema);

module.exports = Journal;
