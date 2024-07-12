const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentMatchModel = require("../models/matches");
const tournamentRoundModel = require("../models/Rounds");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");
const { default: mongoose } = require("mongoose");

const createTeam = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const matchID = req.body.matchID;
    const data = {
      winner: req.body.winnerID,
      scoreA: req.body.scoreA,
      scoreB: req.body.scoreB,
    };

    // update current match
    // update winner in winner array and handle multiple update winner
    // update winner into next match
    // update winner into next round participants

    console.log("update winner data : ", data, matchID);
    const match = await tournamentMatchModel.findById(matchID).session(session);
    console.log("before update match : ", match);
    match.scoreA = data.scoreA;
    match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save({ session });
    console.log("after update match : ", updatedMatch);

    // Saving winner into round winners array and checking not to save multiple winners of same match
    let currentRound = await tournamentRoundModel
      .findById(updatedMatch?.roundID)
      .populate("matches")
      .session(session);
    const exist = currentRound.winners?.filter((winnerId) => {
      if (
        winnerId.toString() === updatedMatch?.winner?.toString() ||
        winnerId.toString() === updatedMatch?.teamA?.toString() ||
        winnerId.toString() === updatedMatch?.teamB?.toString()
      ) {
        return winnerId.toString();
      }
    });
    if (exist.length === 0) {
      currentRound.winners.push(updatedMatch?.winner.toString());
      currentRound = await currentRound.save({ session });
    } else {
      currentRound.winners = currentRound.winners.filter(
        (winnerId) => winnerId !== exist[0]
      );
      currentRound.winners.push(updatedMatch?.winner.toString());
      currentRound = await currentRound.save({ session });
    }

    // moving winner into next match and round
    if (updatedMatch?.nextMatch) {
      let nextMatchDetails = await tournamentMatchModel
        .findById(updatedMatch?.nextMatch.toString())
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

      if (currentRound?._id?.toString() !== nextRound?._id?.toString()) {
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
      }
      let responseData = {
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
    currentRound?.matches?.forEach((match) => {
      if (!match?.winner) {
        isRoundCompleted = false;
      }
    });
    if (isRoundCompleted) {
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
        // let matches = nextRoundDetails?.matches;
        if (participants % 2 !== 0) {
          let nextMatchId = nextRoundDetails?.matches[0]?.nextMatch?.toString();
          console.log("next match id ", nextMatchId);
          const lastIndex = nextRoundDetails?.matches.length;
          console.log(
            "last match id : ",
            nextRoundDetails?.matches[lastIndex - 1]?._id?.toString()
          );
          nextRoundDetails.matches[0].nextMatch =
            nextRoundDetails?.matches[lastIndex - 1]?._id?.toString();
          nextRoundDetails.matches[lastIndex - 1].nextMatch = nextMatchId;
          await nextRoundDetails?.matches[0].save({ session });
          await nextRoundDetails?.matches[lastIndex - 1].save(session);
        }
      }
    }

    await session.commitTransaction();
    await session.endSession();
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log(
      "error in updateWinner of double knockout winners bracket : " +
        error?.message
    );
    ErrorResponse.error = new AppError(
      "error in updateWinner of double knockout winners bracket :" +
        error?.message,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  createTeam,
};
