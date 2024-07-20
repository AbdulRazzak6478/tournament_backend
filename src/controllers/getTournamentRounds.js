const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const MatchesModel = require("../models/matches");
const teamModel = require("../models/team");
const playerModel = require("../models/participents");
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

    SuccessResponse.data = {
        rounds,
        // nextRoundDetails
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

const getParticipants = async (gameType,participantsIds)=>{
  try{

    let participantsDetails = [];
    if(gameType === 'team'){
      participantsDetails = await teamModel.find({ _id : participantsIds},{name : 1});
    }
    else if(gameType === 'individual'){
      participantsDetails = await playerModel.find({ _id : participantsIds},{name : 1});
    }
    participantsDetails = participantsDetails?.map((participant)=>{
      return {
        id : participant?._id?.toString(),
        name : participant?.name
      }
    })
    return participantsDetails ;
  }
  catch(error){
    throw new Error(' => Error in getting details of participants '+error?.message );
  }
}

const getRoundAndMatchesDataForFixing = async (req, res) => {
  try {
    const id = req.params.roundID;
    let round = await roundModel.findById(id).populate("matches");
    const participants = await getParticipants(round?.gameType,round?.participants);
    const newMap = new Map();
    participants.forEach((participant)=>{
      newMap.set(participant?.id,participant.name);
    })
    const roundMatches = round?.matches.map((match)=>{
      const teamA = newMap.get(match?.teamA?.toString());
      const teamB = newMap.get(match?.teamB?.toString());
      return {
        id : match?._id?.toString(),
        matchName : match?.name,
        teamA_id : match?.teamA?.toString(),
        teamB_id : match?.teamB?.toString(),
        teamA,
        teamB
      }
    })
    console.log('rounds matches : ',roundMatches)

    SuccessResponse.data = {
      participantsLength : participants?.length,
      participants,
      matchesLength : roundMatches?.length,
      roundMatches ,
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

module.exports = {
  getTournamentRounds,
  getRoundById,
  getRoundAndMatchesDataForFixing
};
