const mongoose = require("mongoose");

const knockoutSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
    },
    formatType: {
      type: String,
    },
    fixingType: {
      type: String,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
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
        ref: "round",
      },
    ],
    losersRoundsIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "round",
      },
    ],
    finalRoundId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "round",
      },
    ],
    totalTeams:{
        type: Number,
    },
    totalParticipants:{
        type: Number,
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "team",
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "player",
      },
    ],
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "player",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("doubleKnockout", knockoutSchema);

// double_knockout_schema [icon: user, color: gray] {
//     id ObjectId()
//     tournamentID ObjectId()
//     formatName  string
//     fixingType string
//     gameType string
//     WinnersRounds integer
//     losersRounds integer
//     WinnersRoundsNames names []
//     losersRoundsNames names []
//     finalRoundName String
//     winnersRoundsIds  Rounds [ObjectId()]
//     losersRoundsIds  Rounds [ObjectId()]
//     finalRoundId Rounds ObjectId()
//     teams Teams [ObjectId()]
//     participents players [ObjectId() ]
//     players players [ObjectId() ]
// }
