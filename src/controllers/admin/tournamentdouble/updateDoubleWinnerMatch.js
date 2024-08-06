const { StatusCodes } = require("http-status-codes");
// const AppError = require("../utils/errors/app-error");
const tournamentMatchModel = require("../../../models/tournamentMatch");
const tournamentRoundModel = require("../../../models/tournamentRounds");
// const { SuccessResponse, ErrorResponse } = require("../../utils/common/index");

const { default: mongoose } = require("mongoose");
const _ = require("lodash");
const { failed_response, success_response } = require("../../../utils/response");


const updateMatchesAndParticipants = async(round,matchLoser,matchDetails,session)=>{
  try{
    console.log('loser of round 1 : ',matchLoser);
    // iteration and storing
    for (let loserRoundMatch of round?.matches) {
      if (
        loserRoundMatch?.matchA?.toString() === matchDetails?._id?.toString()
      ) {
        console.log('before update match : ',loserRoundMatch);
        loserRoundMatch.teamA = matchLoser;
        loserRoundMatch = await loserRoundMatch.save({ session });
        console.log('after update match : ',loserRoundMatch);
      }
      if (
        loserRoundMatch?.matchB?.toString() === matchDetails?._id?.toString()
      ) {
        console.log('before update match : ',loserRoundMatch);
        loserRoundMatch.teamB = matchLoser;
        loserRoundMatch = await loserRoundMatch.save({ session });
        console.log('after update match : ',loserRoundMatch);
      }
    }
    // handling participants array if there are multiple update with different participants of same match
    let exist = round?.participants?.filter((participant) => {
      if (
        participant.toString() === matchDetails?.winner?.toString() ||
        participant.toString() === matchDetails?.teamA?.toString() ||
        participant.toString() === matchDetails?.teamB?.toString()
      ) {
        return participant.toString();
      }
    });
    // console.log("exist : ", exist);
    if (exist.length === 0) {
      round.participants?.push(matchLoser);
      round = await round.save({ session });
    } else {
      round.participants =
      round?.participants?.filter(
          (participantID) =>
            participantID?.toString() !== exist[0]?.toString()
        );
        round.participants?.push(matchLoser);
        round = await round.save({ session });
    }
    return round;
  }
  catch(error){
    throw new Error(',Error in updating loser into loserBracket match '+error?.message);
  }
}

const updateLoserIntoLoserBracketRoundMatch = async (
  matchDetails,
  currentRound,
  session
) => {
  try {
    console.log('inside : update loser in loser bracket');
    // 1.find match id into losers Brackets and update the loser for 1st round
    let matchLoser =
      matchDetails?.winner?.toString() === matchDetails?.teamA?.toString()
        ? matchDetails?.teamB?.toString()
        : matchDetails?.teamA?.toString();
    console.log("matchLoser : ", matchLoser);
    // console.log(
    //   "matchDetails tournamentID : ",
    //   matchDetails?.tournamentID?.toString()
    // );
    // console.log("matchDetails  formatID: ", matchDetails?.formatID?.toString());
    let losersBracketsRoundsAndMatches = await tournamentRoundModel
      .find({
        tournamentID: matchDetails?.tournamentID?.toString(),
        formatTypeID: matchDetails?.formatID?.toString(),
        brackets: "losers",
      })
      .session(session)
      .populate("matches");
    // console.log('loser bracket first round : ',losersBracketsRoundsAndMatches[0]?.matches);
    // if round is 1 then placing all losers into losers first round
    losersBracketsRoundsAndMatches.sort((round1,round2)=>round1?.roundNumber - round2?.roundNumber);
    if (currentRound?.roundNumber === 1) {
      losersBracketsRoundsAndMatches[0] = await updateMatchesAndParticipants(losersBracketsRoundsAndMatches[0],matchLoser,matchDetails,session);
    } else {
      let loserBracketRound = {};
      for(let loserRound of losersBracketsRoundsAndMatches){
        for(let loserRoundMatch of loserRound.matches){
          if(loserRoundMatch?.matchA?.toString() === matchDetails?._id.toString()){
            loserBracketRound = loserRound;
          }
          if(loserRoundMatch?.matchB?.toString() === matchDetails?._id.toString()){
            loserBracketRound = loserRound;
          }
        }
      }
      console.log('loserBracketRound : ',loserBracketRound);
      loserBracketRound = await updateMatchesAndParticipants(loserBracketRound,matchLoser,matchDetails,session);  
    }
    console.log(
      "losersBracketsRoundsAndMatches : ",
      losersBracketsRoundsAndMatches.length
    );
    return losersBracketsRoundsAndMatches;
  } catch (error) {
    throw new Error(
      " ,error in updating winner bracket loser into loser bracket round match : "+error?.message,
      error?.message
    );
  }
};

