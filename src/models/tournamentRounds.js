const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required: true,
    },
    formatTypeID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    formatName : {
      type : String,
    },
    fixingType: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    roundName: {
      type: String,
      required: true,
    },
    brackets: {
      type: String,
      default: "winners",
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    ],
    matches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentMatch",
      },
    ],
    winners: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("tournamentRound", roundSchema);
