const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
const _ = require("lodash");

const getOverviewOfTournament = catchAsync(async (req, res) => {
  try {
    const { tournamentID } = req.params;
    if (_.isEmpty(tournamentID)) {
      res
        .status(400)
        .json(
          failed_response(
            400,
            "Something went wrong while getting tournament using tournamentID",
            { message: "tournamentID not found" },
            false
          )
        );
    }
    let tournament = await tournamentModel
      .findOne({ tournamentID: tournamentID })
      .populate(["teams", "participants"]);

    if (_.isEmpty(tournament)) {
      res
        .status(400)
        .json(
          failed_response(
            400,
            "Something went wrong while getting tournament using tournamentID",
            { message: "tournament not found " },
            false
          )
        );
    }
    let participants =
      tournament?.gameType === "team"
        ? tournament?.teams
        : tournament?.participants;
    participants = participants?.map((participant) => {
      return {
        id: participant?._id?.toString(),
        gameType: tournament?.gameType,
        name: participant?.name,
        addedDate: participant?.createdAt,
      };
    });
    const formatObj = {
      knockout: "Knockout",
      double_elimination_bracket: "Double Elimination Bracket",
      round_robbin: "Round Robbin",
    };
    const tournamentDetails = {
      id: tournament?._id?.toString(),
      tournamentID: tournament?.tournamentID,
      tournamentName: tournament?.tournamentName,
      mainCategoryName: tournament?.mainCategoryName,
      mainCategoryID: tournament?.mainCategoryID,
      subCategoryName: tournament?.subCategoryName,
      subCategoryID: tournament?.subCategoryID,
      sportName: tournament?.sportName,
      format: formatObj[tournament?.formatName],
      formatID : tournament?.formatID,
      fixingType: tournament?.fixingType,
      BannerImg: tournament?.BannerImg,
      description: tournament?.description,
      tournamentType:
        tournament?.gameType === "team" ? "Team Match" : "Individual",
      participants:
        tournament?.gameType === "team"
          ? tournament?.totalTeams
          : tournament?.totalParticipants,
      startDate: tournament?.startDate,
      endDate: tournament?.endDate,
      status : tournament?.status,
    };
    let venues = [];
    let responsePayload = {
      tournamentDetails: tournamentDetails,
      venues: venues,
      listName: tournament?.gameType === "team" ? "Teams" : "Players",
      participants: participants,
    };
    return res
      .status(200)
      .json(
        success_response(
          200,
          "Successfully getting tournament using tournamentID ",
          responsePayload,
          true
        )
      );
  } catch (err) {
    res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while getting tournament using tournamentID",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = getOverviewOfTournament;
