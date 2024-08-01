const catchAsync = require("../../../../utils/catchAsync");
const _ = require("lodash");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const Venue = require("../../../../models/tournamentVenue.js");

const editVenue = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const { city, venueClubId, arenaId, boardId } = req.body;

    if (_.isEmpty(id)) {
      return res.status(
        failed_response(
          400,
          "venue id is required to update venue",
          { message: "venue id is required" },
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
            "venue not found for id which is sent",
            { message: "venue not found" },
            false
          )
        );
    }

    let updateVenue;

    if (!_.isEmpty(city)) {
      updateVenue = await Venue.findByIdAndUpdate(
        id,
        { city: city },
        { runValidators: true, new: true }
      );
    }

    if (!_.isEmpty(venueClubId)) {
      updateVenue = await Venue.findByIdAndUpdate(
        id,
        { venueClubId: venueClubId },
        { runValidators: true, new: true }
      );
    }

    if (!_.isEmpty(arenaId)) {
      updateVenue = await Venue.findByIdAndUpdate(
        id,
        { arenaId: arenaId },
        { runValidators: true, new: true }
      );
    }

    if (!_.isEmpty(boardId)) {
      updateVenue = await Venue.findByIdAndUpdate(
        id,
        { boardId: boardId },
        { runValidators: true, new: true }
      );
    }

    return res
      .status(201)
      .json(
        success_response(
          201,
          "updated the venue successfuly",
          { updateVenue },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to update venue",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = editVenue;
