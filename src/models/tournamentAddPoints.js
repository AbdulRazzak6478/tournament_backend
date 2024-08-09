const mongoose = require("mongoose");

const addPointsSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required: true,
    },
    formatID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournamentRoundRobbin",
      required: true,
    },
    pointsTableID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournamentPointTable",
      required: true,
    },
    participantID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
    },
    points: {
      type: Number,
      required: true,
      default : 0,
    },
    reason: {
      type: String,
      required: true,
      default : "",
    }, 
  },
  { timestamps: true }
);

const tournamentAddPoints = mongoose.model(
  "tournamentAddPoint",
  addPointsSchema
);

module.exports = tournamentAddPoints;
