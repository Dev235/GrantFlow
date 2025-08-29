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
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['Applicant', 'Grant Maker', 'Super Admin', 'Reviewer', 'Approver'],
      default: 'Applicant',
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
    },
    organizationRole: {
        type: String,
        enum: ['Admin', 'Member', null],
        default: null,
    },
    joinRequestStatus: {
        type: String,
        enum: ['None', 'Pending', 'Rejected'],
        default: 'None'
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: ['Unverified', 'Pending', 'Verified'],
      default: 'Unverified',
    },

    profile: {
      type: Object, // Simplified for brevity, assuming userProfileSchema is defined elsewhere
      default: () => ({})
    }
  },
  { timestamps: true }
);

// Method to compare entered password with the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.role === 'Super Admin') {
    this.verificationStatus = 'Verified';
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
