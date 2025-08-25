const mongoose = require("mongoose");

const socialActivitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model("SocialActivity", socialActivitySchema);
