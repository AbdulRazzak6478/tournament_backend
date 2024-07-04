const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const MatchesModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");

const updateMatchWinner = async (req, res) => {
  try {
    const id = req.body.matchId;
    const data = {
      scoreA: req.body.scoreA,
      scoreB: req.body.scoreB,
      winner: req.body.winnerId,
    };
    console.log("update winner data : ", data);
    const match = await MatchesModel.findById(id);
    console.log("before update match : ", match);
    match.scoreA = data.scoreA;
    match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save();
    console.log("after update match : ", updatedMatch);
    let currentRound = await roundModel
      .findById(updatedMatch?.roundID)
      .populate("matches");
    const exist = currentRound.winners?.filter(
      (teamId) => teamId.toString() === updatedMatch?.winner.toString()
    );
    if (exist.length === 0) {
      currentRound.winners.push(updatedMatch?.winner.toString());
      currentRound = await currentRound.save();
    }
    //scheduling next round matches

    // const currentRound = await roundModel.findById(match?.roundID).populate("matches")
    let nextRoundDetails = {};
    let isRoundCompleted = true;
    currentRound?.matches?.forEach((match) => {
      if (!match?.winner) {
        isRoundCompleted = false;
      }
    });
    if (isRoundCompleted) {
      currentRound.isCompleted = true;
      currentRound = await currentRound.save();
      // handling if it is final round or next out of round
      nextRoundDetails = await roundModel
        .findOne({
          roundNumber: currentRound?.roundNumber + 1,
          tournamentID: currentRound?.tournamentID,
          formatTypeID: currentRound?.formatTypeID,
        })
        .populate("matches");
      console.log("next round details : ", nextRoundDetails);
      if (!nextRoundDetails) {
        nextRoundDetails = nextRoundDetails;
      } else {
        let teams = nextRoundDetails?.teams.length;
        let matches = nextRoundDetails?.matches;
        if (teams % 2 !== 0) {
          let nextMatchId = nextRoundDetails?.matches[0]?.nextMatch?.toString();
          console.log("next match id ", nextMatchId);
          const lastIndex = nextRoundDetails?.matches.length;
          console.log(
            "last match id : ",
            nextRoundDetails?.matches[lastIndex - 1]?._id?.toString()
          );
          nextRoundDetails.matches[0].nextMatch =
            nextRoundDetails?.matches[lastIndex - 1]?._id?.toString();
          nextRoundDetails.matches[lastIndex - 1].nextMatch = nextMatchId;
          await nextRoundDetails?.matches[0].save();
          await nextRoundDetails?.matches[lastIndex - 1].save();
        }
      }
    }

    if (updatedMatch?.nextMatch) {
      let nextMatchDetails = await MatchesModel.findById(
        updatedMatch?.nextMatch.toString()
      );
      console.log("next match details : ", nextMatchDetails);
      if (nextMatchDetails.teamA) {
        if (nextMatchDetails.teamB) {
          nextMatchDetails.teamB = updatedMatch.winner;
        } else {
          nextMatchDetails.teamB = updatedMatch.winner;
        }
      } else {
        nextMatchDetails.teamA = updatedMatch.winner;
      }
      nextMatchDetails = await nextMatchDetails.save();
      let nextRound = await roundModel
        .findById(nextMatchDetails?.roundID)
        .populate("matches");
      if (currentRound?._id?.toString() !== nextRound?._id?.toString()) {
        let exist = nextRound.teams?.filter(
          (teamId) => teamId.toString() === updatedMatch?.winner.toString()
        );
        if (exist.length === 0) {
          nextRound.teams.push(updatedMatch?.winner).toString();
        }
      }
      nextRound = await nextRound.save();
      SuccessResponse.data = {
        updatedMatch,
        nextMatchDetails,
        nextRound,
      };
    } else {
      SuccessResponse.data = {
        updatedMatch,
      };
    }
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    console.log("error in updateWinner controller");
    ErrorResponse.error = new AppError(
      `error in updateWinner controller : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  updateMatchWinner,
};