const reSchedulingLogicForBrackets = async (previousWinner,round,bracket,session)=>{
  try{
      let matchesLength = round?.matches.length;
      let nextMatchId = round?.matches[0]?.nextMatch?.toString();
      let lastMathReferID =
      round?.matches[matchesLength - 1]?.nextMatch?.toString();
      let lastMatchID =
      round?.matches[matchesLength - 1]?._id?.toString();
      let firstMatchID = round?.matches[0]?._id?.toString();

      round.matches[0].nextMatch = lastMatchID;
      round.matches[matchesLength - 1].nextMatch = nextMatchId;
      round.matches[matchesLength - 1].matchB = firstMatchID;
      let firstReferMatchINDX = 0;
      let nextRound = await tournamentRoundModel
        .findOne({
          roundNumber: round?.roundNumber + 1,
          tournamentID: round?.tournamentID,
          formatTypeID: round?.formatTypeID,
          brackets : bracket
        })
        .populate("matches")
        .session(session);

      if (_.isEmpty(nextRound)) {
        nextRound = {};
      } else {
        nextRound?.matches?.filter((match, index) => {
          if (match?._id?.toString() === nextMatchId) {
            firstReferMatchINDX = index;
            return match;
          }
        });
        if (lastMathReferID) {
          if (!_.isEmpty(nextRound)) {
            let referMatchIndex = 0;
            nextRound?.matches?.filter((match, index) => {
              if (match?._id?.toString() === lastMathReferID) {
                referMatchIndex = index;
                return match;
              }
            });
            if (
              nextRound?.matches[
                referMatchIndex
              ]?.matchA?.toString() === lastMatchID &&
              !previousWinner
            ) {
              nextRound.matches[referMatchIndex].matchA = null;
            }
            if (
              nextRound?.matches[
                referMatchIndex
              ]?.matchB?.toString() === lastMatchID &&
              !previousWinner
            ) {
              nextRound.matches[referMatchIndex].matchB = null;
            }
            nextRound.matches[referMatchIndex] =
              await nextRound.matches[referMatchIndex].save({
                session,
              });
          }
        }

        // replacing first match id with lastMatchID into next round match
        if (
          nextRound?.matches[
            firstReferMatchINDX
          ]?.matchA?.toString() === firstMatchID
        ) {
          nextRound.matches[firstReferMatchINDX].matchA =
            lastMatchID;
        }
        if (
          nextRound?.matches[
            firstReferMatchINDX
          ]?.matchB?.toString() === firstMatchID
        ) {
          nextRound.matches[firstReferMatchINDX].matchB =
            lastMatchID;
        }
        nextRound.matches[firstReferMatchINDX] =
          await nextRound.matches[firstReferMatchINDX].save({
            session,
          });
        console.log(
          "next round match update : ",
          nextRound.matches[firstReferMatchINDX]
        );
        round.matches[0] =
          await round.matches[0].save({
            session,
          });
          round.matches[matchesLength - 1] =
          await round.matches[matchesLength - 1].save({
            session,
          });
      }
    return round;
  }
  catch(error){
    throw new Error(', error in re scheduling and updating round matches : ',error?.message);
  }
}

