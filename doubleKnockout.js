const { toInteger } = require("lodash");

let roundData = [];
function calculateRoundsAndNames() {
  // 6,
  let teams = 12;
  const totalRounds = Math.ceil(Math.log2(teams));
  const roundNames = [];

  console.log("teams : ", teams);
  console.log("total : ", totalRounds);

  let tourTeams = teams;
  let roundType = "";
  let looserBrackets = [];
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
      roundWinnerMap.set(i,Math.floor(tourTeams / 2));
      let winners = Math.floor(tourTeams / 2);
      console.log("round : ", i, " , matches : ", matches,' , winners : ',winners);

      // previous round winner equal to present round matches then no need to send into loser 
      let losers = matches === roundWinnerMap.get(i-1)? true : false;
      console.log('end : ',losers);
      if (i == 1) {
        const looserMatches = Math.round(matches / 2);
        const looserMatchesWinner = Math.floor(matches / 2);
        const looserObj = {
          round: i,
          matches: looserMatches,
          winners: looserMatchesWinner,
        };
        looserBrackets.push(looserObj);
        console.log("looser Obj : ", looserObj);
      } else {
        console.log(
          "previous : ",
          toInteger(looserBrackets[i - 2]?.winners),
          looserBrackets[i - 2]
        );
        let looserMatches = 0;
        let looserMatchesWinner = 0;
        if (losers && i === totalRounds) {
          looserMatches = Math.round(
            toInteger(looserBrackets[i - 2]?.winners) / 2
          );
          looserMatchesWinner = Math.floor(
            toInteger(looserBrackets[i - 2]?.winners) / 2
          );
        } else {
          looserMatches = Math.round(
            (toInteger(looserBrackets[i - 2]?.winners) + matches) / 2
          );
          looserMatchesWinner = Math.floor(
            (toInteger(looserBrackets[i - 2]?.winners) + matches) / 2
          );
        }
        const looserObj = {
          round: i,
          matches: looserMatches,
          winners: looserMatchesWinner,
        };
        looserBrackets.push(looserObj);
        console.log("looser Obj : ", looserObj);
      }
      tourTeams = Math.floor(tourTeams / 2);
      roundMatchMap.set(i, matches);
      let obj = {
        roundNumber: i,
        roundName: roundNames[i - 1],
        tourId: "tourID",
        formatId: "formatID",
        matches: roundMatchMap.get(i),
      };
      roundData.push(obj);
    } else if (tourTeams % 2 === 0) {
      let matches = Math.round(tourTeams / 2);
      roundWinnerMap.set(i,Math.floor(tourTeams / 2));
      let winners = Math.floor(tourTeams / 2);
      console.log("round : ", i, " , matches : ", matches,' , winners : ',winners);
      let losers = matches === roundWinnerMap.get(i-1) ? true : false;
      console.log('end : ',losers);
      if (i == 1) {
        const looserMatches = Math.round(matches / 2);
        const looserMatchesWinner = Math.floor(matches / 2);
        const looserObj = {
          round: i,
          matches: looserMatches,
          winners: looserMatchesWinner,
        };
        looserBrackets.push(looserObj);
        console.log("looser Obj : ", looserObj);
      } else {
        console.log(
          "previous : ",
          toInteger(looserBrackets[i - 2]?.winners),
          looserBrackets[i - 2]
        );
        let looserMatches = 0;
        let looserMatchesWinner = 0;
        if (losers && i === totalRounds) {
          looserMatches = Math.round(
            toInteger(looserBrackets[i - 2]?.winners) / 2
          );
          looserMatchesWinner = Math.floor(
            toInteger(looserBrackets[i - 2]?.winners) / 2
          );
        } else {
          looserMatches = Math.round(
            (toInteger(looserBrackets[i - 2]?.winners) + matches) / 2
          );
          looserMatchesWinner = Math.floor(
            (toInteger(looserBrackets[i - 2]?.winners) + matches) / 2
          );
        }
        const looserObj = {
          round: i,
          matches: looserMatches,
          winners: looserMatchesWinner,
        };
        looserBrackets.push(looserObj);
        console.log("looser Obj : ", looserObj);
      }
      tourTeams = Math.floor(tourTeams / 2);
      roundMatchMap.set(i, matches);
      let obj = {
        roundNumber: i,
        roundName: roundNames[i - 1],
        tourId: "tourID",
        formatId: "formatID",
        matches: roundMatchMap.get(i),
      };
      roundData.push(obj);
    }
  }
  let length = looserBrackets.length;
  let losersWinners = looserBrackets[length - 1].winners;
  while (losersWinners > 1) {
    length = looserBrackets.length;
    let matches = Math.round(losersWinners / 2);
    let winners = Math.floor(losersWinners / 2);
    const loserObj = {
      round: looserBrackets[length - 1].round + 1,
      matches: matches,
      winners: winners,
    };
    looserBrackets.push(loserObj);
    losersWinners = Math.floor(losersWinners / 2);
  }
  let loserRoundType = "";
  let losersRoundsNames = [];
  for (let i = 1; i <= looserBrackets.length; i++) {
    if (i === looserBrackets.length) {
      losersRoundsNames.push("Final");
    } else {
      loserRoundType =
        i === looserBrackets.length - 1
          ? "Semi Final"
          : i === looserBrackets.length - 2
          ? "Quarter Final"
          : `Qualification Round ${i}`;
      losersRoundsNames.push(loserRoundType);
      // console.log(roundNames[i-1]);
    }
    looserBrackets[i - 1].roundName = losersRoundsNames[i - 1];
  }
  console.log("rounds names : ", roundNames);
  console.log("winners rounds map  : ", roundMatchMap);
  //   console.log("winners rounds data  : ", roundData);
  console.log("losers rounds data  : ", looserBrackets);
}

calculateRoundsAndNames();
