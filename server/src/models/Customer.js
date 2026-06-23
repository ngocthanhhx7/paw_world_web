const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required() {
        return !this.googleSub;
      },
      minlength: 6,
      select: false,
    },
    phone: { type: String, default: '', trim: true },
    avatar: { type: String, default: '' },
    googleSub: { type: String, default: '', trim: true, index: true },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    resetPasswordTokenHash: { type: String, default: '' },
    resetPasswordExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

customerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

customerSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

customerSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  return token;
};

customerSchema.methods.clearPasswordResetToken = function clearPasswordResetToken() {
  this.resetPasswordTokenHash = '';
  this.resetPasswordExpiresAt = null;
};

customerSchema.methods.bumpTokenVersion = function bumpTokenVersion() {
  this.tokenVersion = (this.tokenVersion || 0) + 1;
};

module.exports = mongoose.model('Customer', customerSchema);
