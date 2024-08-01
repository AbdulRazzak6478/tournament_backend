const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
const _ = require("lodash");

const recoverArchiveTournament = catchAsync(async (req, res) => {
  try {
    const { tournamentID } = req.params;
    if (_.isEmpty(tournamentID)) {
      return res
        .status(400)
        .json(failed_response(400, " tournamentID is required", {}, false));
    }
    let tournament = await tournamentModel
      .findOne({ tournamentID: tournamentID ,isDeleted : true})
    console.log("tournament : ", tournament);
    if (_.isEmpty(tournament)) {
      return res
        .status(400)
        .json(
          failed_response(400, "tournament not found to recover", {}, false)
        );
    }
    //soft deleting
    tournament.isDeleted = false;
    tournament.deleteRemark = "";
    tournament = await tournament.save();

    return res
      .status(200)
      .json(
        success_response(
          200,
          "Successfully recover tournament ",
          tournament,
          true
        )
      );
  } catch (err) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while recovering tournament ",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = recoverArchiveTournament;
