const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    coordinatorName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    daysCount: {
      type: Number,
      required: true,
    },
    participantsCount: {
      type: Number,
      required: true,
    },
    targetAge: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
    },
    gender: {
      type: String,
      required: true,
    },
    accessType: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      default: "مجدول",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
