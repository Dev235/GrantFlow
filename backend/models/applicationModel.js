// models/applicationModel.js
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
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be String, Number, Date, or a file path (String)
    required: true,
  },
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
      enum: ['Submitted', 'In Review', 'Approved', 'Rejected'],
      default: 'Submitted',
    },
    // The core of the application is the array of answers
    answers: [answerSchema],
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
