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
// const catchAsync = require("../../../utils/catchAsync.js");
// const {
//   failed_response,
//   success_response,
// } = require("../../../utils/response.js");
// const tournamentRoundModel = require("../../../models/tournamentRounds.js");
// const tournamentTeamModel = require("../../../models/tournamentTeam.js");
// const tournamentPlayerModel = require("../../../models/tournamentPlayer.js");

// const mongoose = require("mongoose");
// const _ = require("lodash");

// // to validate ObjectId()
// function isValidObjectId(id) {
//   return mongoose.Types.ObjectId.isValid(id);
// }

// const getParticipants = async (gameType, participantsIds) => {
//   try {
//     let participantsDetails = [];
//     if (gameType === "team") {
//       participantsDetails = await tournamentTeamModel.find(
//         { _id: participantsIds },
//         { name: 1 }
//       );
//     } else if (gameType === "individual") {
//       participantsDetails = await tournamentPlayerModel.find(
//         { _id: participantsIds },
//         { name: 1 }
//       );
//     }
//     if (_.isEmpty(participantsDetails)) {
//       participantsDetails = [];
//     } else {
//       participantsDetails = participantsDetails?.map((participant) => {
//         return {
//           id: participant?._id?.toString(),
//           name: participant?.name,
//         };
//       });
//     }
//     return participantsDetails;
//   } catch (error) {
//     throw new Error(
//       " => Error in getting details of participants " + error?.message
//     );
//   }
// };
// const gettingRoundMatchesForManualFixing = catchAsync(async (req, res) => {
//   try {
//     const { roundID } = req.params;
//     if (_.isEmpty(roundID)) {
//       return res
//         .status(400)
//         .json(failed_response(400, " roundID is required", {}, false));
//     }
//     if (!isValidObjectId(roundID)) {
//       return res
//         .status(400)
//         .json(
//           failed_response(400, "Pass an valid roundID into params", {}, false)
//         );
//     }
//     let roundData = await tournamentRoundModel
//       .findOne({ _id: roundID })
//       .populate(["matches"]);
//     if (_.isEmpty(roundData)) {
//       return res
//         .status(400)
//         .json(failed_response(400, "not able to find the round", {}, false));
//     }

//     if (roundData?.fixingType.toLowerCase() !== "manual") {
//       return res
//         .status(400)
//         .json(
//           failed_response(
//             400,
//             " not able to arrange the participants, tournament fixingType is : " +
//               roundData?.fixingType +
//               " , not manual",
//             {},
//             false
//           )
//         );
//     }

//     if (roundData?.winners.length > 0) {
//       return res
//         .status(400)
//         .json(
//           failed_response(
//             400,
//             "Winner is declared in the round , cannot arrange participants",
//             {},
//             false
//           )
//         );
//     }
//     const participants = await getParticipants(
//       roundData?.gameType,
//       roundData?.participants
//     );
//     const newMap = new Map();
//     participants.forEach((participant) => {
//       newMap.set(participant?.id, participant.name);
//     });
//     const roundMatches = roundData?.matches.map((match) => {
//       const teamA = newMap.get(match?.teamA?.toString());
//       const teamB = newMap.get(match?.teamB?.toString());
//       return {
//         id: match?._id?.toString(),
//         matchName: match?.name,
//         teamA_id: match?.teamA?.toString(),
//         teamB_id: match?.teamB?.toString(),
//         teamA,
//         teamB,
//       };
//     });

//     let responsePayload = {
//       participantsLength: participants?.length,
//       participants,
//       matchesLength: roundMatches?.length,
//       roundMatches,
//     };

//     return res
//       .status(200)
//       .json(
//         success_response(
//           201,
//           "Successfully get round matches for manual Fixing",
//           responsePayload,
//           true
//         )
//       );
//   } catch (err) {
//     res
//       .status(400)
//       .json(
//         failed_response(
//           400,
//           "Something went wrong while getting round matches for manual Fixing",
//           { message: err.message },
//           false
//         )
//       );
//   }
// });

// module.exports = gettingRoundMatchesForManualFixing;

