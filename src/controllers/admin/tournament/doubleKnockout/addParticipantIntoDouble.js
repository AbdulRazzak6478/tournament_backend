const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentRoundsModel = require("../../../../models/tournamentRounds");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentDoubleFormat = require("../../../../models/tournamentDoubleFormat");
const mongoose = require("mongoose");
const _ = require("lodash");

const getRoundsNamesForBrackets = (bracketData) => {
  let roundName = "";
  for (let i = 1; i <= bracketData.length; i++) {
    if (i === bracketData.length) {
      roundName = "Final";
    } else {
      roundName =
        i === bracketData.length - 1
          ? "Semi Final"
          : i === bracketData.length - 2
            ? "Quarter Final"
            : `Qualification Round ${i}`;
    }
    bracketData[i - 1].roundName = roundName;
  }
  return bracketData;
};

const getBracketsRoundsAndMatches = (participants) => {
  try {
    let totalRounds = Math.ceil(Math.log2(participants));

    let tourTeams = participants;
    let winnersBrackets = [];
    let losersBrackets = [];
    for (let i = 1; i <= totalRounds; i++) {
      let matches = 0;
      let winners = 0;
      let losers = 0;
      matches = Math.round(tourTeams / 2);
      losers = Math.floor(tourTeams / 2);
      winners = matches;
      tourTeams = matches;
      let losersMatches = 0;
      let losersWinners = 0;
      let losersBracketLosers = 0;
      if (i == 1) {
        losersMatches = Math.round(losers / 2);
        losersWinners = Math.round(losers / 2);
        losersBracketLosers = Math.floor(losers / 2);
      } else {
        losersMatches = Math.round(
          (losers + losersBrackets[i - 2]?.winners) / 2
        );
        losersWinners = Math.round(
          (losers + losersBrackets[i - 2]?.winners) / 2
        );
        losersBracketLosers = Math.floor(
          (losers + losersBrackets[i - 2]?.winners) / 2
        );
      }
      let losersObj = {
        roundNumber: i,
        matches: losersMatches,
        winners: losersWinners,
        losers: losersBracketLosers,
      };
      losersBrackets.push(losersObj);
      let winnerObj = {
        roundNumber: i,
        matches,
        winners,
        losers,
      };
      winnersBrackets.push(winnerObj);
    }
    let winners = losersBrackets[totalRounds - 1]?.winners;
    let round = totalRounds;
    while (winners > 1) {
      let losersMatches = Math.round(winners / 2);
      let losersWinners = losersMatches;
      let losersBracketLosers = Math.floor(winners / 2);
      let losersObj = {
        roundNumber: round + 1,
        matches: losersMatches,
        winners: losersWinners,
        losers: losersBracketLosers,
      };
      losersBrackets.push(losersObj);
      winners = losersMatches;
    }
    winnersBrackets = getRoundsNamesForBrackets(winnersBrackets);
    losersBrackets = getRoundsNamesForBrackets(losersBrackets);
    const winnersRoundNames = winnersBrackets?.map(
      (bracket) => bracket?.roundName
    );
    const losersRoundNames = losersBrackets?.map(
      (bracket) => bracket?.roundName
    );
    const bracketsPayload = {
      winnersBrackets,
      losersBrackets,
      winnersRoundNames,
      losersRoundNames,
    };
    return bracketsPayload;
  } catch (error) {
    throw new Error(
      ",Error in get brackets rounds and matches data " + error?.message
    );
  }
};

