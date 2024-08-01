const Venue = require("../../../../models/tournamentVenue.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");
const Tournament = require("../../../../models/tournament.js");
const createVenue = catchAsync(async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { city, venueClubId, arenaId, boardId } = req.body;

    if (_.isEmpty(tournamentId)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "tournament id is requried",
            { message: "tournament id is required" },
            false
          )
        );
    }

    if (_.isEmpty(city)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "city  is requried",
            { message: "city is required" },
            false
          )
        );
    }

    if (_.isEmpty(venueClubId)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "Venue is requried",
            { message: "Venue is required" },
            false
          )
        );
    }

    const findTournament = await Tournament.findOne({
      tournamentID: tournamentId,
    });

    if (_.isEmpty(findTournament)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "tournament not found",
            { message: "tournament is not found" },
            false
          )
        );
    }

    let newVenue = new Venue({
      tournamentId: findTournament._id,
      venueClubId: venueClubId,
      city: city,
      arenaId: arenaId !== "" ? arenaId : null,
      boardId: boardId !== "" ? boardId : null,
    });

    let savedVenue = await newVenue.save();

    findTournament.venues.push(savedVenue._id);
    await findTournament.save();

    return res
      .status(201)
      .json(
        success_response(
          201,
          "venue created successfully",
          { venue: savedVenue },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to create venue",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = createVenue;
