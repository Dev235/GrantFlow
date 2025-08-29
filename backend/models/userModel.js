// models/userModel.js
// Mongoose schema for the User

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
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
      type: Object,
      default: () => ({})
    }
  },
  { timestamps: true }
);

// Create a compound index to ensure email is unique per role
userSchema.index({ email: 1, role: 1 }, { unique: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (['Super Admin', 'Reviewer', 'Approver'].includes(this.role)) {
    this.verificationStatus = 'Verified';
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