const createRoundsAndThereMatches = async (
  dataPayload,
  bracketRounds,
  session
) => {
  try {
    const {
      tournamentID,
      formatTypeID,
      formatType,
      participantsIds,
      fixingType,
      gameType,
    } = dataPayload;
    const roundsAndMatches = [];
    for (let roundData of bracketRounds) {
      // Create a new round
      const data1 = {
        roundNumber: roundData.roundNumber,
        roundName: roundData.roundName,
        tournamentID: tournamentID,
        formatTypeID: formatTypeID,
        brackets: roundData.brackets,
        formatName: formatType,
        gameType: gameType,
        fixingType: fixingType,
      };
      if (roundData.roundNumber === 1 && roundData.brackets === "winners") {
        data1.participants = participantsIds;
      }
      let round = await tournamentRoundsModel.create([data1], {
        session: session,
      });
      if (_.isEmpty(round)) {
        throw new Error(", not able to create round" + roundData.roundNumber);
      }
      round = round[0];
      // Create matches for the current round
      let roundMatches = Array.from(
        new Array(roundData.matches),
        (value, index) => index + 1
      );

      // preparing matches data payload
      let allMatches = [];
      let matchIds = [];
      for (let matchData of roundMatches) {
        const str = round?.brackets === "winners" ? "K1" : "k2";
        const matchObj = {
          name: "Match #" + str + "R" + round?.roundNumber + "M" + matchData,
          tournamentID: tournamentID,
          roundID: round?._id?.toString(),
          formatID: formatTypeID,
          bracket: round.brackets,
        };
        allMatches.push(matchObj);
      }
      const matches = await tournamentMatchModel.create(allMatches, {
        session: session,
      }); // creating matches

      if (_.isEmpty(matches)) {
        throw new Error(
          ",not able to create matches for round" + roundData.roundNumber
        );
      }
      matchIds = matches?.map((match) => match?._id?.toString());
      round?.matches.push(...matchIds); // storing matches ids
      round = await round.save({ session });
      roundsAndMatches.push(round);
    }
    return roundsAndMatches;
  } catch (error) {
    throw new Error(
      ",error in creating rounds and matches in double knockout : " +
        error?.message
    );
  }
};

const referencingMatchesToNextMatches = async (
  tournamentID,
  formatTypeID,
  bracket,
  session
) => {
  try {
    const roundMatchIdsMap = new Map();
    // Get all rounds data and matches
    let allRoundsData = await tournamentRoundsModel
      .find({
        tournamentID: tournamentID,
        formatTypeID: formatTypeID,
        brackets: bracket,
      })
      .populate("matches")
      .session(session);
    allRoundsData.sort(
      (round1, round2) => round1?.roundNumber - round2?.roundNumber
    );
    // Generating array upto rounds length to iterate
    let rounds = Array.from(
      new Array(allRoundsData.length),
      (value, index) => index + 1
    );
    // saving the next rounds matches Ids into Map
    allRoundsData?.forEach((round) => {
      const matchArray = round?.matches?.map((match) => match?._id?.toString());
      roundMatchIdsMap.set(round.roundNumber, matchArray);
    });

    // iterating over the rounds and there matches to add reference of next rounds matches
    for (let round of rounds) {
      let roundMatches = allRoundsData[round - 1].matches;

      // referencing next round or match in current match
      let index = 0;
      for (let i = 0; i < roundMatches.length; i += 2) {
        if (roundMatchIdsMap.get(round + 1)) {
          let nextRoundMatchesIds = roundMatchIdsMap.get(round + 1);
          if (index < nextRoundMatchesIds.length) {
            // having next round match
            roundMatches[i].nextMatch = nextRoundMatchesIds[index];
            allRoundsData[round - 1].matches[i] = await roundMatches[i].save({
              session,
            });
            if (i + 1 < roundMatches.length) {
              if (roundMatches[i + 1]) {
                roundMatches[i + 1].nextMatch = nextRoundMatchesIds[index];
                allRoundsData[round - 1].matches[i + 1] = await roundMatches[
                  i + 1
                ].save({ session });
              }
            }
          } else {
            // no next round match
            roundMatches[i].nextMatch = null; // no next round match
            allRoundsData[round - 1].matches[i] = await roundMatches[i].save({
              session,
            });
            if (i + 1 < roundMatches.length) {
              if (roundMatches[i + 1]) {
                roundMatches[i + 1].nextMatch = null; // no next round match
                allRoundsData[round - 1].matches[i + 1] = await roundMatches[
                  i + 1
                ].save({ session });
              }
            }
          }
          index += 1; // incrementing to get next match id index
        }
      }
    }

    // matches placeholder making
    // 1. start allocating placeholder from next round
    for (let i = 2; i <= rounds.length; i++) {
      let prevRoundMatchesIds = roundMatchIdsMap.get(i - 1);
      let currentRoundMatches = allRoundsData[i - 1].matches;
      let index = 0;
      for (let match = 0; match < currentRoundMatches.length; match++) {
        if (index < prevRoundMatchesIds.length) {
          currentRoundMatches[match].matchA = prevRoundMatchesIds[index];
          if (index + 1 < prevRoundMatchesIds.length) {
            currentRoundMatches[match].matchB = prevRoundMatchesIds[index + 1];
            index = index + 2;
          } else {
            index++;
          }
        }
        currentRoundMatches[match] = await currentRoundMatches[match].save({
          session,
        });
      }
    }
    return allRoundsData;
  } catch (error) {
    throw new Error(
      ",error in referencing next matches to previous : " + error?.message
    );
  }
};

