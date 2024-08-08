const mongoose = require("mongoose");

const knockoutSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required : true,
    },
    formatName: {
      type: String,
      required :true,
    },
    fixingType: {
      type: String,
      required : true,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
      required : true,
    },
    totalWinnersRounds: {
      type: Number,
      default : null,
    },
    totalLosersRounds: {
      type: Number,
      default : null,
    },
    winnersRoundsNames: [
      {
        type: String,
        default : null,
      },
    ],
    losersRoundsNames: [
      {
        type: String,
        default : null,
      },
    ],
    finalRoundName: {
      type: String,
      default: "Final",
    },
    winnersRoundsIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentRound",
      },
    ],
    losersRoundsIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentRound",
      },
    ],
    finalRoundId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentRound",
      },
    ],
    totalTeams:{
        type: Number,
        default : null,
    },
    totalParticipants:{
        type: Number,
        default : null,
    },
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

module.exports = mongoose.model("tournamentDoubleKnockout", knockoutSchema);

