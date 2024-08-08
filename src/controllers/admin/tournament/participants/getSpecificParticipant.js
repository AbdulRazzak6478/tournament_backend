const Team = require("../../../../models/tournamentTeam.js");
const Player = require("../../../../models/tournamentPlayer.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const _ = require("lodash");
const getSpecificParticipant = catchAsync(async (req, res) => {
  try {
    const { participantId, selectionType } = req.params;

    if (_.isEmpty(participantId)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "participant id is required",
            { message: "participant id is required" },
            false
          )
        );
    }

    if (_.isEmpty(selectionType)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "selection type is required",
            { message: "selection type is required" },
            false
          )
        );
    }

    let findParticipant;

    if (selectionType.toLowerCase() === "team") {
      findParticipant = await Team.findById(participantId).populate("players");

      if (_.isEmpty(findParticipant)) {
        return res.status(400).json(
          failed_response(
            400,
            "team not found",
            {
              message: "team not found",
            },
            false
          )
        );
      }
    } else if (selectionType.toLowerCase() === "individual") {
      findParticipant = await Player.findById(participantId);

      if (_.isEmpty(findParticipant)) {
        return res
          .status(400)
          .json(
            failed_response(
              400,
              "player not found",
              { message: "player not found" },
              false
            )
          );
      }
    } else {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "selection type must team or individual",
            { message: "enter a valid selection type" },
            false
          )
        );
    }

    return res.status(200).json(
      success_response(
        200,
        "fetching specific participants",
        {
          participants: findParticipant,
        },
        true
      )
    );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "failed to fetch specific participant details",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = getSpecificParticipant;
