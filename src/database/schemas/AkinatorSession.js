const mongoose = require("mongoose");

const AkiSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String },
  category: { type: String },
  resultName: { type: String },
  description: { type: String },
  image: { type: String },
  timesGuessed: { type: Number, default: 0 },
  lastGuessed: { type: Date, default: Date.now },
  lastChannelId: { type: String },
  lastMessageId: { type: String },
});

module.exports = mongoose.model("AkinatorSession", AkiSessionSchema);
