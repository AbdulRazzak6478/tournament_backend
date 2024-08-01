const Venue = require("../../../../models/tournamentVenue.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");
const Tournament = require("../../../../models/tournament.js");

const getVenues = catchAsync(async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (_.isEmpty(tournamentId)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "tournament id is required to fetch venues",
            { message: "tournament id is required" },
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
            "tournament not found to the id which you have sent",
            { message: "tournament not found" },
            false
          )
        );
    }

    let findVenues = await Venue.find({ tournamentId: findTournament._id })
      .populate("venueClubId")
      .populate("arenaId")
      .populate("boardId");

    if (_.isEmpty(findVenues)) {
      findVenues = [];
    }

    const venueArr = findVenues.map((div) => {
      return {
        _id: div?._id,
        tournamentId: div?.tournamentId,
        city: div?.city,
        venueClubId: div?.venueClubId?._id,
        venueName: div?.venueClubId?.ClubName,
        clubLocation: div?.venueClubId?.location_operating,
        createdAt: div?.createdAt,
        updatedAt: div?.updatedAt,
        arenaId: div?.arenaId?._id,
        arenaName: div?.arenaId?.Areana_name,
        boardId: div?.boardId?._id,
        boardName: div?.boardId?.Name,
      };
    });

    return res
      .status(200)
      .json(
        success_response(
          200,
          "fetching venues for tournaments successfully",
          { venues: venueArr, length: venueArr.length },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to fetch tournament venues",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = getVenues;
