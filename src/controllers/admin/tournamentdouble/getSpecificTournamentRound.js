const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentRoundModel = require("../../../models/tournamentRounds.js");
const mongoose = require("mongoose");
const _ = require("lodash");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
const getTournamentRoundsAndMatches = catchAsync(async (req, res) => {
  try {
    const { roundID } = req.params;
    if (_.isEmpty(roundID)) {
      return res
        .status(400)
        .json(failed_response(400, " roundID is required", {}, false));
    }

    if (!isValidObjectId(roundID)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass an valid roundID ", {}, false));
    }
    let roundAndMatches = await tournamentRoundModel.findOne({_id : roundID}).populate('matches');
    if(_.isEmpty(roundAndMatches)){
        roundAndMatches = null;
    }
    return res
      .status(200)
      .json(
        success_response(
          201,
          "Successfully fetching tournament rounds and matches through tournamentID ",
          roundAndMatches,
          true
        )
      );
  } catch (err) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while fetching tournament rounds and matches",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = getTournamentRoundsAndMatches;