const assigningLosersIntoLosersBracket = async (
  winnersBracket,
  losersBracket,
  session
) => {
  try {
    let round = 0;
    for (let loserRound of losersBracket) {
      let index = 0;
      for (let match = 0; match < loserRound?.matches?.length; match++) {
        if (round >= winnersBracket.length) {
          break;
        }
        if (index < winnersBracket[round]?.matches.length) {
          if (round === 0) {
            if (!loserRound.matches[match].matchA) {
              if (
                winnersBracket[round]?.matches[index]?.teamA &&
                winnersBracket[round]?.matches[index]?.teamB
              ) {
                loserRound.matches[match].matchA =
                  winnersBracket[round]?.matches[index]?._id?.toString();
                index++;
              }
            }
            if (
              !loserRound.matches[match].matchB &&
              index < winnersBracket[round]?.matches.length
            ) {
              if (
                winnersBracket[round]?.matches[index]?.teamA &&
                winnersBracket[round]?.matches[index]?.teamB
              ) {
                loserRound.matches[match].matchB =
                  winnersBracket[round]?.matches[index]?._id?.toString();
                index++;
              }
            }
          } else {
            if (!loserRound.matches[match].matchA) {
              if (
                winnersBracket[round]?.matches[index]?.matchA &&
                winnersBracket[round]?.matches[index]?.matchB
              ) {
                loserRound.matches[match].matchA =
                  winnersBracket[round]?.matches[index]?._id?.toString();
                index++;
              }
            }
            if (
              !loserRound.matches[match].matchB &&
              index < winnersBracket[round]?.matches.length
            ) {
              if (
                winnersBracket[round]?.matches[index]?.matchA &&
                winnersBracket[round]?.matches[index]?.matchB
              ) {
                loserRound.matches[match].matchB =
                  winnersBracket[round]?.matches[index]?._id?.toString();
                index++;
              }
            }
          }

          loserRound.matches[match] = await loserRound.matches[match].save({
            session,
          });
        }
      }
      round++;
    }

    return losersBracket;
  } catch (error) {
    throw new Error(
      ",getting error in assigning losers in loser bracket : " + error?.message
    );
  }
};

