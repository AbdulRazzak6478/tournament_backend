const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const tournamentTeamModel = require("../models/team");
const tournamentPlayerModel = require("../models/participents");
const MatchesModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");

const getRoundsAndMatchesWithParticipants = async(rounds)=>{
    try{
        let participantsDetails = [];
        if(rounds[0]?.gameType === 'team'){
            participantsDetails = await tournamentTeamModel.find({_id : rounds[0]?.participants},{name : 1});
        }
        else if(rounds[0]?.gameType === 'individual'){
            participantsDetails = await tournamentPlayerModel.find({_id : rounds[0]?.participants},{name : 1});
        }

        let participantsMap = new Map();
        participantsDetails = participantsDetails?.map((participant)=>{
            participantsMap.set(participant?._id?.toString() , participant?.name);
            return participant;
        })

        console.log('map : ',participantsMap);
        let bracketCheck = rounds[0]?.brackets;
        let roundsData = rounds?.map((round)=>{
            let matchesData = round?.matches?.map((match)=>{
                let winA = 'Winner';
                let winB = 'Winner';
                if(bracketCheck === 'losers'){
                    winA = match?.matchA?.bracket === bracketCheck ? 'Winner' : 'Loser';
                    winB = match?.matchA?.bracket === bracketCheck ? 'Winner' : 'Loser';
                }
                // else if(bracketCheck === 'Final Bracket'){
                //     winA = match?.matchA?.bracket === bracketCheck ? 'Winner' : 'Loser';
                //     winB = match?.matchA?.bracket === bracketCheck ? 'Winner' : 'Loser';
                // }
                const matchA = match?.matchA?.name ? winA+' From '+ match?.matchA?.name : 'No Teams Left';
                const matchB = match?.matchB?.name ? winB+' From '+ match?.matchB?.name :  'No Teams Left';
                const participantA = match?.teamA?.toString() ? participantsMap.get(match?.teamA?.toString()) : matchA;
                const participantB = match?.teamB?.toString() ? participantsMap.get(match?.teamB?.toString()) : matchB;
                return {
                    id : match?._id?.toString(),
                    name : match?.name,
                    participantA : participantA,
                    participantB : participantB,
                    scoreA : match?.scoreA,
                    scoreB : match?.scoreB,
                    winner : participantsMap.get(match?.winner?.toString())
                }
            })
            return {
                roundID : round?._id?.toString(),
                roundName : round?.roundName,
                roundNumber : round?.roundNumber,
                matches : matchesData,
            }
        })
        return roundsData;
    }
    catch(error){
        throw new Error(' => error in getting rounds and matches with participants '+error?.message);
    }
}

const getWinnersBracketsRounds = async (req, res) => {
  try {
    const data = {
      tournamentID: req.body.tournamentID,
      formatTypeID: req.body.formatTypeID,
      brackets : req.body.bracket
    };
    const rounds = await roundModel.find(data).populate({path : "matches" , populate : ["matchA","matchB"]}).populate('participants');
    let roundsData = await getRoundsAndMatchesWithParticipants(rounds);
    let responsePayload = [];
    SuccessResponse.data = {
        length : rounds.length,
        rounds : roundsData
        // rounds : rounds
    };
    return res.status(200).json(SuccessResponse);
  } catch (error) {
    console.log("error in getting rounds winner brackets controller");
    ErrorResponse.error = new AppError(
      `error in getting rounds winner brackets controller : ${error?.message}`,
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

module.exports = {
    getWinnersBracketsRounds,
};
