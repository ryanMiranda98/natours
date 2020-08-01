const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name"],
  },
  email: {
    type: String,
    required: [true, "A user must have an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {type: String, default: 'default.jpg'},
  role: {
    type: String,
    enum: ["user", "guid", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "A user must have a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  active: { type: Boolean, default: true, select: false },
});

// Hash password pre-save hook/middleware
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
  next();
});

// Pre-save hook to change passwordChangedAt
UserSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware - Prehook to select all users who are active
// for all types of .find()
UserSchema.pre(/^find/, function (next) {
  // this-> current query
  this.find({ active: { $ne: false } });
  next();
});

// Instance method= verify password on login
UserSchema.methods.verifyPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method= checks if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function (iatTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return iatTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method = create a reset token and encrypt it to save in DB
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Encrypt and save it in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000;

  // return un-encrypted token to user
  return resetToken;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
