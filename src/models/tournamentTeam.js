const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required: true,
    }, 
    name: {
      type: String,
      required: true,
    },
    sportName: {
      type: String,
    },
    teamNumber: {
      type: Number,
    },
    members: [
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

module.exports = mongoose.model("tournamentTeam", teamSchema);