const updateWinnerForWinnersBracket = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const matchID = req.body.matchID;
    const data = {
      winner: req.body.winnerID,
      // scoreA: req.body.scoreA,
      // scoreB: req.body.scoreB,
    };

    // update current match
    // update winner in winner array and handle multiple update winner
    // update winner into next match
    // update winner into next round participants

    console.log("update winner data : ", data, matchID);
    const match = await tournamentMatchModel.findById(matchID).session(session);
    // console.log("before update match : ", match);
    let previousWinner = match?.winner ? true : false;
    // match.scoreA = data.scoreA;
    // match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save({ session });
    // console.log("after update match : ", updatedMatch);
    let currentRound = await tournamentRoundModel
      .findById(match?.roundID)
      .populate("matches")
      .session(session);
    // Saving winner into round winners array and checking not to save multiple winners of same match
    const exist = currentRound.winners?.filter((winnerId) => {
      if (
        winnerId?.toString() === updatedMatch?.winner?.toString() ||
        winnerId?.toString() === updatedMatch?.teamA?.toString() ||
        winnerId?.toString() === updatedMatch?.teamB?.toString()
      ) {
        return winnerId?.toString();
      }
    });
    if (exist.length === 0) {
      currentRound.winners.push(updatedMatch?.winner?.toString());
      currentRound = await currentRound.save({ session });
    } else {
      currentRound.winners = currentRound.winners.filter(
        (winnerId) => winnerId !== exist[0]
      );
      currentRound.winners.push(updatedMatch?.winner?.toString());
      currentRound = await currentRound.save({ session });
    }

    // moving winner into next match and round
    let checkNextRound = {};
    let responseData = {};
    if (updatedMatch?.nextMatch) {
      let nextMatchDetails = await tournamentMatchModel
        .findById(updatedMatch?.nextMatch?.toString())
        .session(session);
      if (_.isEmpty(nextMatchDetails)) {
        throw new Error(
          " Error in fetching next match details in winners bracket"
        );
      }
      // console.log("next match details :  ", nextMatchDetails);

      // assigning participants or teams into match
      if (
        nextMatchDetails?.matchA?.toString() === updatedMatch?._id?.toString()
      ) {
        nextMatchDetails.teamA = updatedMatch?.winner?.toString();
      }
      if (
        nextMatchDetails?.matchB?.toString() === updatedMatch?._id?.toString()
      ) {
        nextMatchDetails.teamB = updatedMatch?.winner?.toString();
      }
      nextMatchDetails = await nextMatchDetails.save({ session });

      // saving winner into next round participants if it is not the same round
      let nextRound = await tournamentRoundModel
        .findById(nextMatchDetails?.roundID)
        .populate("matches")
        .session(session);

        if (currentRound?._id?.toString() !== nextRound?._id?.toString()) {
        let exist = nextRound.participants?.filter((participantId) => {
          if (
            participantId?.toString() === updatedMatch?.winner?.toString() ||
            participantId?.toString() === updatedMatch?.teamA?.toString() ||
            participantId?.toString() === updatedMatch?.teamB?.toString()
          ) {
            return participantId?.toString();
          }
        });
        if (exist.length === 0) {
          nextRound.participants.push(updatedMatch?.winner?.toString());
          // nextRound = await nextRound.save({ session });
          // checkNextRound = nextRound;
        } else {
          nextRound.participants = nextRound.participants.filter(
            (winnerId) => winnerId !== exist[0]
          );
          nextRound.participants.push(updatedMatch?.winner?.toString());
          // nextRound = await nextRound.save({ session });
        }
        nextRound = await nextRound.save({ session });
        console.log('checkNextRound : ',checkNextRound);
      }
      checkNextRound = nextRound;
      responseData = {
        currentMatch: updatedMatch,
        nextMatchDetails,
        nextRound,
      };
    } else {
      responseData = {
        currentMatch: updatedMatch,
      };
    }

    let losersBrackets = [];
    if(checkNextRound?.brackets !== 'winners'){
      console.log('inside  final');
      // SuccessResponse.data = responseData;
      await session.commitTransaction();
      await session.endSession();
      return res.status(201).json(success_response(200,'Successfully completed request',{responseData},true));
    }else{
      // update loser into loser bracket
      console.log('inside ')
      losersBrackets = await updateLoserIntoLoserBracketRoundMatch(
        updatedMatch,
        currentRound,
        session
      );
    }

    console.log('after loser assigned, losersBrackets.length : ',losersBrackets.length);
    //scheduling next round matches

    let nextRoundDetails = {};
    let isRoundCompleted = true;
    currentRound?.matches?.forEach((match) => {
      if (!match?.winner) {
        isRoundCompleted = false;
      }
    });
    if (isRoundCompleted) {
      console.log('round completed : ',isRoundCompleted);
      currentRound.isCompleted = true;
      currentRound = await currentRound.save({ session });
      // handling if it is final round or next out of round
      nextRoundDetails = await tournamentRoundModel
        .findOne({
          roundNumber: currentRound?.roundNumber + 1,
          tournamentID: currentRound?.tournamentID,
          formatTypeID: currentRound?.formatTypeID,
        })
        .populate("matches")
        .session(session);
      console.log("next round details : ", nextRoundDetails);
      if (!nextRoundDetails) {
        nextRoundDetails = {};
      } else {
        let participants = nextRoundDetails?.participants.length;
        if (participants % 2 !== 0 && !previousWinner) {
          nextRoundDetails = await reSchedulingLogicForBrackets(previousWinner,nextRoundDetails,nextRoundDetails?.brackets,session);
        }
      }
      // update and schedule next round matches for losers bracket with corresponding to winners bracket current round

      if (currentRound?.roundNumber === 1) {
        let firstLosersRound = losersBrackets[0];
        let participants = firstLosersRound?.participants.length;
        if (participants % 2 !== 0 && !previousWinner) {
          firstLosersRound = await reSchedulingLogicForBrackets(previousWinner,firstLosersRound,firstLosersRound?.brackets,session);
      } else {
        // checking if previous round matches of loser bracket is also completed or not , if yes then scheduling and arranging
        let losersPreviousRoundDetails =
          losersBrackets[currentRound?.roundNumber - 1];
        let losersCurrentRoundDetails =
          losersBrackets[currentRound?.roundNumber];
        if (losersPreviousRoundDetails?.isCompleted === true) {
          let roundParticipants =
            losersCurrentRoundDetails?.participants.length;
          if (roundParticipants % 2 !== 0 && !previousWinner) {
            losersCurrentRoundDetails = await reSchedulingLogicForBrackets(previousWinner,losersCurrentRoundDetails,losersCurrentRoundDetails?.brackets,session);
          }
        }
      }
    }
  }
    // SuccessResponse.data = responseData;
    await session.commitTransaction();
    await session.endSession();
    return res.status(201).json(success_response(200,'Successfully completed request',{responseData},true));
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log(
      "error in updateWinner of double knockout winners bracket : " +
        error?.message
    );
    // ErrorResponse.error = new AppError(
    //   "error in updateWinner of double knockout winners bracket :" +
    //     error?.message,
    //   500
    // );
    return res.status(500).json(failed_response(400,'Error in updating winner in winners bracket',{message : error?.message},false));
  }
};

