const categoriesModel = require("../../../../models/categories");
const subCategoriesModel = require("../../../../models/subCategories");
const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentRoundsModel = require("../../../../models/tournamentRounds");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentDoubleFormat = require("../../../../models/tournamentDoubleFormat");
const tournamentIdModel = require("../../../../models/tournamentIds");
const mongoose = require("mongoose");
const _ = require("lodash");

const generateTournamentId = async () => {
  const count = await tournamentIdModel.find({});
  const newId = `GBT${(count.length + 1).toString().padStart(6, "0")}`;
  console.log("tournament unique id : ", newId);
  return newId;
};
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
    console.log("participants : ", participants);
    console.log("total : ", totalRounds);

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
        losersMatches,
        losersWinners,
        losersBracketLosers,
      };
      losersBrackets.push(losersObj);
      winners = losersMatches;
    }
    winnersBrackets = getRoundsNamesForBrackets(winnersBrackets);
    losersBrackets = getRoundsNamesForBrackets(losersBrackets);
    console.log("winners brackets data : ", winnersBrackets);
    console.log("losers brackets data : ", losersBrackets);
    const winnersRoundNames = winnersBrackets?.map(
      (bracket) => bracket?.roundName
    );
    const losersRoundNames = losersBrackets?.map(
      (bracket) => bracket?.roundName
    );
    console.log("winners round names : ", winnersRoundNames);
    console.log("losersRoundNames round names : ", losersRoundNames);
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
    console.log("rounds length : ", roundsAndMatches.length);
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
    console.log("round matches ids map : ", roundMatchIdsMap);

    // iterating over the rounds and there matches to add reference of next rounds matches
    for (let round of rounds) {
      let roundMatches = allRoundsData[round - 1].matches;
      console.log("round : ", round, " , matches : ", roundMatches.length);

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
      console.log(
        "previous rounds matches ids  : ",
        roundMatchIdsMap.get(i - 1)
      );
      let prevRoundMatchesIds = roundMatchIdsMap.get(i - 1);
      let currentRoundMatches = allRoundsData[i - 1].matches;
      console.log(
        "current round matches length : ",
        currentRoundMatches.length
      );
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
      console.log(
        "loser round " +
          loserRound.roundNumber +
          ",and matches : " +
          loserRound.matches.length
      );
      let index = 0;
      if (round == 0) {
        console.log("loser bracket round 1 : ", loserRound);
      }
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
      if (round == 0) {
        console.log("trigger in ", index, loserRound.matches);
      }
      round++;
    }

    console.log("losers Rounds length : ", losersBracket.length);

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
      console.log("randomMetrics before sort: ", randomMetrics);
      randomMetrics.sort((a, b) => a.sortMetric - b.sortMetric);
      console.log("randomMetrics after sort : ", randomMetrics);
      // Extract sorted items
      arrangedTeams = randomMetrics.map((item) => item.item);
    }
    if (matchFixingType === "sequential") {
      arrangedTeams = teams;
    }

    console.log(matchFixingType, " : ", arrangedTeams);
    return arrangedTeams;
  } catch (error) {
    console.log(
      " => error in arranging teams or participants in starting round",
      error?.message
    );
    throw new Error(error?.message);
  }
};
const createDoubleEliminationTournament = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Getting unique id for tournament
    data.participants = +data.participants;
    console.log("data in double creation : ", data);

    let tournamentUniqueID = await generateTournamentId();
    console.log("tournament unique id : ", tournamentUniqueID);
    // if (tournamentUniqueID) {
    //   throw new Error(", tournamentID is created");
    // }

    // categories section

    let mainCategory = await categoriesModel
      .findById(data?.mainCategoryID)
      .session(session);
    if (_.isEmpty(mainCategory)) {
      throw new Error("main category not found");
    }
    let subCategory = await subCategoriesModel
      .findById(data?.subCategoryID)
      .session(session);
    if (_.isEmpty(subCategory)) {
      throw new Error("sub category not found");
    }

    // tournament data Payload
    const tournamentData = {
      tournamentID: tournamentUniqueID,
      mainCategoryID: mainCategory?._id?.toString(),
      mainCategoryName: mainCategory?.categoryName,
      subCategoryID: subCategory?._id?.toString(),
      subCategoryName: subCategory?.subCategoryName,
      sportName: data.sport,
      formatName: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
    };
    if (data.gameType === "team") {
      tournamentData.totalTeams = data.participants;
    }
    if (data.gameType === "individual") {
      tournamentData.totalParticipants = data.participants;
    }

    let tournament = await tournamentModel.create([tournamentData], {
      session: session,
    });
    if (_.isEmpty(tournament)) {
      throw new Error(" not able to create tournament");
    }
    tournament = tournament[0];

    // creating record of tournamentId in  model
    const uniqueId = await tournamentIdModel.create(
      [{ tournamentID: tournamentUniqueID }],
      { session: session }
    );
    console.log("tournament Unique id : ", uniqueId);

    let participantsIds = [];
    const tourId = tournament?._id?.toString();
    if (data.gameType === "team") {
      let teamsObjData = [];
      for (let i = 1; i <= data.participants; i++) {
        let obj = {
          tournamentID: tourId,
          teamNumber: i,
          sportName: data.sport,
          name: "Team #" + i,
        };
        teamsObjData.push(obj);
      }

      // creating teams in one time only and passing session into it

      const teams = await tournamentTeamModel.create([...teamsObjData], {
        session: session,
      });
      if (_.isEmpty(teams)) {
        throw new Error(",not able to create teams");
      }
      let teamsIds = teams?.map((team) => team?._id?.toString());
      // if we have team ids storing and saving into tournament model
      tournament.teams = teamsIds;
      tournament = await tournament.save({ session });
      participantsIds = teamsIds;
    }

    if (data.gameType === "individual") {
      let playersObjData = [];
      for (let i = 1; i <= data.participants; i++) {
        let obj = {
          tournamentID: tourId,
          playerNumber: i,
          sportName: data.sport,
          name: "Player #" + i,
        };
        playersObjData.push(obj);
      }

      // creating players in one time only and passing session into it

      const players = await tournamentPlayerModel.create([...playersObjData], {
        session: session,
      });
      if (_.isEmpty(players)) {
        throw new Error(",not able to create players");
      }
      let playersIds = players?.map((player) => player?._id?.toString());
      // if we have players ids storing and saving into tournament model
      tournament.participants = playersIds;
      tournament = await tournament.save({ session });
      participantsIds = playersIds;
    }

    // Getting number of rounds possible in tournament
    let roundsBrackets = getBracketsRoundsAndMatches(data.participants);

    // formatData Payload
    const totalWinnersRounds = roundsBrackets?.winnersBrackets.length;
    const totalLosersRounds = roundsBrackets?.losersBrackets.length;
    const winnersRoundsNames = roundsBrackets?.winnersRoundNames;
    const losersRoundsNames = roundsBrackets?.losersRoundNames;
    const formatData = {
      tournamentID: tournament?._id?.toString(),
      formatName: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
      totalWinnersRounds,
      totalLosersRounds,
      winnersRoundsNames,
      losersRoundsNames,
      finalRoundName: "Final",
    };
    if (data.gameType === "team") {
      formatData.totalTeams = data.participants;
      formatData.teams = participantsIds;
    } else {
      formatData.totalParticipants = data.participants;
      formatData.participants = participantsIds;
    }
    console.log("double format data : ", formatData);
    // creating tournament format
    let tournamentFormat = await tournamentDoubleFormat.create([formatData], {
      session: session,
    });
    tournamentFormat = tournamentFormat[0];
    console.log("tournament format created: ", tournamentFormat);

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
    let formatTypeID = tournamentFormat?._id?.toString();

    const roundsDataPayload = {
      tournamentID: tournamentID,
      formatTypeID: formatTypeID,
      formatType: data.formatType,
      participantsIds,
      fixingType: data.fixingType,
      gameType: data.gameType,
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
      data.fixingType,
      participantsIds
    );
    console.log(
      "arranged Teams length : ",
      arrangedTeams,
      arrangedTeams.length
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
      gameType: data.gameType,
      formatType: data.formatType,
      fixingType: data.fixingType,
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

    console.log("final round : ", finalBracketRound);
    console.log("final match : ", FinalBracketMatch);

    let winnersRoundsIDs = winnersRoundsReferences?.map((round) =>
      round?._id?.toString()
    );
    let losersRoundsIDs = losersRoundsReferences?.map((round) =>
      round?._id?.toString()
    );
    let finalRoundID = [finalBracketRound?._id?.toString()];
    console.log("winners ids : ", winnersRoundsIDs);
    console.log("losers ids : ", losersRoundsIDs);
    console.log("final ids : ", finalRoundID);
    tournamentFormat.winnersRoundsIds = winnersRoundsIDs;
    tournamentFormat.losersRoundsIds = losersRoundsIDs;
    tournamentFormat.finalRoundId = finalRoundID;
    tournamentFormat = await tournamentFormat.save({ session });
    tournament.formatID = tournamentFormat?._id?.toString();
    tournament = await tournament.save({ session });
    const responsePayload = {
      tournament: tournament,
    };
    // console.log("responsePayload : ", responsePayload);
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

module.exports = createDoubleEliminationTournament;
