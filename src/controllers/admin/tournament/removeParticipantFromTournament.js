const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const removeParticipantInKnockoutFormatAndReArrangeTournament = require("./knockout/removeParticipantFromKnockout.js");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const removeParticipantFromTournament = catchAsync(async (req, res) => {
  try {
    const { tournamentID } = req.params;
    const { participantId } = req.body;
    if (_.isEmpty(tournamentID)) {
      return res
        .status(400)
        .json(failed_response(400, "tournamentID is required", {}, false));
    }
    if (_.isEmpty(participantId)) {
      return res
        .status(400)
        .json(failed_response(400, "participantId is required", {}, false));
    }
    if (!isValidObjectId(participantId)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass a valid participantId", {}, false));
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
      responseData = await removeParticipantInKnockoutFormatAndReArrangeTournament(tournamentDetails,participantId);
    //     responseData = {
    //     message: "work in progress for knockout section",
    //   };
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
          "Successfully remove Participant from the tournament",
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
          "Something went wrong while removing Participant from the tournament",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = removeParticipantFromTournament;