const creatingFinalBracketRoundMatch = async (data, session) => {
  try {
    const roundObj = {
      roundNumber: 1,
      roundName: "Final",
      tournamentID: data.tournamentID,
      formatTypeID: data.formatTypeID,
      brackets: "Final Bracket",
      formatName: data.formatType,
      gameType: data.gameType,
      fixingType: data.fixingType,
    };
    let finalBracket = await tournamentRoundsModel.create([roundObj], {
      session,
    });
    if (_.isEmpty(finalBracket)) {
      throw new Error(",not able to create round for final bracket ");
    }
    finalBracket = finalBracket[0];
    const str = "K3";
    const matchObj = {
      name: "Match #" + str + "R" + finalBracket?.roundNumber + "M" + 1,
      tournamentID: data.tournamentID,
      roundID: finalBracket?._id?.toString(),
      formatID: data.formatTypeID,
      bracket: finalBracket?.brackets,
    };
    let finalMatch = await tournamentMatchModel.create([matchObj], { session });

    if (_.isEmpty(finalMatch)) {
      throw new Error(",not able to create final bracket round match");
    }
    finalMatch = finalMatch[0];
    finalBracket.matches = [finalMatch?._id?.toString()];
    finalBracket = await finalBracket.save({ session });
    return {
      finalBracket,
      finalMatch,
    };
  } catch (error) {
    throw new Error(" => error in creating final bracket : " + error?.message);
  }
};

