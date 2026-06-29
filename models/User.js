const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  displayName: { type: String },
  avatarGradient: { type: String },
  isAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['student', 'moderator', 'superadmin', 'guest'], default: 'student' },
  moderatorId: { type: String, default: null },
  refreshToken: { type: String, default: null }
}, {
  timestamps: true
});

// Since email + role combination needs to be unique (students and moderators can share same email prefix if allowed in routes)
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
