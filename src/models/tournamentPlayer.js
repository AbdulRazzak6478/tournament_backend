const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      default: null,
    },
    sportName: {
      type: String,
    },
    name: {
      type: String,
    },
    playerNumber: {
      type: Number,
    },
    email: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    teamID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournamentTeam",
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
    userMongoID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    // team: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "tournamentTeam",
    //   },
    // ],
    // tournamentIDs: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "tournament",
    //   },
    // ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("tournamentPlayer", playerSchema);
