const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required : true,
    },
    roundID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournamentRound",
      required : true,
    },
    formatID: {
      type: mongoose.Schema.Types.ObjectId,
      required : true,
      default : null,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
      default: 'team',
    },
    name: { 
      type: String,
      required: true,
    },
    bracket : {
      type : String,
      default : 'winners',
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    matchA: {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'tournamentMatch',
      default: null,
    },
    matchB: {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'tournamentMatch',
      default: null,
    },
    scoreA: {
      type: String,
      default: 0,
    },
    scoreB: {
      type: String,
      default: 0,
    },
    dateOfPlay: {
      type: Date,
      default : null,
    },
    timing: {
      type: Date,
      default : null,
    },
    venueID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentVenue",
      default: null,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    nextMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "tournamentMatch",
      default: null,
    },
    status : {
      type : Boolean,
      default : true
    },
    refreeName:{
      type:String,
      default:null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("tournamentMatch", matchSchema);