const updateWinnerForLoserBracket = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const matchID = req.body.matchID;
    const data = {
      scoreA: req.body.scoreA,
      scoreB: req.body.scoreB,
      winner: req.body.winnerID,
    };
    const matchDetails = await tournamentMatchModel
      .findById(matchID)
      .session(session);
    if (!matchDetails) {
      throw new Error(" => match not found");
    }
    console.log("before update match : ", matchDetails);
    let previousWinner = matchDetails?.winner ? true : false;
    matchDetails.scoreA = data.scoreA;
    matchDetails.scoreB = data.scoreB;
    matchDetails.winner = data.winner;
    let updatedMatch = await matchDetails.save({ session });
    console.log("after update match : ", updatedMatch);
    let currentLoserRound = await tournamentRoundModel
      .findById(matchDetails?.roundID)
      .populate("matches")
      .session(session);

    // Saving winner into round winners array and checking not to save multiple winners of same match
    const exist = currentLoserRound.winners?.filter((winnerId) => {
      if (
        winnerId.toString() === updatedMatch?.winner?.toString() ||
        winnerId.toString() === updatedMatch?.teamA?.toString() ||
        winnerId.toString() === updatedMatch?.teamB?.toString()
      ) {
        return winnerId.toString();
      }
    });
    if (exist.length === 0) {
      currentLoserRound.winners.push(updatedMatch?.winner.toString());
      currentLoserRound = await currentLoserRound.save({ session });
    } else {
      currentLoserRound.winners = currentLoserRound.winners.filter(
        (winnerId) => winnerId !== exist[0]
      );
      currentLoserRound.winners.push(updatedMatch?.winner.toString());
      currentLoserRound = await currentLoserRound.save({ session });
    }

    // moving winner into next match and round
    let loserNextRound = {};
    let responseData = {};
    if (updatedMatch?.nextMatch) {
      let nextMatchDetails = await tournamentMatchModel
        .findById(updatedMatch?.nextMatch?.toString())
        .session(session);
      if (_.isEmpty(nextMatchDetails)) {
        throw new Error(
          " Error in fetching next match details in winners bracket"
        );
      }
      console.log("next match details :  ", nextMatchDetails);

      // assigning participants or teams into match
      if (
        nextMatchDetails?.matchA?.toString() === updatedMatch?._id?.toString()
      ) {
        nextMatchDetails.teamA = updatedMatch?.winner?.toString();
      }
      if (
        nextMatchDetails?.matchB?.toString() === updatedMatch?._id?.toString()
      ) {
        nextMatchDetails.teamB = updatedMatch?.winner?.toString();
      }
      nextMatchDetails = await nextMatchDetails.save({ session });

      // saving winner into next round participants if it is not the same round
      let nextRound = await tournamentRoundModel
        .findById(nextMatchDetails?.roundID)
        .populate("matches")
        .session(session);
      if (_.isEmpty(nextRound)) {
        nextRound = {};
      }

      if (currentLoserRound?._id?.toString() !== nextRound?._id?.toString()) {
        let exist = nextRound.participants?.filter((participantId) => {
          if (
            participantId.toString() === updatedMatch?.winner.toString() ||
            participantId.toString() === updatedMatch?.teamA.toString() ||
            participantId.toString() === updatedMatch?.teamB.toString()
          ) {
            return participantId.toString();
          }
        });
        if (exist.length === 0) {
          nextRound.participants.push(updatedMatch?.winner.toString());
          nextRound = await nextRound.save({ session });
        } else {
          nextRound.participants = nextRound.participants.filter(
            (winnerId) => winnerId !== exist[0]
          );
          nextRound.participants.push(updatedMatch?.winner.toString());
          nextRound = await nextRound.save({ session });
        }
        loserNextRound = nextRound;
      }
      responseData = {
        currentMatch: updatedMatch,
        nextMatchDetails,
        nextRound,
      };
    } else {
      responseData = {
        currentMatch: updatedMatch,
      };
    }

    //scheduling next round matches

    let nextRoundDetails = {};
    let isRoundCompleted = true;
    currentLoserRound?.matches?.forEach((match) => {
      if (!match?.winner) {
        isRoundCompleted = false;
      }
    });

    if (isRoundCompleted && !previousWinner) {
      if (!_.isEmpty(loserNextRound)) {
        let checkBracket = loserNextRound?.brackets === "losers" ? true : false;
        let participants = loserNextRound?.participants.length;
        if (participants % 2 !== 0 && !previousWinner && checkBracket) {
          let matchesLength = loserNextRound?.matches.length;
          let nextMatchId = loserNextRound?.matches[0]?.nextMatch?.toString();
          let lastMathReferID =
            loserNextRound?.matches[matchesLength - 1]?.nextMatch?.toString();
          let lastMatchID =
            loserNextRound?.matches[matchesLength - 1]?._id?.toString();
          let firstMatchID = loserNextRound?.matches[0]?._id?.toString();

          loserNextRound.matches[0].nextMatch = lastMatchID;
          loserNextRound.matches[matchesLength - 1].nextMatch = nextMatchId;
          loserNextRound.matches[matchesLength - 1].matchB = firstMatchID;
          let firstReferMatchINDX = 0;
          let nextNextRoundDetails = await tournamentRoundModel
            .findOne({
              roundNumber: loserNextRound?.roundNumber + 1,
              tournamentID: loserNextRound?.tournamentID,
              formatTypeID: loserNextRound?.formatTypeID,
              brackets: "losers",
            })
            .populate("matches")
            .session(session);

          if (_.isEmpty(nextNextRoundDetails)) {
            nextNextRoundDetails = {};
          } else {
            nextNextRoundDetails?.matches?.filter((match, index) => {
              if (match?._id?.toString() === nextMatchId) {
                firstReferMatchINDX = index;
                return match;
              }
            });
            if (lastMathReferID) {
              if (!_.isEmpty(nextNextRoundDetails)) {
                let referMatchIndex = 0;
                nextNextRoundDetails?.matches?.filter((match, index) => {
                  if (match?._id?.toString() === lastMathReferID) {
                    referMatchIndex = index;
                    return match;
                  }
                });
                if (
                  nextNextRoundDetails?.matches[
                    referMatchIndex
                  ]?.matchA?.toString() === lastMatchID &&
                  !previousWinner
                ) {
                  nextNextRoundDetails.matches[referMatchIndex].matchA = null;
                }
                if (
                  nextNextRoundDetails?.matches[
                    referMatchIndex
                  ]?.matchB?.toString() === lastMatchID &&
                  !previousWinner
                ) {
                  nextNextRoundDetails.matches[referMatchIndex].matchB = null;
                }
                nextNextRoundDetails.matches[referMatchIndex] =
                  await nextNextRoundDetails.matches[referMatchIndex].save({
                    session,
                  });
              }
            }
            // replacing first match id with lastMatchID into next round match
            if (
              nextNextRoundDetails?.matches[
                firstReferMatchINDX
              ]?.matchA?.toString() === firstMatchID
            ) {
              nextNextRoundDetails.matches[firstReferMatchINDX].matchA =
                lastMatchID;
            }
            if (
              nextNextRoundDetails?.matches[
                firstReferMatchINDX
              ]?.matchB?.toString() === firstMatchID
            ) {
              nextNextRoundDetails.matches[firstReferMatchINDX].matchB =
                lastMatchID;
            }
            nextNextRoundDetails.matches[firstReferMatchINDX] =
              await nextNextRoundDetails.matches[firstReferMatchINDX].save({
                session,
              });
            loserNextRound.matches[0] =
              await losersCurrentRoundDetails.matches[0].save({
                session,
              });
            loserNextRound.matches[matchesLength - 1] =
              await losersCurrentRoundDetails.matches[matchesLength - 1].save({
                session,
              });
          }
        }
      }
    }
    SuccessResponse.data = responseData;
    await session.commitTransaction();
    await session.endSession();
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log(
      "error in updateWinner of double knockout losers bracket : " +
        error?.message
    );
    ErrorResponse.error = new AppError(
      "error in updateWinner of double knockout losers bracket :" +
        error?.message,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};
module.exports = {
  updateWinnerForWinnersBracket,
  updateWinnerForLoserBracket,
};
