const mongoose = require("mongoose");

const knockoutSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
    },
    formatName: {
      type: String,
      required : true,
    },
    fixingType: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
      default: "individual",
    },
    totalRounds: {
      type: Number,
      default : 0,
    },
    rounds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentRound",
        default : null,
      },
    ],
    totalTeams: {
      type: Number, 
      default: null,
    },
    totalParticipants: {
      type: Number,
      default: null,
    },
    pointTable : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "tournamentPointTable",
      }
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentTeam",
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentPlayer",
      },
    ],
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentPlayer",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("tournamentRoundRobbin", knockoutSchema);
