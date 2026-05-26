const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: String },
  avatarGradient: { type: String },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }] // Array of user IDs (strings)
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String },
  authorType: { type: String },
  avatarGradient: { type: String },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  reports: { type: Number, default: 0 },
  isReported: { type: Boolean, default: false },
  votesByUser: { type: Map, of: String, default: {} },
  comments: [commentSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
