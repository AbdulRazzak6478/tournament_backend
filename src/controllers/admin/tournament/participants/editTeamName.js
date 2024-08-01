const Team = require("../../../../models/tournamentTeam.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");
const Player = require("../../../../models/tournamentPlayer.js");
const editTeamName = catchAsync(async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, selectionType } = req.body;

    if (_.isEmpty(teamId)) {
      return res
        .status(400)
        .json(
          400,
          "team id is required",
          { message: "team id is required" },
          false
        );
    }

    if (_.isEmpty(teamName)) {
      return res
        .status(400)
        .json(
          400,
          "team name is required",
          { message: "team name is required" },
          false
        );
    }

    if (_.isEmpty(selectionType)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "Selection type is required, team or individual",
            { message: "Selection type is required" },
            false
          )
        );
    }

    if (selectionType.toLowerCase() === "team") {
      const findTeam = await Team.findById(teamId);

      if (_.isEmpty(findTeam)) {
        return res
          .status(400)
          .json(
            failed_response(
              400,
              "team not found",
              { message: "team not found" },
              false
            )
          );
      }

      findTeam.name = teamName;

      await findTeam.save();

      return res
        .status(201)
        .json(
          success_response(
            201,
            "team name updated successfully",
            { participant: findTeam },
            true
          )
        );
    } else if (selectionType.toLowerCase() === "individual") {
      const findPlayer = await Player.findById(teamId);

      if (_.isEmpty(findPlayer)) {
        return res
          .status(400)
          .json(
            failed_response(
              400,
              "Player not found",
              { message: "Player not found" },
              false
            )
          );
      }

      findPlayer.name = teamName;

      await findPlayer.save();

      return res
        .status(200)
        .json(
          success_response(
            200,
            "player name updated successfully",
            { participant: findPlayer },
            true
          )
        );
    }
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while updating participant name",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = editTeamName;