const arrangingTeamsBasedOnFixingType = (fixingType, teams) => {
  try {
    let arrangedTeams = [];
    // let matchFixingType = "random";
    // let matchFixingType = "top_vs_bottom";
    let matchFixingType = fixingType.toLowerCase();

    if (matchFixingType === "top_vs_bottom") {
      let updatedTeams = [];
      let start = 0;
      let end = teams.length - 1;
      while (start <= end) {
        if (start === end) {
          updatedTeams.push(teams[start]);
          start++;
          end--;
        } else if (start < end) {
          updatedTeams.push(teams[start]);
          updatedTeams.push(teams[end]);
          start++;
          end--;
        }
      }
      arrangedTeams = updatedTeams;
    }
    if (matchFixingType === "random" || matchFixingType === "manual") {
      // Generate random sorting metrics proportional to array length
      let randomMetrics = teams.map((item) => ({
        item,
        sortMetric: Math.floor(Math.random() * teams.length),
      }));
      // Sort based on the generated metrics
      randomMetrics.sort((a, b) => a.sortMetric - b.sortMetric);
      // Extract sorted items
      arrangedTeams = randomMetrics.map((item) => item.item);
    }
    if (matchFixingType === "sequential") {
      arrangedTeams = teams;
    }

    return arrangedTeams;
  } catch (error) {
    console.log(
      " => error in arranging teams or participants in starting round",
      error?.message
    );
    throw new Error(error?.message);
  }
};
const addParticipantIntoDoubleKnockoutTournament = async (
  tournament,
  participantName
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let tournamentDetails = await tournamentModel
      .findById(tournament?._id?.toString())
      .session(session);
    let tournamentFormatDetails = await tournamentDoubleFormat
      .findById(tournament?.formatID?.toString())
      .session(session);
    // deleting existing rounds and there tournament matches
     await tournamentRoundsModel
      .deleteMany({
        tournamentID: tournamentDetails?._id,
      })
      .session(session);
    await tournamentMatchModel
      .deleteMany({
        tournamentID: tournamentDetails?._id,
      })
      .session(session);

    // Creating new Participant
    // gameType == team
    let tourID = tournamentDetails?._id?.toString();
    let allParticipantsIds = [];
    if (tournamentDetails?.gameType === "team") {
      const teamObj = {
        tournamentID: tourID,
        teamNumber: tournamentDetails?.totalTeams + 1,
        sportName: tournamentDetails?.sportName,
        name: participantName,
      };
      await tournamentTeamModel.create([teamObj], {
        session: session,
      });
      const teams = await tournamentTeamModel
        .find({ tournamentID: tourID })
        .session(session);
      if (_.isEmpty(teams)) {
        throw new Error(",Error occur in fetching teams in knockout section");
      }
      teams.sort((team1,team2)=>team1?.teamNumber - team2?.teamNumber);
      allParticipantsIds = teams?.map((team) => team?._id?.toString());
      tournamentDetails.totalTeams = allParticipantsIds.length;
      tournamentDetails.teams = allParticipantsIds;
    }
    // gameType == individual
    if (tournamentDetails?.gameType === "individual") {
      const playerObj = {
        tournamentID: tourID,
        playerNumber: tournamentDetails?.totalParticipants + 1,
        sportName: tournamentDetails.sportName,
        name: participantName,
      };
      await tournamentPlayerModel.create([playerObj], {
        session: session,
      });
      const players = await tournamentPlayerModel
        .find({ tournamentID: tourID })
        .session(session);
      if (_.isEmpty(players)) {
        throw new Error(",Error occur in fetching players in knockout section");
      }
      players.sort((player1,player2)=>player1?.playerNumber - player2?.playerNumber);
      allParticipantsIds = players?.map((team) => team?._id?.toString());
      tournamentDetails.totalParticipants = allParticipantsIds.length;
      tournamentDetails.participants = allParticipantsIds;
    }

    // // preparing rounds data and number of matches possible in each round and storing them in roundsData

    let roundsBrackets = getBracketsRoundsAndMatches(allParticipantsIds.length);
    // Forming rounds Data;
    const winnersRoundNames = roundsBrackets?.winnersRoundNames;
    const losersRoundNames = roundsBrackets?.losersRoundNames;
    let losersBrackets = roundsBrackets.losersBrackets?.map((round) => {
      return {
        roundNumber: round?.roundNumber,
        roundName: round?.roundName,
        matches: round?.matches,
        brackets: "losers",
      };
    });
    let winnersBrackets = roundsBrackets.winnersBrackets?.map((round) => {
      return {
        roundNumber: round?.roundNumber,
        roundName: round?.roundName,
        matches: round?.matches,
        brackets: "winners",
      };
    });

    // creating rounds and matches
    // 1. creating rounds and matches for winner brackets

    // Iterating over rounds data and creating rounds and matches respective to rounds and storing them

    let tournamentID = tournament?._id?.toString();
    let formatTypeID = tournamentFormatDetails?._id?.toString();

    const roundsDataPayload = {
      tournamentID: tournamentID,
      formatTypeID: formatTypeID,
      formatType: tournamentDetails?.formatType,
      participantsIds: allParticipantsIds,
      fixingType: tournamentDetails?.fixingType,
      gameType: tournamentDetails?.gameType,
    };
    await createRoundsAndThereMatches(
      roundsDataPayload,
      winnersBrackets,
      session
    );
    await createRoundsAndThereMatches(
      roundsDataPayload,
      losersBrackets,
      session
    );

    // referencing next rounds matches into previous rounds matches to help the winner to move forward in winner Bracket
    let winnersRoundsReferences = await referencingMatchesToNextMatches(
      tournamentID,
      formatTypeID,
      "winners",
      session
    );

    // arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

    const arrangedTeams = arrangingTeamsBasedOnFixingType(
      tournamentDetails?.fixingType,
      allParticipantsIds
    );
    winnersRoundsReferences.sort(
      (round1, round2) => round1?.roundNumber - round2?.roundNumber
    );
    // arranging teams in round 1 only
    if (winnersRoundsReferences[0]?.roundNumber === 1) {
      let index = 0;
      let incrementIndex = 0;
      for (let match of winnersRoundsReferences[0].matches) {
        if (index < arrangedTeams.length) {
          match.teamA = arrangedTeams[index];
          if (index + 1 < arrangedTeams.length) {
            match.teamB = arrangedTeams[index + 1];
            index += 2;
          }
          winnersRoundsReferences[0].matches[incrementIndex] =
            await winnersRoundsReferences[0]?.matches[incrementIndex].save({
              session,
            });
        }
        incrementIndex++;
      }
    }

    // referencing next rounds matches into previous rounds matches to help the winner to move forward in losers bracket
    let losersRoundsReferences = await referencingMatchesToNextMatches(
      tournamentID,
      formatTypeID,
      "losers",
      session
    );
    losersRoundsReferences.sort(
      (round1, round2) => round1?.roundNumber - round2?.roundNumber
    );
    // assigning losers into losers bracket

    losersRoundsReferences = await assigningLosersIntoLosersBracket(
      winnersRoundsReferences,
      losersRoundsReferences,
      session
    );

    const finalObjData = {
      tournamentID: tournamentID,
      formatTypeID: formatTypeID,
      gameType: tournamentDetails?.gameType,
      formatType: tournamentDetails?.formatType,
      fixingType: tournamentDetails?.fixingType,
    };
    const finalBracketData = await creatingFinalBracketRoundMatch(
      finalObjData,
      session
    );

    const finalBracketRound = finalBracketData?.finalBracket;
    let FinalBracketMatch = finalBracketData?.finalMatch;

    const winnersLastRound = winnersRoundsReferences.length;
    winnersRoundsReferences[winnersLastRound - 1].matches[0].nextMatch =
      FinalBracketMatch?._id?.toString();
    FinalBracketMatch.matchA =
      winnersRoundsReferences[winnersLastRound - 1].matches[0]?._id?.toString();

    let losersLastRound = losersRoundsReferences.length;
    losersRoundsReferences[losersLastRound - 1].matches[0].nextMatch =
      FinalBracketMatch?._id?.toString();
    FinalBracketMatch.matchB =
      losersRoundsReferences[losersLastRound - 1].matches[0]?._id?.toString();

    winnersRoundsReferences[winnersLastRound - 1].matches[0] =
      await winnersRoundsReferences[winnersLastRound - 1].matches[0].save({
        session,
      });
    losersRoundsReferences[losersLastRound - 1].matches[0] =
      await losersRoundsReferences[losersLastRound - 1].matches[0].save({
        session,
      });
    FinalBracketMatch = await FinalBracketMatch.save({ session });

    let winnersRoundsIDs = winnersRoundsReferences?.map((round) =>
      round?._id?.toString()
    );
    let losersRoundsIDs = losersRoundsReferences?.map((round) =>
      round?._id?.toString()
    );
    let finalRoundID = [finalBracketRound?._id?.toString()];
    tournamentFormatDetails.totalWinnersRounds = winnersRoundsIDs.length;
    tournamentFormatDetails.totalLosersRounds = losersRoundsIDs.length;
    tournamentFormatDetails.winnersRoundsNames = winnersRoundNames;
    tournamentFormatDetails.losersRoundsNames = losersRoundNames;

    tournamentFormatDetails.winnersRoundsIds = winnersRoundsIDs;
    tournamentFormatDetails.losersRoundsIds = losersRoundsIDs;
    tournamentFormatDetails.finalRoundId = finalRoundID;
    if (tournamentFormatDetails?.gameType === "team") {
      tournamentFormatDetails.totalTeams = allParticipantsIds.length;
      tournamentFormatDetails.teams = allParticipantsIds;
    }
    if (tournamentFormatDetails?.gameType === "individual") {
      tournamentFormatDetails.totalParticipants = allParticipantsIds.length;
      tournamentFormatDetails.participants = allParticipantsIds;
    }
    tournamentFormatDetails = await tournamentFormatDetails.save({ session });
    tournamentDetails.formatID = tournamentFormatDetails?._id?.toString();
    tournamentDetails = await tournamentDetails.save({ session });
    const responsePayload = {
      tournament: tournamentDetails,
    };
    await session.commitTransaction();
    await session.endSession();
    return responsePayload;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log(
      "error in createTournament double knockout controller",
      error?.message
    );
    throw new Error(
      "Error in creation of double knockout tournament" + error?.message
    );
  }
};

module.exports = addParticipantIntoDoubleKnockoutTournament;
