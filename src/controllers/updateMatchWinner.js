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
    const currentRound = await roundModel.findById(match?.roundID);
    match.scoreA = data.scoreA;
    match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save();
    console.log("after update match : ", updatedMatch);

    //scheduling next round matches
    

    // handling if it is final round
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
      let nextRound = await roundModel.findById(nextMatchDetails?.roundID);
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
    }
    SuccessResponse.data = {
      updatedMatch,
    };
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
