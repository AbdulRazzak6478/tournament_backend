const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
const tournamentKnockoutFormat = require("../../../models/tournamentKnockoutFormat.js");
const tournamentRoundsModel = require("../../../models/tournamentRounds.js");
const tournamentMatchModel = require("../../../models/tournamentMatch.js");
const tournamentTeamModel = require("../../../models/tournamentTeam.js");
const tournamentPlayerModel = require("../../../models/tournamentPlayer.js");
const tournamentVenueModel = require("../../../models/tournamentVenue.js");
const _ = require("lodash");
const mongoose = require("mongoose");

const deleteTournamentByID = catchAsync(async (req, res) => {
    const session = await mongoose.startSession();
  try {
    const { tournamentID } = req.params;
    if (_.isEmpty(tournamentID)) {
      return res
        .status(400)
        .json(failed_response(400, " tournamentID is required", {}, false));
    }
    session.startTransaction();
    let tournament = await tournamentModel.findOne({tournamentID : tournamentID}).session(session);
    console.log('tournament : ',tournament);
    if(_.isEmpty(tournament)){
        return res
        .status(400)
        .json(failed_response(400, "tournament not found to delete", {}, false));
    }
    let deletedFormat = null;
    if(tournament?.formatName === 'knockout'){
        deletedFormat = await tournamentKnockoutFormat.findByIdAndDelete(tournament?.formatID?.toString()).session(session);
    }
    let deletedRounds = await tournamentRoundsModel.deleteMany({tournamentID : tournament?._id?.toString()}).session(session);
    let deletedMatches = await tournamentMatchModel.deleteMany({tournamentID : tournament?._id?.toString()}).session(session);
    let deletedParticipants = [];
    if(tournament?.gameType === 'team'){
        deletedParticipants = await tournamentTeamModel.deleteMany({tournamentID : tournament?._id?.toString()}).session(session);
    }
    if(tournament?.gameType === 'individual'){

        deletedParticipants = await tournamentPlayerModel.deleteMany({tournamentID : tournament?._id?.toString()}).session(session);
    }
    let deletedVenues = await tournamentVenueModel.deleteMany({tournamentId : tournament?._id?.toString()}).session(session);
    
    let deletedTournament = await tournamentModel.findByIdAndDelete(tournament?._id?.toString()).session(session);

    // console.log('deleted : ',deletedFormat);
    // console.log('deleted : ',deletedRounds);
    // console.log('deleted : ',deletedMatches);
    // console.log('deleted : ',deletedParticipants);
    // console.log('deleted : ',deletedVenues);
    // console.log('deleted : ',deletedTournament);
    let responsePayload = {
        deletedTournament,
        deletedFormat,
        deletedRounds,
        deletedMatches,
        deletedParticipants,
        deletedVenues
    }
    await session.commitTransaction();
    await session.endSession();
    return res
      .status(200)
      .json(
        success_response(
          201,
          "Successfully deleting tournament ",
          responsePayload,
          true
        )
      );
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while deleting tournament ",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = deleteTournamentByID;
