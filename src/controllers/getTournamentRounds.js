const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const MatchesModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");

const getTournamentRounds = async (req, res) => {
  try {
    const data = {
      tournamentID: req.body.tournamentID,
      formatTypeID: req.body.formatTypeID,
    };
    const rounds = await roundModel.find(data).populate("matches");
    console.log("all rounds data : ", rounds);
    SuccessResponse.data = rounds;
    return res.status(200).json(SuccessResponse);
  } catch (error) {
    console.log("error in getting rounds controller");
    ErrorResponse.error = new AppError(
      `error in getting rounds controller : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};
const getRoundById = async (req, res) => {
  try {
    const id = req.params.roundId;
    let rounds = await roundModel.findById(id).populate("matches");

    // scheduling next round matches if all matches completed

    let nextRoundDetails = {};
    let isRoundCompleted = true;
    rounds?.matches?.forEach((match) => {
      if (!match?.winner) {
        isRoundCompleted = false;
      }
    });
    if (isRoundCompleted) {
      rounds.isCompleted = true;
      rounds = await rounds.save();
      nextRoundDetails = await roundModel.findOne({
        roundNumber: rounds?.roundNumber + 1,
        tournamentID: rounds?.tournamentID,
        formatTypeID: rounds?.formatTypeID,
      }).populate('matches');
      console.log('next round details : ',nextRoundDetails);
      if(nextRoundDetails.length){
        
      }
      let teams = nextRoundDetails?.teams;
      let matches = nextRoundDetails?.matches;
      if (teams % 2 !== 0) {
        let nextMatchId = nextRoundDetails?.matches[0]?.nextMatch.toString();
        const lastIndex = nextRoundDetails?.matches.length;
        nextRoundDetails.matches[0].nextMatch =
        nextRoundDetails?.matches[lastIndex - 1]?._id?.toString();
        nextRoundDetails.matches[lastIndex - 1].nextMatch = nextMatchId;
        await nextRoundDetails?.matches[0].save();
        await nextRoundDetails?.matches[lastIndex - 1].save();
      }
    }

    SuccessResponse.data = {
        rounds,
        nextRoundDetails
    };
    return res.status(200).json(SuccessResponse);
  } catch (error) {
    console.log("error in getting rounds controller");
    ErrorResponse.error = new AppError(
      `error in getting rounds controller : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  getTournamentRounds,
  getRoundById,
};
