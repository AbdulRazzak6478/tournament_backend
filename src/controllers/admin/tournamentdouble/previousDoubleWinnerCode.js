const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentMatchModel = require("../models/matches");
const tournamentRoundModel = require("../models/Rounds");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");
const { default: mongoose } = require("mongoose");
const _ = require("lodash");

const updateLoserIntoLoserBracketRoundMatch = async (
  matchDetails,
  currentRound,
  session
) => {
  try {
    // 1.find match id into losers Brackets and update the loser for 1st round
    let matchLoser =
      matchDetails?.winner?.toString() === matchDetails?.teamA?.toString()
        ? matchDetails?.teamB?.toString()
        : matchDetails?.teamA?.toString();
    console.log("matchDetails : ", matchDetails);
    console.log(
      "matchDetails tournamentID : ",
      matchDetails?.tournamentID?.toString()
    );
    console.log("matchDetails  formatID: ", matchDetails?.formatID?.toString());
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
    if (currentRound?.roundNumber === 1) {
      // iteration and storing
      for (let loserFirstRoundMatch of losersBracketsRoundsAndMatches[0]
        ?.matches) {
        if (
          loserFirstRoundMatch?.matchA?.toString() ===
          matchDetails?._id?.toString()
        ) {
          loserFirstRoundMatch.teamA = matchLoser;
          loserFirstRoundMatch = await loserFirstRoundMatch.save({ session });
        }
        if (
          loserFirstRoundMatch?.matchB?.toString() ===
          matchDetails?._id?.toString()
        ) {
          loserFirstRoundMatch.teamB = matchLoser;
          loserFirstRoundMatch = await loserFirstRoundMatch.save({ session });
        }
      }
      // handling participants array if there are multiple update with different participants of same match
      let exist = losersBracketsRoundsAndMatches[0]?.participants?.filter(
        (participant) => {
          if (
            participant.toString() === matchDetails?.winner?.toString() ||
            participant.toString() === matchDetails?.teamA?.toString() ||
            participant.toString() === matchDetails?.teamB?.toString()
          ) {
            return participant.toString();
          }
        }
      );
      console.log("exist : ", exist);
      if (exist.length === 0) {
        losersBracketsRoundsAndMatches[0].participants?.push(matchLoser);
        losersBracketsRoundsAndMatches[0] =
          await losersBracketsRoundsAndMatches[0].save({ session });
      } else {
        losersBracketsRoundsAndMatches[0].participants =
          losersBracketsRoundsAndMatches[0]?.participants?.filter(
            (participantID) =>
              participantID?.toString() !== exist[0]?.toString()
          );
        losersBracketsRoundsAndMatches[0].participants?.push(matchLoser);
        losersBracketsRoundsAndMatches[0] =
          await losersBracketsRoundsAndMatches[0].save({ session });
      }
    } else {
      let loserBracketRound = losersBracketsRoundsAndMatches?.filter(
        (loserRound) => {
          if (currentRound?.roundNumber === loserRound?.roundNumber) {
            return loserRound;
          }
        }
      );
      console.log("loser Round : ", loserBracketRound);
      // iteration and storing
      for (let loserRoundMatch of loserBracketRound[0]?.matches) {
        if (
          loserRoundMatch?.matchA?.toString() === matchDetails?._id?.toString()
        ) {
          loserRoundMatch.teamA = matchLoser;
          loserRoundMatch = await loserRoundMatch.save({ session });
        }
        if (
          loserRoundMatch?.matchB?.toString() === matchDetails?._id?.toString()
        ) {
          loserRoundMatch.teamB = matchLoser;
          loserRoundMatch = await loserRoundMatch.save({ session });
        }
      }
      // handling participants array if there are multiple update with different participants of same match
      let exist = loserBracketRound[0]?.participants?.filter((participant) => {
        if (
          participant.toString() === matchDetails?.winner?.toString() ||
          participant.toString() === matchDetails?.teamA?.toString() ||
          participant.toString() === matchDetails?.teamB?.toString()
        ) {
          return participant.toString();
        }
      });
      console.log("exist : ", exist);
      if (exist.length === 0) {
        loserBracketRound[0].participants?.push(matchLoser);
        loserBracketRound[0] = await loserBracketRound[0].save({ session });
      } else {
        loserBracketRound[0].participants =
          loserBracketRound[0]?.participants?.filter(
            (participantID) =>
              participantID?.toString() !== exist[0]?.toString()
          );
        loserBracketRound[0].participants?.push(matchLoser);
        loserBracketRound[0] = await loserBracketRound[0].save({ session });
      }
    }
    console.log(
      "losersBracketsRoundsAndMatches : ",
      losersBracketsRoundsAndMatches.length
    );
    return losersBracketsRoundsAndMatches;
  } catch (error) {
    throw new Error(
      " => error in updating winner bracket loser into loser bracket round match : ",
      error?.message
    );
  }
};

