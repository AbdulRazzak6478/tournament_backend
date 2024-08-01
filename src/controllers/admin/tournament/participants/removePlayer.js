const Players = require("../../../../models/tournamentPlayer.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const _ = require("lodash");
const Team = require("../../../../models/tournamentTeam.js");
const removePlayer = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;

    if (_.isEmpty(id)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "player id is required",
            { message: "player id is required" },
            false
          )
        );
    }

    const findPlayer = await Players.findById(id);

    if (_.isEmpty(findPlayer)) {
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

    const findTeam = await Team.findById(findPlayer.teamID);

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

    const playerArr = findTeam.players.filter((div) => div.toString() !== id);
    findTeam.players = playerArr;
    await findTeam.save();

    const deletePlayer = await Players.findByIdAndDelete(id);

    return res
      .status(201)
      .json(
        success_response(
          201,
          "player deleted successfully",
          { player: deletePlayer },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "error in deleting player",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = removePlayer;
