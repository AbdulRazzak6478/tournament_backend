const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const tournamentRoundModel = require("../../../../models/tournamentRounds.js");
const tournamentTeamModel = require("../../../../models/tournamentTeam.js");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer.js");

const mongoose = require("mongoose");
const _ = require("lodash");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const getParticipants = async (gameType, participantsIds) => {
  try {
    let participantsDetails = [];
    if (gameType === "team") {
      participantsDetails = await tournamentTeamModel.find(
        { _id: participantsIds },
        { name: 1 }
      );
    } else if (gameType === "individual") {
      participantsDetails = await tournamentPlayerModel.find(
        { _id: participantsIds },
        { name: 1 }
      );
    }
    if (_.isEmpty(participantsDetails)) {
      participantsDetails = [];
    } else {
      participantsDetails = participantsDetails?.map((participant) => {
        return {
          id: participant?._id?.toString(),
          name: participant?.name,
        };
      });
    }
    return participantsDetails;
  } catch (error) {
    throw new Error(
      " => Error in getting details of participants " + error?.message
    );
  }
};
const gettingRoundMatchesForManualFixing = catchAsync(async (req, res) => {
  try {
    const { roundID } = req.params;
    if (_.isEmpty(roundID)) {
      return res
        .status(400)
        .json(failed_response(400, " roundID is required", {}, false));
    }
    if (!isValidObjectId(roundID)) {
      return res
        .status(400)
        .json(
          failed_response(400, "Pass an valid roundID into params", {}, false)
        );
    }
    let roundData = await tournamentRoundModel
      .findOne({ _id: roundID })
      .populate(["matches"]);
    if (_.isEmpty(roundData)) {
      return res
        .status(400)
        .json(failed_response(400, "not able to find the round", {}, false));
    }
    if (roundData?.winners.length > 0) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "Winner is declared in the round , cannot arrange participants",
            {},
            false
          )
        );
    }
    if (roundData?.roundNumber > 1) {
      let previousRound = await tournamentRoundModel
        .findOne({
          roundNumber: roundData?.roundNumber - 1,
          tournamentID: roundData?.tournamentID,
        })
        .populate(["matches"]);
      if (_.isEmpty(previousRound)) {
        previousRound = null;
      }
      if (!previousRound?.isCompleted) {
        return res
          .status(400)
          .json(
            failed_response(
              400,
              "Previous round not completed to arrange participants into " +
                roundData?.roundName,
              {},
              false
            )
          );
      }
    }
    const participants = await getParticipants(
      roundData?.gameType,
      roundData?.participants
    );
    const newMap = new Map();
    participants.forEach((participant) => {
      newMap.set(participant?.id, participant.name);
    });
    const roundMatches = roundData?.matches.map((match) => {
      const teamA = newMap.get(match?.teamA?.toString());
      const teamB = newMap.get(match?.teamB?.toString());
      return {
        id: match?._id?.toString(),
        matchName: match?.name,
        teamA_id: match?.teamA?.toString(),
        teamB_id: match?.teamB?.toString(),
        teamA,
        teamB,
      };
    });

    let responsePayload = {
      name: roundData?.roundName,
      participantsLength: participants?.length,
      participants,
      matchesLength: roundMatches?.length,
      roundMatches,
    };

    return res
      .status(200)
      .json(
        success_response(
          201,
          "Successfully get round matches for manual Fixing",
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
          "Something went wrong while getting round matches for manual Fixing",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = gettingRoundMatchesForManualFixing;