const updateWinnerForWinnersBracket = async (req, res) => {
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
    let previousWinner = match?.winner ? true : false;
    match.scoreA = data.scoreA;
    match.scoreB = data.scoreB;
    match.winner = data.winner;
    let updatedMatch = await match.save({ session });
    console.log("after update match : ", updatedMatch);
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
            participantId?.toString() === updatedMatch?.winner?.toString() ||
            participantId?.toString() === updatedMatch?.teamA?.toString() ||
            participantId?.toString() === updatedMatch?.teamB?.toString()
          ) {
            return participantId?.toString();
          }
        });
        if (exist.length === 0) {
          nextRound.participants.push(updatedMatch?.winner?.toString());
          nextRound = await nextRound.save({ session });
        } else {
          nextRound.participants = nextRound.participants.filter(
            (winnerId) => winnerId !== exist[0]
          );
          nextRound.participants.push(updatedMatch?.winner?.toString());
          nextRound = await nextRound.save({ session });
          checkNextRound = nextRound;
        }
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

    let losersBrackets = [];
    if(checkNextRound?.brackets !== 'winners'){
      SuccessResponse.data = responseData;
      await session.commitTransaction();
      await session.endSession();
      return res.status(201).json(SuccessResponse);
    }else{
      // update loser into loser bracket
      losersBrackets = await updateLoserIntoLoserBracketRoundMatch(
        updatedMatch,
        currentRound,
        session
      );
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
            console.log(
              "next round match update : ",
              nextNextRoundDetails.matches[firstReferMatchINDX]
            );
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
      // update and schedule next round matches for losers bracket with corresponding to winners bracket current round

      if (currentRound?.roundNumber === 1) {
        let firstLosersRound = losersBrackets[0];
        let participants = firstLosersRound?.participants.length;
        if (participants % 2 !== 0 && !previousWinner) {
          let matchesLength = firstLosersRound?.matches.length;
          let firstMatchID = firstLosersRound?.matches[0]?._id?.toString();
          let nextMatchId = firstLosersRound?.matches[0]?.nextMatch?.toString();
          let lastMathReferID =
            firstLosersRound?.matches[matchesLength - 1]?.nextMatch?.toString();
          let lastMatchID =
            firstLosersRound?.matches[matchesLength - 1]?._id?.toString();

          firstLosersRound.matches[0].nextMatch = lastMatchID;
          firstLosersRound.matches[matchesLength - 1].nextMatch = nextMatchId;
          firstLosersRound.matches[matchesLength - 1].matchB = firstMatchID;
          let firstReferMatchINDX = 0;
          let losersNextRoundDetails = losersBrackets[1];
          if (_.isEmpty(losersNextRoundDetails)) {
            losersNextRoundDetails = {};
          }
          losersNextRoundDetails?.matches?.filter((match, index) => {
            if (match?._id?.toString() === nextMatchId) {
              firstReferMatchINDX = index;
              return match;
            }
          });
          if (lastMathReferID) {
            if (!_.isEmpty(losersNextRoundDetails)) {
              let referMatchIndex = 0;
              losersNextRoundDetails?.matches?.filter((match, index) => {
                if (match?._id?.toString() === lastMathReferID) {
                  referMatchIndex = index;
                  return match;
                }
              });
              if (
                losersNextRoundDetails?.matches[
                  referMatchIndex
                ]?.matchA?.toString() === lastMatchID &&
                !previousWinner
              ) {
                losersNextRoundDetails.matches[referMatchIndex].matchA = null;
              }
              if (
                losersNextRoundDetails?.matches[
                  referMatchIndex
                ]?.matchB?.toString() === lastMatchID &&
                !previousWinner
              ) {
                losersNextRoundDetails.matches[referMatchIndex].matchB = null;
              }
              losersNextRoundDetails.matches[referMatchIndex] =
                await losersNextRoundDetails.matches[referMatchIndex].save({
                  session,
                });
            }
          }

          // replacing first match id with lastMatchID into next round match
          if (
            losersNextRoundDetails?.matches[
              firstReferMatchINDX
            ]?.matchA?.toString() === firstMatchID
          ) {
            losersNextRoundDetails.matches[firstReferMatchINDX].matchA =
              lastMatchID;
          }
          if (
            losersNextRoundDetails?.matches[
              firstReferMatchINDX
            ]?.matchB?.toString() === firstMatchID
          ) {
            losersNextRoundDetails.matches[firstReferMatchINDX].matchB =
              lastMatchID;
          }
          losersNextRoundDetails.matches[firstReferMatchINDX] =
            await losersNextRoundDetails.matches[firstReferMatchINDX].save({
              session,
            });

          nextRoundDetails.matches[0] = await nextRoundDetails.matches[0].save({
            session,
          });
          nextRoundDetails.matches[matchesLength - 1] =
            await nextRoundDetails.matches[matchesLength - 1].save({ session });
        }
      } else {
        // checking if previous round matches of loser bracket is also completed or not , if yes then scheduling and arranging
        let losersPreviousRoundDetails =
          losersBrackets[currentRound?.roundNumber - 1];
        let losersCurrentRoundDetails =
          losersBrackets[currentRound?.roundNumber];
        let losersNextRoundDetails =
          losersBrackets[currentRound?.roundNumber + 1];
        if (_.isEmpty(losersNextRoundDetails)) {
          losersNextRoundDetails = {};
        }
        if (losersPreviousRoundDetails?.isCompleted === true) {
          let roundParticipants =
            losersCurrentRoundDetails?.participants.length;
          if (roundParticipants % 2 !== 0 && !previousWinner) {
            let matchesLength = losersCurrentRoundDetails?.matches.length;
            let nextMatchId =
              losersCurrentRoundDetails?.matches[0]?.nextMatch?.toString();
            let lastMathReferID =
              losersCurrentRoundDetails?.matches[
                matchesLength - 1
              ]?.nextMatch?.toString();
            let lastMatchID =
              losersCurrentRoundDetails?.matches[
                matchesLength - 1
              ]?._id?.toString();
            let firstMatchID =
              losersCurrentRoundDetails?.matches[0]?._id?.toString();

            losersCurrentRoundDetails.matches[0].nextMatch = lastMatchID;
            losersCurrentRoundDetails.matches[matchesLength - 1].nextMatch =
              nextMatchId;
            losersCurrentRoundDetails.matches[matchesLength - 1].matchB =
              firstMatchID;

            let firstReferMatchINDX = 0;

            if (_.isEmpty(losersNextRoundDetails)) {
              losersNextRoundDetails = {};
            } else {
              losersNextRoundDetails?.matches?.filter((match, index) => {
                if (match?._id?.toString() === nextMatchId) {
                  firstReferMatchINDX = index;
                  return match;
                }
              });
              if (lastMathReferID) {
                if (!_.isEmpty(losersNextRoundDetails)) {
                  let referMatchIndex = 0;
                  losersNextRoundDetails?.matches?.filter((match, index) => {
                    if (match?._id?.toString() === lastMathReferID) {
                      referMatchIndex = index;
                      return match;
                    }
                  });
                  if (
                    losersNextRoundDetails?.matches[
                      referMatchIndex
                    ]?.matchA?.toString() === lastMatchID &&
                    !previousWinner
                  ) {
                    losersNextRoundDetails.matches[referMatchIndex].matchA =
                      null;
                  }
                  if (
                    losersNextRoundDetails?.matches[
                      referMatchIndex
                    ]?.matchB?.toString() === lastMatchID &&
                    !previousWinner
                  ) {
                    losersNextRoundDetails.matches[referMatchIndex].matchB =
                      null;
                  }
                  losersNextRoundDetails.matches[referMatchIndex] =
                    await losersNextRoundDetails.matches[referMatchIndex].save({
                      session,
                    });
                }
              }

              // replacing first match id with lastMatchID into next round match
              if (
                losersNextRoundDetails?.matches[
                  firstReferMatchINDX
                ]?.matchA?.toString() === firstMatchID
              ) {
                losersNextRoundDetails.matches[firstReferMatchINDX].matchA =
                  lastMatchID;
              }
              if (
                losersNextRoundDetails?.matches[
                  firstReferMatchINDX
                ]?.matchB?.toString() === firstMatchID
              ) {
                losersNextRoundDetails.matches[firstReferMatchINDX].matchB =
                  lastMatchID;
              }
              losersNextRoundDetails.matches[firstReferMatchINDX] =
                await losersNextRoundDetails.matches[firstReferMatchINDX].save({
                  session,
                });
              losersCurrentRoundDetails.matches[0] =
                await losersCurrentRoundDetails.matches[0].save({
                  session,
                });
              losersCurrentRoundDetails.matches[matchesLength - 1] =
                await losersCurrentRoundDetails.matches[matchesLength - 1].save(
                  {
                    session,
                  }
                );
            }
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