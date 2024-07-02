const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const MatchesModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");



const updateMatchWinner = async (req, res) => {
  try {
    const id = req.body.matchId;
    const data = {
        scoreA : req.body.scoreA,
        scoreB : req.body.scoreB,
        winner : req.body.winnerId
    }
    console.log('update winner data : ',data);
    const match = await MatchesModel.findById(id);
    console.log('before update match : ',match);
    match.scoreA = data.scoreA;
    match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save();
    console.log('after update match : ',updatedMatch);
    let nextMatchDetails = await MatchesModel.findById(updatedMatch?.nextMatch.toString());
    console.log('next match details : ',nextMatchDetails);
    if(nextMatchDetails.teamA){
        if(nextMatchDetails.teamB){
            nextMatchDetails.teamB = updatedMatch.winner;
        }
        else{
            nextMatchDetails.teamB = updatedMatch.winner;
        }
    }
    else{
        nextMatchDetails.teamA = updatedMatch.winner;
    }
    nextMatchDetails = await nextMatchDetails.save();
    SuccessResponse.data = {
        updatedMatch,
        nextMatchDetails
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
    updateMatchWinner
};
