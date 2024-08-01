const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    tournamentID: {
      type: String,
      required: true,
    },
    tournamentName: {
      type: String,
      default: "NO NAME",
    },
    mainCategoryID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: null,
    },
    mainCategoryName: {
      type: String,
      required: true,
      default: null,
    },
    subCategoryID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: null,
    },
    subCategoryName: {
      type: String,
      required: true,
      default: null,
    },
    sportName: {
      type: String,
      required: true,
      default: null,
    },
    formatID: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    formatName: {
      type: String,
      // enum: ["knockout", "double knockout", "round robin"],
      required: true,
      // default: "knockout",
    },
    fixingType: {
      type: String,
      enum: ["sequential", "random", "top_vs_bottom", "manual", "seeding"],
      required: true,
    },
    gameType: {
      type: String,
      enum: ["team", "individual"],
      default: "individual",
    },
    BannerImg: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    // totalRounds: {
    //   type: Number,
    // },
    // roundNames: [
    //   {
    //     type: String,
    //   },
    // ],
    totalTeams: {
      type: Number,
      default: null,
    },
    totalParticipants: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentTeam",
        default: null,
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentPlayer",
        default: null,
      },
    ],
    venues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "venue",
        default: null,
      },
    ],
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentPlayer",
        default: null,
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "COMPLETED"],
      default: "PENDING",
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    deleteRemark: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("tournament", tournamentSchema);
