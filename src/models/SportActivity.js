const mongoose = require("mongoose");

const sportActivitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model("SportActivity", sportActivitySchema);
