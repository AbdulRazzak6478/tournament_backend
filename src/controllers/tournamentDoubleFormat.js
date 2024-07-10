const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentModel = require("../models/tournament");
const tournamentTeamModel = require("../models/team");
const doubleKnockoutModel = require("../models/doubleFormat");
const roundModel = require("../models/Rounds");
const matchModel = require("../models/matches");
const tournamentPlayerModel = require("../models/participents");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");
const mongoose = require("mongoose");
const { toInteger } = require("lodash");
const _ = require("lodash");

const getRoundsAndMatchesForBrackets = (participants) => {
  try {
    let roundData = [];
    const totalRounds = Math.ceil(Math.log2(participants));
    const roundNames = [];

    console.log("participants : ", participants);
    console.log("total : ", totalRounds);

    let tourTeams = participants;
    let roundType = "";
    let loserBrackets = [];
    const roundMatchMap = new Map();
    const roundWinnerMap = new Map();
    for (let i = 1; i <= totalRounds; i++) {
      if (i === totalRounds) {
        roundNames.push("Final");
      } else {
        roundType =
          i === totalRounds - 1
            ? "Semi Final"
            : i === totalRounds - 2
            ? "Quarter Final"
            : `Qualification Round ${i}`;
        roundNames.push(roundType);
      }
      if (tourTeams % 2 !== 0) {
        let matches = Math.round(tourTeams / 2);
        roundWinnerMap.set(i, Math.floor(tourTeams / 2));
        let winners = Math.floor(tourTeams / 2);
        console.log(
          "round : ",
          i,
          " , matches : ",
          matches,
          " , winners : ",
          winners
        );

        // previous round winner equal to present round matches then no need to send into loser
        let losers = matches === roundWinnerMap.get(i - 1) ? true : false;
        if (i == 1) {
          const loserMatches = Math.round(matches / 2);
          const loserMatchesWinner = Math.floor(matches / 2);
          const loserObj = {
            round: i,
            matches: loserMatches,
            winners: loserMatchesWinner,
            brackets: "losers",
          };
          loserBrackets.push(loserObj);
          console.log("loser Obj : ", loserObj);
        } else {
          console.log(
            "previous : ",
            toInteger(loserBrackets[i - 2]?.winners),
            loserBrackets[i - 2]
          );
          let loserMatches = 0;
          let loserMatchesWinner = 0;
          if (losers && i === totalRounds) {
            loserMatches = Math.round(
              toInteger(loserBrackets[i - 2]?.winners) / 2
            );
            loserMatchesWinner = Math.floor(
              toInteger(loserBrackets[i - 2]?.winners) / 2
            );
          } else {
            loserMatches = Math.round(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
            loserMatchesWinner = Math.floor(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
          }
          const loserObj = {
            round: i,
            matches: loserMatches,
            brackets: "losers",
            winners: loserMatchesWinner,
          };
          loserBrackets.push(loserObj);
          console.log("looser Obj : ", loserObj);
        }
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        let obj = {
          roundNumber: i,
          roundName: roundNames[i - 1],
          brackets: "winners",
          matches: roundMatchMap.get(i),
        };
        roundData.push(obj);
      } else if (tourTeams % 2 === 0) {
        let matches = Math.round(tourTeams / 2);
        roundWinnerMap.set(i, Math.floor(tourTeams / 2));
        let winners = Math.floor(tourTeams / 2);
        console.log(
          "round : ",
          i,
          " , matches : ",
          matches,
          " , winners : ",
          winners
        );
        let losers = matches === roundWinnerMap.get(i - 1) ? true : false;
        console.log("end : ", losers);
        if (i == 1) {
          const loserMatches = Math.round(matches / 2);
          const loserMatchesWinner = Math.floor(matches / 2);
          const loserObj = {
            round: i,
            matches: loserMatches,
            winners: loserMatchesWinner,
            brackets: "losers",
          };
          loserBrackets.push(loserObj);
          console.log("loser Obj : ", loserObj);
        } else {
          console.log(
            "previous : ",
            toInteger(loserBrackets[i - 2]?.winners),
            loserBrackets[i - 2]
          );
          let loserMatches = 0;
          let loserMatchesWinner = 0;
          if (losers && i === totalRounds) {
            loserMatches = Math.round(
              toInteger(loserBrackets[i - 2]?.winners) / 2
            );
            loserMatchesWinner = Math.floor(
              toInteger(loserBrackets[i - 2]?.winners) / 2
            );
          } else {
            loserMatches = Math.round(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
            loserMatchesWinner = Math.floor(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
          }
          const loserObj = {
            round: i,
            matches: loserMatches,
            brackets: "losers",
            winners: loserMatchesWinner,
          };
          loserBrackets.push(loserObj);
          console.log("loser Obj : ", loserObj);
        }
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        let obj = {
          roundNumber: i,
          roundName: roundNames[i - 1],
          brackets: "winners",
          matches: roundMatchMap.get(i),
        };
        roundData.push(obj);
      }
    }
    let length = loserBrackets.length;
    let losersWinners = loserBrackets[length - 1].winners;
    while (losersWinners > 1) {
      length = loserBrackets.length;
      let matches = Math.round(losersWinners / 2);
      let winners = Math.floor(losersWinners / 2);
      const loserObj = {
        round: loserBrackets[length - 1].round + 1,
        brackets: "losers",
        matches: matches,
        winners: winners,
      };
      loserBrackets.push(loserObj);
      losersWinners = Math.floor(losersWinners / 2);
    }
    let loserRoundType = "";
    let losersRoundsNames = [];
    for (let i = 1; i <= loserBrackets.length; i++) {
      if (i === loserBrackets.length) {
        losersRoundsNames.push("Final");
      } else {
        loserRoundType =
          i === loserBrackets.length - 1
            ? "Semi Final"
            : i === loserBrackets.length - 2
            ? "Quarter Final"
            : `Qualification Round ${i}`;
        losersRoundsNames.push(loserRoundType);
      }
      loserBrackets[i - 1].roundName = losersRoundsNames[i - 1];
    }
    console.log("winners rounds map  : ", roundMatchMap);
    //   console.log("winners rounds data  : ", roundData);
    console.log("losers rounds data  : ", loserBrackets);
    return {
      totalRounds: totalRounds,
      roundNames: roundNames,
      losersBrackets: loserBrackets,
      winnersBrackets: roundData,
    };
  } catch (error) {
    throw new Error(
      " => error in making rounds and matches for both winners and losers brackets  : => " +
        error?.message
    );
  }
};

const createRoundsAndThereMatches = async (
  tournamentID,
  formatTypeID,
  formatType,
  participantsIds,
  bracketRounds,
  session
) => {
  try {
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
      };
      if (roundData.roundNumber === 1 && roundData.brackets === "winners") {
        data1.participants = participantsIds;
      }
      let round = await roundModel.create([data1], { session: session });
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
        const str = round?.brackets === 'winners'? "K1" : "k2";
        const matchObj = {
          name: "Match #"+str+" R" + round?.roundNumber + " M" + matchData,
          tournamentID: tournamentID,
          roundID: round?._id?.toString(),
          formatID: formatTypeID,
        };
        allMatches.push(matchObj);
      }
      const matches = await matchModel.create(allMatches, { session: session }); // creating matches

      matchIds = matches?.map((match) => match?._id?.toString());
      round?.matches.push(...matchIds); // storing matches ids
      round = await round.save({ session });
      roundsAndMatches.push(round);
    }
    console.log("rounds length : ", roundsAndMatches.length);
    return roundsAndMatches;
  } catch (error) {
    throw new Error(
      " => error in creating rounds and matches in double knockout : " +
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
    let allRoundsData = await roundModel
      .find({
        tournamentID: tournamentID,
        formatTypeID: formatTypeID,
        brackets: bracket,
      })
      .populate("matches")
      .session(session);
    // console.log("all rounds : ", allRoundsData);
    // return allRoundsData;
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
      // let roundMatches = await matchModel
      //   .find({
      //     _id: roundMatchIdsMap.get(round),
      //   })
      //   .session(session);
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
      if (prevRoundMatchesIds.length % 2 !== 0) {
        const matchA = prevRoundMatchesIds[prevRoundMatchesIds.length - 1];
        const matchB = prevRoundMatchesIds[1];
        allRoundsData[i - 1].matches[0].matchA = matchA;
        allRoundsData[i - 1].matches[0].matchB = matchB;
        allRoundsData[i - 1].matches[0] = await allRoundsData[
          i - 1
        ].matches[0].save({ session });
        let index = 2;
        for (let match = 1; match < currentRoundMatches.length; match++) {
          // matchData.matchA = prevRoundMatchesIds[]
          if (
            index !== prevRoundMatchesIds.length - 1 &&
            index < prevRoundMatchesIds.length
          ) {
            currentRoundMatches[match].matchA = prevRoundMatchesIds[index];
            if (index + 1 < prevRoundMatchesIds.length - 1) {
              currentRoundMatches[match].matchB =
                prevRoundMatchesIds[index + 1];
              index = index + 2;
            } else {
              index++;
            }
          }
          currentRoundMatches[match] = await currentRoundMatches[match].save({
            session,
          });
        }
        console.log("matchA : " + matchA + ", matchB : " + matchB);
      } else {
        // const matchA = prevRoundMatchesIds[0];
        // const matchB = prevRoundMatchesIds[1];
        let index = 0;
        for (let match = 0; match < currentRoundMatches.length; match++) {
          if (index < prevRoundMatchesIds.length) {
            currentRoundMatches[match].matchA = prevRoundMatchesIds[index];
            if (index + 1 < prevRoundMatchesIds.length) {
              currentRoundMatches[match].matchB =
                prevRoundMatchesIds[index + 1];
              index = index + 2;
            } else {
              index++;
            }
          }
          currentRoundMatches[match] = await currentRoundMatches[match].save({
            session,
          });
        }
        // console.log("matchA : " + matchA + ", matchB : " + matchB);
      }
    }
    console.log("hello", rounds);
    return allRoundsData;
  } catch (error) {
    throw new Error(
      " => error in referencing next matches to previous : " + error?.message
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
          loserRound.brackets +
          ",and matches : " +
          loserRound.matches.length
      );
      let index = 0;
      for (let match = 0; match < loserRound.matches.length; match++) {
        if (index < winnersBracket[round].matches.length) {
          if (!loserRound.matches[match].matchA) {
            loserRound.matches[match].matchA =
              winnersBracket[round].matches[index]?._id?.toString();
            index++;
            // if(index + 1 < winnersBracket[round].matches.length){
            //   if(!loserRound.matches[match].matchB){
            //     loserRound.matches[match].matchB = winnersBracket[round].matches[index+1]?._id?.toString();
            //   }
            // }
          }
          if (
            !loserRound.matches[match].matchB &&
            index < winnersBracket[round].matches.length
          ) {
            loserRound.matches[match].matchB =
              winnersBracket[round].matches[index]?._id?.toString();
            index++;
          }
          loserRound.matches[match] = await loserRound.matches[match].save({
            session,
          });
        }
      }
      round++;
    }

    console.log("losers Rounds length : ", losersBracket.length);
    return losersBracket;
  } catch (error) {
    throw new Error(
      " => getting error in assigning losers in loser bracket : " +
        error?.message
    );
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
    console.log("error in creating teams", error?.message);
    throw new Error(error?.message);
  }
};
const createDoubleEliminationTournament = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Getting Random string for storing it into tournament => tournamentID  ||  unique to tournament
    const str = "abcdefghijklmnopqrstuvwxyz";
    let random = "";
    let n = str.length;
    for (let i = 0; i < n; i++) {
      const index = Math.floor(Math.random() * (n - 1));
      random += str.charAt(index);
    }
    console.log("random tournament id : ", random);
    console.log("req.body : ", req.body);
    const data = {
      formatType: req.body.formatType,
      fixingType: req.body.fixingType,
      gameType: req.body.gameType,
      participants: +req.body.participants,
    };
    console.log("data payload : ", data);
    // Getting number of rounds possible in tournament
    let roundsBrackets = getRoundsAndMatchesForBrackets(data.participants);

    // tournament data Payload
    // const tournamentData = {
    //   tournamentID: random,
    //   formatName: data.formatType,
    //   fixingType: data.fixingType,
    //   gameType: data.gameType,
    //   totalRounds: roundsBrackets?.totalRounds,
    //   roundNames: roundsBrackets?.roundNames,
    //   // totalTeams: data.teams,
    // };

    // if (data.gameType === "team") {
    //   tournamentData.totalTeams = data.participants;
    // }
    // if (data.gameType === "individual") {
    //   tournamentData.totalParticipants = data.participants;
    // }

    // console.log("tour data : ", tournamentData);
    // let tournament = await tournamentModel.create([tournamentData], {
    //   session: session,
    // });
    // if (_.isEmpty(tournament)) {
    //   throw new Error(" not able to create tournament");
    // }
    // console.log("tournament created : ", tournament);
    // tournament = tournament[0];

    // let participantsIds = [];
    // const tourId = tournament?._id?.toString();
    // if (data.gameType === "team") {
    //   let teamsObjData = [];
    //   for (let i = 1; i <= data.participants; i++) {
    //     let obj = {
    //       tournamentID: tourId,
    //       teamNumber: i,
    //       sportName: data.sport,
    //       name: "Team #" + i,
    //     };
    //     teamsObjData.push(obj);
    //   }

    //   // creating teams in one time only and passing session into it

    //   const teams = await tournamentTeamModel.create([...teamsObjData], {
    //     session: session,
    //   });
    //   let teamsIds = teams?.map((team) => team?._id?.toString());
    //   console.log("teams ids : ", teamsIds);
    //   // if we have team ids storing and saving into tournament model
    //   if (teamsIds.length > 0) {
    //     tournament.teams = teamsIds;
    //     tournament = await tournament.save({ session });
    //   }
    //   participantsIds = teamsIds;
    // }

    // if (data.gameType === "individual") {
    //   let playersObjData = [];
    //   for (let i = 1; i <= data.participants; i++) {
    //     let obj = {
    //       // tournamentID: tourId,
    //       // playerNumber: i,
    //       // sportName: data.sport,
    //       name: "Player #" + i,
    //     };
    //     playersObjData.push(obj);
    //   }

    //   // creating players in one time only and passing session into it

    //   const players = await tournamentPlayerModel.create([...playersObjData], {
    //     session: session,
    //   });
    //   let playersIds = players?.map((player) => player?._id?.toString());
    //   console.log("players ids : ", playersIds);
    //   // if we have players ids storing and saving into tournament model
    //   if (playersIds.length > 0) {
    //     tournament.participants = playersIds;
    //     tournament = await tournament.save({ session });
    //   }
    //   participantsIds = playersIds;
    // }

    // // formatData Payload
    // const totalWinnersRounds = roundsBrackets.totalRounds;
    // const totalLosersRounds = roundsBrackets?.losersBrackets.length;
    // const winnersRoundsNames = roundsBrackets?.roundNames;
    // const losersRoundsNames = roundsBrackets?.losersBrackets?.map(
    //   (round) => round?.roundName
    // );
    // const formatData = {
    //   tournamentID: tournament?._id?.toString(),
    //   formatType: data.formatType,
    //   fixingType: data.fixingType,
    //   gameType: data.gameType,
    //   totalWinnersRounds,
    //   totalLosersRounds,
    //   winnersRoundsNames,
    //   losersRoundsNames,
    //   finalRoundName: "Final",
    //   totalTeams: data.participants,
    //   // totalParticipants,
    //   teams: participantsIds,
    //   //   participants,
    // };
    // console.log("double format data : ", formatData);
    // // creating tournament format
    // let tournamentFormat = await doubleKnockoutModel.create([formatData], {
    //   session: session,
    // });
    // console.log("tournament format created: ", tournamentFormat);
    // tournamentFormat = tournamentFormat[0];

    // let losersBrackets = roundsBrackets.losersBrackets?.map((round) => {
    //   return {
    //     roundNumber: round?.round,
    //     roundName: round?.roundName,
    //     matches: round?.matches,
    //     brackets: round?.brackets,
    //   };
    // });
    // let winnersBrackets = roundsBrackets.winnersBrackets;

    // // creating rounds and matches
    // // 1. creating rounds and matches for winner brackets

    // // Iterating over rounds data and creating rounds and matches respective to rounds and storing them

    // let tournamentID = tournament?._id?.toString();
    // let formatTypeID = tournamentFormat?._id?.toString();

    // let winnersRoundsAndMatches = await createRoundsAndThereMatches(
    //   tournamentID,
    //   formatTypeID,
    //   data.formatType,
    //   participantsIds,
    //   winnersBrackets,
    //   session
    // );
    // let losersRoundsAndMatches = await createRoundsAndThereMatches(
    //   tournamentID,
    //   formatTypeID,
    //   data.formatType,
    //   participantsIds,
    //   losersBrackets,
    //   session
    // );

    // referencing next rounds matches into previous rounds matches to help the winner to move forward
    let tournamentID = "668e3f0bac1e3db0418e870c";
    let formatTypeID = "668e3f0bac1e3db0418e871f";
    let winnersRoundsReferences = await referencingMatchesToNextMatches(
      tournamentID,
      formatTypeID,
      "winners",
      session
    );
    let losersRoundsReferences = await referencingMatchesToNextMatches(
      tournamentID,
      formatTypeID,
      "losers",
      session
    );

    // assigning losers into losers bracket

    losersRoundsReferences = await assigningLosersIntoLosersBracket(
      winnersRoundsReferences,
      losersRoundsReferences,
      session
    );

    SuccessResponse.data = {
      // tournament: tournament,
      // FormData: formatData,
      // tournamentFormat,
      // winnersRoundsAndMatches,
      // losersRoundsAndMatches,
      // losersBrackets: losersBrackets,
      // winnersBrackets: winnersBrackets,
      winnersRoundsReferences,
      losersRoundsReferences,
    };
    await session.commitTransaction();
    await session.endSession();
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log("error in createTournament controller", error, error?.message);
    ErrorResponse.error = new AppError(
      `error in creating createTournament :  ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  createDoubleEliminationTournament,
};
