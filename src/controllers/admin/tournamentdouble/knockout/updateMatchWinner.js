const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const tournamentMatchModel = require("../../../../models/tournamentMatch.js");
const tournamentRoundModel = require("../../../../models/tournamentRounds.js");
const tournamentKnockoutModel = require("../../../../models/tournamentKnockoutFormat.js");
const mongoose = require("mongoose");
const _ = require("lodash");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
const updateTournamentRoundMatchWinner = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (_.isEmpty(req.body.matchID)) {
      return res
        .status(400)
        .json(failed_response(400, " matchID is required", {}, false));
    }
    if (_.isEmpty(req.body.winnerID)) {
      return res
        .status(400)
        .json(failed_response(400, " winnerID is required", {}, false));
    }
    if (!isValidObjectId(req.body.matchID)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass an valid matchID ", {}, false));
    }
    if (!isValidObjectId(req.body.winnerID)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass an valid winnerID ", {}, false));
    }
    session.startTransaction();
    const matchID = req.body.matchID;
    const data = {
      // scoreA: req.body.scoreA,
      // scoreB: req.body.scoreB,
      winner: req.body.winnerID,
    };
    const match = await tournamentMatchModel
      .findById(matchID)
      .populate(["matchA", "matchB"])
      .session(session);
    if (_.isEmpty(match)) {
      return res
        .status(404)
        .json(failed_response(404, "Match not found", {}, false));
    }
    let currentRound = await tournamentRoundModel
    .findById(match?.roundID)
    .populate("matches")
    .session(session);
    let tournamentFormat = await tournamentKnockoutModel.findById(match?.formatID?.toString()).session(session);
    if(_.isEmpty(tournamentFormat)){
      return res.status(400).json(failed_response(400, "Tournament format not found",false));
    }

    if (match?.teamA?.toString() || match?.teamB?.toString()) {
      if (!match?.teamA && match?.matchA) {
        let message = `${match?.matchA?.name}'s  winner is not declared `;
        return res
          .status(400)
          .json(
            failed_response(400,
            message,
            {},
            false
          ));
      }
      if(!match?.teamA && !match?.matchA)
      {
        if(tournamentFormat?.totalRounds !== currentRound?.roundNumber){
          return res.status(400).json(failed_response(400, "Participants not assigned",{},false));
        }
      }
      if (!match?.teamB && match?.matchB) { 
        let message = `${match?.matchB?.name}'s  winner is not declared `;
        return res
          .status(400)
          .json(
            failed_response(400,
            message,
            {},
            false
          ));
      } 
      if(!match?.teamB && !match?.matchB)
        {
          if(tournamentFormat?.totalRounds !== currentRound?.roundNumber){
            return res.status(400).json(failed_response(400, "Participants not assigned",{},false));
          }
        }
      
    } else {
      if (match?.matchA && match?.matchB) {
        return res
          .status(400)
          .json(
            failed_response(
              400,
              `${match?.matchA?.name} and ${match?.matchB?.name} winners are not declared`,
              {},
              false
            )
          );
      } else if (match?.matchA || match?.matchB) {
        let message = match?.matchA
          ? match?.matchA?.name + "'s winner is not declared "
          : match?.matchB?.name + "'s winner is not declared";
        return res.status(400).json(failed_response(400, message, {}, false));
      } else {
        return res
          .status(400)
          .json(failed_response(400, "No teams in the match", {}, false));
      }
    }

    // update previous matches status
    if (!match?.status) {
      return res
          .status(400)
          .json(failed_response(400, match?.name+" winner cannot be declared again ", {}, false));
    }
    if(match?.matchA){
      match.matchA.status = false;
      match.matchA = await match.matchA.save({session});
    }
    if(match?.matchB){
      match.matchB.status = false;
      match.matchB = await match.matchB.save({session});
    }
    let previousWinner = match?.winner ? true : false;
    // match.scoreA = data.scoreA;
    // match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save({ session });
    const exist = currentRound.winners?.filter((winnerId) => {
      if (
        winnerId?.toString() === updatedMatch?.winner?.toString() ||
        winnerId?.toString() === updatedMatch?.teamA?.toString() ||
        winnerId?.toString() === updatedMatch?.teamB?.toString()
      ) {
        return winnerId.toString();
      }
    });
    if (exist.length === 0) {
      currentRound.winners.push(updatedMatch?.winner?.toString());
      currentRound = await currentRound.save({ session });
    } else {
      currentRound.winners = currentRound.winners.filter(
        (winnerId) => winnerId !== exist[0]
      );
      currentRound.winners.push(updatedMatch?.winner.toString());
      currentRound = await currentRound.save({ session });
    }

    let responseData = {};
    if (updatedMatch?.nextMatch) {
      let nextMatchDetails = await tournamentMatchModel
        .findById(updatedMatch?.nextMatch?.toString())
        .session(session);

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

      let nextRound = await tournamentRoundModel
        .findById(nextMatchDetails?.roundID)
        .populate("matches")
        .session(session);
      if (currentRound?._id?.toString() !== nextRound?._id?.toString()) {
        let exist = nextRound.participants?.filter((participantId) => {
          if (
            participantId.toString() === updatedMatch?.winner.toString() ||
            participantId.toString() === updatedMatch?.teamA?.toString() ||
            participantId.toString() === updatedMatch?.teamB?.toString()
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
      nextRound = await nextRound.save({ session });
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
      if (!nextRoundDetails) {
        nextRoundDetails = {};
      } else {
        let participants = nextRoundDetails?.participants.length;
        if (participants % 2 !== 0 && !previousWinner) {
          let matchesLength = nextRoundDetails?.matches.length;
          let nextMatchId = nextRoundDetails?.matches[0]?.nextMatch?.toString();
          let lastMathReferID =
            nextRoundDetails?.matches[matchesLength - 1]?.nextMatch?.toString();
          let lastMatchID =
            nextRoundDetails?.matches[matchesLength - 1]?._id?.toString();
          let firstMatchID = nextRoundDetails?.matches[0]?._id?.toString();

          nextRoundDetails.matches[0].nextMatch = lastMatchID;
          nextRoundDetails.matches[matchesLength - 1].nextMatch = nextMatchId;
          nextRoundDetails.matches[matchesLength - 1].matchB = firstMatchID;
          let firstReferMatchINDX = 0;
          let nextNextRoundDetails = await tournamentRoundModel
            .findOne({
              roundNumber: nextRoundDetails?.roundNumber + 1,
              tournamentID: nextRoundDetails?.tournamentID,
              formatTypeID: nextRoundDetails?.formatTypeID,
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
            nextRoundDetails.matches[0] =
              await nextRoundDetails.matches[0].save({
                session,
              });
            nextRoundDetails.matches[matchesLength - 1] =
              await nextRoundDetails.matches[matchesLength - 1].save({
                session,
              });
          }
        }
      }
    }

    await session.commitTransaction();
    await session.endSession();
    return res
      .status(200)
      .json(
        success_response(
          201,
          "Winner updated into current match and move into next match ",
          responseData,
          true
        )
      );
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while while creating tournament ",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = updateTournamentRoundMatchWinner;
