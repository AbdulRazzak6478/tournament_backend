const Venue = require("../../../../models/tournamentVenue.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const _ = require("lodash");
const getSpecificVenue = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;

    if (_.isEmpty(id)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "id is required to fetch specific venue",
            { message: "id is required" },
            false
          )
        );
    }

    const findVenue = await Venue.findById(id).populate(['venueClubId','arenaId','boardId']);


    if (!findVenue) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "venue not found for id which you have sent",
            { message: "venue not found" },
            false
          )
        );
    }
    const responsePayload = {
      venueID : findVenue?._id?.toString(),
      city : findVenue?.city,
      clubID : findVenue?.venueClubId?._id?.toString(),
      clubName : findVenue?.venueClubId?.ClubName,
      ArenaID : findVenue?.arenaId?._id?.toString(),
      ArenaName : findVenue?.arenaId?.Areana_name,
      boardID : findVenue?.boardId?._id?.toString(),
      boardName : findVenue?.boardId?.Name
    }

    return res
      .status(200)
      .json(
        success_response(
          200,
          "fetched venue successfuly",
          { venue: responsePayload },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to fetch specific venue",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = getSpecificVenue;
