// models/userModel.js
// Mongoose schema for the User

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userProfileSchema = new mongoose.Schema({
  address: { type: String, default: '' },
  icNumber: { type: String, default: '' },
  icPictureUrl: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  age: { type: Number },
  incomeGroup: { 
    type: String, 
    enum: ['', 'B40', 'M40', 'T20'],
    default: ''
  },
  income: { type: Number },
  race: { 
    type: String, 
    enum: ['', 'Malay', 'Chinese', 'Indian', 'Other'],
    default: ''
  },
  gender: { 
    type: String, 
    enum: ['', 'Male', 'Female'],
    default: ''
  },
  profilePictureUrl: { type: String, default: '' },
});


const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Applicant', 'Grant Maker', 'Super Admin'],
      default: 'Applicant',
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: ['Unverified', 'Pending', 'Verified'],
      default: 'Unverified',
    },
    profile: {
      type: userProfileSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Method to compare entered password with the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to run before saving a user document
// This will hash the password if it has been modified
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
