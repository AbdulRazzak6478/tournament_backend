const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
const _ = require("lodash");

const getTournamentsBasedOnStatus = catchAsync(async (req, res) => {
  try {
    const { status } = req.params;
    const statusContainer = ["ongoing", "upcoming", "completed"];
    if (!statusContainer.includes(status.toLowerCase())) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "status should be anyone from this only ['ongoing','upcoming','completed']",
            {},
            false
          )
        );
    }

    let today_Date = new Date();

    let tournaments = [];
    if (status === "completed") {
      tournaments = await tournamentModel.find({
        startDate: { $lte: today_Date },
        endDate: { $lte: today_Date },
      });
    }
    if (status === "ongoing") {
      tournaments = await tournamentModel.find({
        startDate: { $lte: today_Date },
        endDate: { $gte: today_Date },
      });
    }
    if (status === "upcoming") {
      tournaments = await tournamentModel.find({});
      if (_.isEmpty(tournaments)) {
        tournaments = [];
      } else {
        tournaments = tournaments?.filter((tournament) => {
          if (
            tournament?.startDate >= today_Date &&
            tournament?.endDate > today_Date
          ) {
            return tournament;
          }
          if (tournament?.startDate === null && tournament?.endDate === null) {
            return tournament;
          }
        });
      }
    }
    if (_.isEmpty(tournaments)) {
      tournaments = [];
    }
    tournaments.sort((a, b) => b?.createdAt - a?.createdAt);
    const tournamentsStatusObject = tournaments?.map((tournament) => {
      const gameParticipants =
        tournament?.gameType === "team"
          ? tournament?.totalTeams
          : tournament?.totalParticipants;
      const statusObj = {
        ongoing: "Active",
        upcoming: "Pending",
        completed: "Completed",
      };
      const formatObj = {
        knockout: "Knockout",
        double_elimination_bracket: "Double Elimination Bracket",
        round_robbin: "Round Robbin",
      };
      const responseObject = {
        id : tournament?._id?.toString(),
        tournamentID: tournament?.tournamentID,
        title: tournament?.tournamentName,
        venue: "no venue",
        category: {
          mainCategory: tournament?.mainCategoryName,
          subCategory: tournament?.subCategoryName,
          sportName: tournament?.sportName,
        },
        tournamentType: formatObj[tournament?.formatName],
        participants: gameParticipants,
        duration: {
          start: tournament?.startDate,
          end: tournament?.endDate,
        },
        status: statusObj[status],
        tournamentStatus : tournament?.status,
      };
      return responseObject;
    });
    const tournamentPayload = {
      status: status,
      length: tournamentsStatusObject.length,
      tournaments: tournamentsStatusObject,
    };
    return res
      .status(200)
      .json(
        success_response(
          200,
          "Successfully fetching tournament using status ",
          tournamentPayload,
          true
        )
      );
  } catch (err) {
    res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while fetching tournament using status",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = getTournamentsBasedOnStatus;
