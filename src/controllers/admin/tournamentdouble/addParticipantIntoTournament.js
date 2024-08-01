const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
// const mongoose = require("mongoose");
const _ = require("lodash");
const addParticipantInKnockoutFormatAndReArrangeTournament = require("./knockout/addParticipantIntoKnockout.js");

// to validate ObjectId()
// function isValidObjectId(id) {
//   return mongoose.Types.ObjectId.isValid(id);
// }
const addParticipantIntoTournament = catchAsync(async (req, res) => {
  try {
    const { tournamentID } = req.params;
    const { participantName } = req.body;
    if (_.isEmpty(tournamentID)) {
      return res
        .status(400)
        .json(failed_response(400, "tournamentID is required", {}, false));
    }
    if (_.isEmpty(participantName)) {
      return res
        .status(400)
        .json(failed_response(400, "participantName is required", {}, false));
    }
    let tournamentDetails = await tournamentModel.findOne({
      tournamentID: tournamentID,
    });
    if (_.isEmpty(tournamentDetails)) {
      return res
        .status(400)
        .json(failed_response(400, "tournament not found", {}, false));
    }
    
    let responseData = {};
    if (tournamentDetails?.formatName?.toLowerCase() === "knockout") {
      responseData = await addParticipantInKnockoutFormatAndReArrangeTournament(tournamentDetails,participantName);
    }
    if (tournamentDetails?.formatName?.toLowerCase() === "double_elimination_bracket") {
      responseData = {
        message: "work in progress for double_elimination_bracket",
      };
    }
    if (tournamentDetails?.formatName?.toLowerCase() === "round_robbin") {
      responseData = {
        message: "work in progress for round_robbin",
      };
    }
    return res
      .status(200)
      .json(
        success_response(
          201,
          "Successfully added Participant into the tournament",
          responseData,
          true
        )
      );
  } catch (err) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while adding Participant into the tournament",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = addParticipantIntoTournament;
