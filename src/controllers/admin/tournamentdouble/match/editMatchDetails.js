const Match = require("../../../../models/tournamentMatch.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");
const editMatchDetails = catchAsync(async (req, res) => {
  try {
    const { matchId } = req.params;
    const { date, time, venueId, refreeName } = req.body;

    if (_.isEmpty(matchId)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "match id is required",
            { message: "match id is required" },
            false
          )
        );
    }

    const findMatch = await Match.findById(matchId);

    if (_.isEmpty(findMatch)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "match not found to update",
            { message: "match not found to update" },
            false
          )
        );
    }

    let updateMatch;

    if (!_.isEmpty(date)) {
      updateMatch = await Match.findByIdAndUpdate(
        matchId,
        { dateOfPlay: date },
        { runValidators: true, new: true }
      );
    }

    if (!_.isEmpty(time)) {
      updateMatch = await Match.findByIdAndUpdate(
        matchId,
        { timing: time },
        { runValidators: true, new: true }
      );
    }

    if (!_.isEmpty(venueId)) {
      updateMatch = await Match.findByIdAndUpdate(
        matchId,
        { venueID: venueId },
        { runValidators: true, new: true }
      );
    }

    if (!_.isEmpty(refreeName)) {
      updateMatch = await Match.findByIdAndUpdate(
        matchId,
        { refreeName: refreeName },
        { runValidator: true, new: true }
      );
    }

    return res
      .status(201)
      .json(
        success_response(
          201,
          "match updated successfully",
          { match: updateMatch },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while updating match",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = editMatchDetails;
