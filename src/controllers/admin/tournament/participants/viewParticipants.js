const Team = require("../../../../models/tournamentTeam.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const _ = require("lodash");
const viewTeam = catchAsync(async (req, res) => {
  try {
    const { teamId } = req.params;

    if (_.isEmpty(teamId)) {
      return res.status(400).json(
        failed_response(
          400,
          "team id is required",
          {
            message: "team id is required",
          },
          false
        )
      );
    }

    const findTeam = await Team.findById(teamId).populate("players");

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

    return res
      .status(200)
      .json(
        success_response(
          200,
          "fetcing specific team details",
          { team: findTeam },
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while fetching specific team details",
          { message: error.message },
          false
        )
      );
  }
});

module.exports = viewTeam;
