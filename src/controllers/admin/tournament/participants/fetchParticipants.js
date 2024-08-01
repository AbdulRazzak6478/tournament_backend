const Teams = require("../../../../models/tournamentTeam.js");
const Players = require("../../../../models/tournamentPlayer.js");
const Tournament = require("../../../../models/tournament.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");

const getParticipants = catchAsync(async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const findTournament = await Tournament.findOne({
      tournamentID: tournamentId,
    });

    if (_.isEmpty(findTournament)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "tournament is not found",
            { message: "tournament is not found" },
            false
          )
        );
    }

    let findParticipants;

    if (findTournament.gameType.toLowerCase() === "team") {
      findParticipants = await Teams.find({ tournamentID: findTournament._id });
    } else {
      findParticipants = await Players.find({ tournamentID: findTournament._id });
    }

    if (_.isEmpty(findParticipants)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "Participants not found",
            { message: "Participants not found" },
            false
          )
        );
    }

    return res.status(200).json(
      success_response(
        200,
        "fetching participants successfully",
        {
          participants: findParticipants,
          selectionType: findTournament.gameType,
        },
        true
      )
    );
  } catch (err) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while fetching participants ",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = getParticipants;
