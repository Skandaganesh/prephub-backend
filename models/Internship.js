const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: String,
  description: String,
  ctc: String,
  link: String,
  location: String,
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Internship', InternshipSchema);
