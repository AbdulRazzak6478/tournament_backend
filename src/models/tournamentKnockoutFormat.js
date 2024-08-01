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
      required : true
    },
    roundNames: [
      {
        type: String,
        required: true,
      },
    ],
    rounds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentRound",
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

module.exports = mongoose.model("tournamentKnockout", knockoutSchema);
