// backend/models/applicationModel.js
// Mongoose schema for submitted Grant Applications

const mongoose = require('mongoose');

// This schema defines the structure for a single answer within an application.
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be String, Number, Date, or a file path (String)
    required: true,
  },
  reviewerScore: {
    type: Number,
    default: 0
  },
  reviewerComments: {
      type: String,
      default: ''
  }
});

const applicationSchema = new mongoose.Schema(
  {
    grant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Grant',
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    grantMaker: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    status: {
      type: String,
      enum: ['Submitted', 'In Review', 'Waiting for Approval', 'Approved', 'Rejected'],
      default: 'Submitted',
    },
    score: {
        type: Number,
        default: 0,
    },
    flag: {
      type: String,
      enum: ['green', 'orange', 'red', null],
      default: null,
    },
    answers: [answerSchema],
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;