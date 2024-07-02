const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const MatchesModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");



const testTour = async (req, res) => {
  try {
    
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    console.log("error in createTeam controller");
    ErrorResponse.error = new AppError(
      `error in creating createTeam : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
};
