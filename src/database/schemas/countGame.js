const mongoose = require("mongoose");

const countSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  lastCount: { type: Number, default: 0 },
  lastUserId: { type: String, default: null },
});

module.exports = mongoose.model("countGame", countSchema);
