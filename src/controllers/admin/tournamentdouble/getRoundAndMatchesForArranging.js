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
const getRoundAndMatchesData = async (req, res) => {
  try {
    const id = req.params.roundID;
    let rounds = await roundModel.findById(id).populate("matches");

    SuccessResponse.data = {
        rounds,
        // nextRoundDetails
    };
    return res.status(200).json(SuccessResponse);
  } catch (error) {
    console.log("error in getting round data for arranging controller");
    ErrorResponse.error = new AppError(
      `error in getting arranging controller : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = getRoundAndMatchesData
