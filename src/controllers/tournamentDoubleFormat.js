const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentModel = require("../models/tournament");
const teamModel = require("../models/team");
const knockoutModel = require("../models/knockoutFormat");
const roundModel = require("../models/Rounds");
const matchModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");
const mongoose = require("mongoose");
const { toInteger } = require("lodash");

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
      teams: +req.body.totalTeams,
    };
    console.log("data payload : ", data);
    // Getting number of rounds possible in tournament
    
    // tournament data Payload
    const tournamentData = {
        tournamentID: random,
        formatName: data.formatType,
        fixingType: data.fixingType,
        gameType: data.gameType,
        totalRounds: totalRounds,
        roundNames: roundNames,
        totalTeams: data.teams,
      };
  
      console.log("tour data : ", tournamentData);
      let tournament = await tournamentModel.create([tournamentData], {
        session: session,
      });
      console.log("tournament created : ", tournament);
      tournament = tournament[0];
  
      // creating Teams array to iterate
      let newArray = Array.from(
        new Array(data.teams),
        (value, index) => index + 1
      );
    

    let roundsBrackets = getRoundsAndMatchesForBrackets(data.teams);

    let losersBrackets = roundsBrackets.losersBrackets?.map((round)=>{
        return {
            roundNumber : round?.round,
            roundName : round?.roundName,
            matches : round?.matches,
            brackets : round?.brackets,
        }
    });
    let winnersBrackets = roundsBrackets.winnersBrackets;

    SuccessResponse.data = {
      losersBrackets: losersBrackets,
      winnersBrackets: winnersBrackets,
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
