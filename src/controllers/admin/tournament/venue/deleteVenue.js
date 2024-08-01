const Venue = require("../../../../models/tournamentVenue.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const Tournament = require("../../../../models/tournament.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");

const deleteVenue = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;

    if (_.isEmpty(id)) {
      return res.status(400).json(
        failed_response(
          400,
          "id is required to delete venue",
          {
            message: "id is required",
          },
          false
        )
      );
    }

    const findVenue = await Venue.findById(id);

    if (_.isEmpty(findVenue)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "venue not found for the id which is sent",
            { message: "venue not found" },
            false
          )
        );
    }

    const findTournament = await Tournament.findById(findVenue.tournamentId);

    if (_.isEmpty(findTournament)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "tournament not found",
            { message: "tournament not found" },
            false
          )
        );
    }

    const newVenues = findTournament?.venues?.filter(
      (div) => div.toString() !== id.toString()
    );
    console.log(newVenues, "NEW ");
    findTournament.venues = newVenues;
    await findTournament.save();

    const deleteVenueById = await Venue.findByIdAndDelete(id);

    return res
      .status(200)
      .json(
        success_response(
          200,
          "venue deleted successfully",
          { venue: deleteVenueById },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to delete venue",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = deleteVenue;
