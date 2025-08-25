const mongoose = require("mongoose");

const artActivitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model("ArtActivity", artActivitySchema);
