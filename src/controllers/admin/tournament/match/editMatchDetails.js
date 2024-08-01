const Match = require("../../../../models/tournamentMatch.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const Venue = require("../../../../models/tournamentVenue.js");
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

    if (findMatch.venueID !== null) {
      const findUpdatedVenue = await Venue.findById(findMatch.venueID);

      if (_.isEmpty(findUpdatedVenue)) {
        return res
          .status(400)
          .json(
            failed_response(
              400,
              "updated venue not found",
              { message: "updated venue not found" },
              false
            )
          );
      }

      const matchsIds = findUpdatedVenue.matches.filter(
        (div) => div.toString() !== matchId
      );

      findUpdatedVenue.matches = matchsIds;
      await findUpdatedVenue.save();
    }

    const findVenue = await Venue.findById(venueId);

    if (_.isEmpty(findVenue)) {
      return res.status(400).json(
        failed_response(
          400,
          "venue not found",
          {
            message: "venue not found",
          },
          false
        )
      );
    }

    findVenue.matches.push(matchId);
    await findVenue.save();

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
          { match: updateMatch, venue: findVenue },
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
