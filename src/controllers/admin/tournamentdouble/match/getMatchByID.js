const tournamentTeamModel = require("../../../../models/tournamentTeam.js");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer.js");
const tournamentMatchModel = require("../../../../models/tournamentMatch.js");
const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const _ = require("lodash");
const mongoose = require("mongoose");

// to validate ObjectId()
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }
const getMatchDetails = catchAsync(async (req, res) => {
  try {
    const { matchID } = req.params;

    if(!isValidObjectId(matchID)){
        return res
        .status(400)
        .json(
          failed_response(
            400,
            "Pass a valid matchID",
            {},
            false
          )
        );
    }

    let matchResponse = await tournamentMatchModel.findOne({
      _id : matchID,
    }).populate(['matchA','matchB']);

    if (_.isEmpty(matchResponse)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "match is not found",
            { message: "match is not found" },
            false
          )
        );
    }
    let participants = [];
    if(matchResponse?.gameType === 'team'){
        participants = await tournamentTeamModel.find({ _id : [matchResponse?.teamA,matchResponse?.teamB]},{name : 1});
    }
    else {
        participants = await tournamentPlayerModel.find({ _id : [matchResponse?.teamA,matchResponse?.teamB]},{name : 1});
    }
    if(_.isEmpty(participants)){
        participants = [];
    }

    let participantA = '';
    let participantB = '';
    let matchWinner = '';
    participants?.forEach((participant)=>{
        if(participant?._id?.toString() === matchResponse?.teamA?.toString()){
            participantA = participant?.name;
            if(participant?._id?.toString() === matchResponse?.winner?.toString())
            {
                matchWinner = participant?.name;
            }
        }
        if(participant?._id?.toString() === matchResponse?.teamB?.toString()){
            participantB = participant?.name;
            if(participant?._id?.toString() === matchResponse?.winner?.toString())
            {
                matchWinner = participant?.name;
            }
        }
    })
    let matchDetails = {
        id : matchResponse?._id?.toString(),
        gameType : matchResponse?.gameType,
        name : matchResponse?.name,
        bracket : matchResponse?.bracket,
        teamA_id : matchResponse?.teamA ? matchResponse?.teamA?.toString() : null,
        teamB_id : matchResponse?.teamB ? matchResponse?.teamB?.toString() : null,
        teamA : participantA ? participantA : null,
        teamB : participantB ? participantB : null,
        matchA : matchResponse?.matchA?.name ? matchResponse?.matchA?.name : null,
        matchB : matchResponse?.matchB?.name ? matchResponse?.matchB?.name : null,
        scoreA : matchResponse?.scoreA,
        scoreB : matchResponse?.scoreB,
        dateOfPlay : matchResponse?.dateOfPlay,
        timing : matchResponse?.timing,
        winnerID : matchResponse?.winner ? matchResponse?.winner?.toString() : null,
        winner : matchWinner ? matchWinner : null
    }
    let responsePayload = {
        matchDetails ,
    }
    return res.status(200).json(
      success_response(
        200,
        "fetched match details successfully through match ID",
        responsePayload,
        true
      )
    );
  } catch (err) {
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while fetching match Details",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = getMatchDetails;
