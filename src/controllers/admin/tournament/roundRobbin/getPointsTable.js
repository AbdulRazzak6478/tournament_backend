const catchAsync = require("../../../../utils/catchAsync");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentPointsTableModel = require("../../../../models/tournamentPointTable");
const _ = require("lodash");
const getPointsTableOfParticipants = catchAsync(async (req, res) => {
  try {
    const { tournamentID } = req.params;
    if (_.isEmpty(tournamentID)) {
      return res
        .status(400)
        .json(failed_response(400, "tournamentID not found", {}, false));
    }

    let tournamentDetails = await tournamentModel.findOne({ tournamentID });
    if (_.isEmpty(tournamentDetails)) {
      return res
        .status(400)
        .json(failed_response(400, "tournament not found", {}, false));
    }
    let participantsData = [];
    if (tournamentDetails?.gameType === "team") {
      participantsData = await tournamentTeamModel.find(
        { tournamentID: tournamentDetails?._id },
        { name: 1 }
      );
    } else {
      participantsData = await tournamentPlayerModel.find(
        { tournamentID: tournamentDetails?._id },
        { name: 1 }
      );
    }
    if (_.isEmpty(participantsData)) {
      return res
        .status(400)
        .json(failed_response(400, "Participants not found", {}, false));
    }

    const participantsMap = new Map();
    participantsData.map((participant) => {
      participantsMap.set(participant?._id?.toString(), participant?.name);
    });

    let tournamentPointsTable = await tournamentPointsTableModel
      .find({ tournamentID : tournamentDetails?._id })
      .sort({ points: "desc" });
    if (_.isEmpty(tournamentPointsTable)) {
      return res
        .status(400)
        .json(failed_response(400, "points table not found", {}, false));
    }

    tournamentPointsTable = tournamentPointsTable?.map((record) => {
      return {
        id: record?._id?.toString(),
        participantID: record?.participantID?.toString(),
        participantName:
          participantsMap.get(record?.participantID?.toString()) || "",
        points: record?.points,
        plays: record?.plays,
        wins: record?.wins,
        losses: record?.losses,
        draws: record?.draws,
      };
    });

    const responsePayload = {
      pointsTable: tournamentPointsTable,
    };
    return res
      .status(200)
      .json(
        success_response(
          200,
          "Successfully fetched Points Table",
          responsePayload,
          true
        )
      );
  } catch (error) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something Went Wrong while fetching Points Table",
          { message: error?.message },
          false
        )
      );
  }
});

module.exports = getPointsTableOfParticipants;
