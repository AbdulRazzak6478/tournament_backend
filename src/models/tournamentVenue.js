const mongoose = require("mongoose");

const tournamentVenueSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "tournament",
    },
    city: {
      type: String,
      required: true,
    },
    venueClubId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "clubOwners",
    },
    matches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tournamentMatch",
      },
    ],
    arenaId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Areana",
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Board",
    },
  },
  { timestamps: true }
);

const TournamentVenue = mongoose.model(
  "TournamentVenue",
  tournamentVenueSchema
);

module.exports = TournamentVenue;
