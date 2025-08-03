// backend/models/grantModel.js
// Mongoose schema for Grants

const mongoose = require('mongoose');

// Defines the structure for a single question in the grant application
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['text', 'textarea', 'number', 'date', 'file'],
    default: 'text',
  },
  isRequired: {
    type: Boolean,
    default: true,
  },
  // NEW: Add a points field for scoring
  points: {
    type: Number,
    required: true,
    default: 10,
  }
});

const grantSchema = new mongoose.Schema(
  {
    grantMaker: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // References the User model
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Awarded'],
      default: 'Open',
    },
    // The application form is a dynamic array of questions
    applicationQuestions: [questionSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const Grant = mongoose.model('Grant', grantSchema);

module.exports = Grant;
