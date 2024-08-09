const mongoose = require("mongoose");

const pointTableSchema = new mongoose.Schema(
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
    formatName: {
      type: String,
      default : "round_robbin",
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
      required : true,
    },
    participantID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    plays: {
      type: Number,
      default : 0,
    },
    wins: {
      type: Number,
      default : 0,
    },
    draws: {
      type: Number,
      default : 0,
    },
    losses: {
      type: Number,
      default : 0,
    },
    points: {
      type: Number,
      default : 0,
    }, 
  },
  { timestamps: true }
);

const tournamentPointTables = mongoose.model(
  "tournamentPointTable",
  pointTableSchema
);

module.exports = tournamentPointTables;
