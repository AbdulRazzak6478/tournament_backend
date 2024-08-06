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
            console.log(
              "toInteger toInteger(loserBrackets[i-2]?.winners) / 2 : ",
              (toInteger(loserBrackets[i - 2]?.winners) + 1) / 2
            );
          }
          // else if (!losers && i === totalRounds) {
          //   if (toInteger(loserBrackets[i - 2]?.winners) > 1) {
          //     loserMatches = Math.round(
          //       toInteger(loserBrackets[i - 2]?.winners) / 2
          //     );
          //     loserMatchesWinner = Math.floor(
          //       toInteger(loserBrackets[i - 2]?.winners) / 2
          //     );
          //     let loserObj = {
          //       round: i,
          //       matches: loserMatches,
          //       brackets: "losers",
          //       winners: loserMatchesWinner,
          //     };
          //     loserBrackets.push(loserObj);
          //     loserMatches = Math.round(
          //       (toInteger(loserBrackets[i - 1]?.winners) + matches) / 2
          //     );
          //     loserMatchesWinner = Math.floor(
          //       (toInteger(loserBrackets[i - 1]?.winners) + matches) / 2
          //     );
          //     // i=i+1;
          //     loserObj = {
          //       round: i + 1,
          //       matches: loserMatches,
          //       brackets: "losers",
          //       winners: loserMatchesWinner,
          //     };
          //     loserBrackets.push(loserObj);
          //   }
          // }
          else {
            loserMatches = Math.round(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
            loserMatchesWinner = Math.floor(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
          }
          // const loserObj = {
          //   round: i,
          //   matches: loserMatches,
          //   brackets: "losers",
          //   winners: loserMatchesWinner,
          // };
          // loserBrackets.push(loserObj);
          // console.log("looser Obj : ", loserObj);
          if (!losers && i === totalRounds) {
            console.log("loser bracket done");
          } else {
            const loserObj = {
              round: i,
              matches: loserMatches,
              brackets: "losers",
              winners: loserMatchesWinner,
            };
            loserBrackets.push(loserObj);
            console.log("loser Obj : ", loserObj);
          }
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
        // for checking not to exceed final round in both brackets
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
          } else if (!losers && i === totalRounds) {
            if (toInteger(loserBrackets[i - 2]?.winners) > 1) {
              loserMatches = Math.round(
                toInteger(loserBrackets[i - 2]?.winners) / 2
              );
              loserMatchesWinner = Math.floor(
                toInteger(loserBrackets[i - 2]?.winners) / 2
              );
              let loserObj = {
                round: i,
                matches: loserMatches,
                brackets: "losers",
                winners: loserMatchesWinner,
              };
              loserBrackets.push(loserObj);
              loserMatches = Math.round(
                (toInteger(loserBrackets[i - 1]?.winners) + matches) / 2
              );
              loserMatchesWinner = Math.floor(
                (toInteger(loserBrackets[i - 1]?.winners) + matches) / 2
              );
              // i=i+1;
              loserObj = {
                round: i + 1,
                matches: loserMatches,
                brackets: "losers",
                winners: loserMatchesWinner,
              };
              loserBrackets.push(loserObj);
            }
          } else {
            loserMatches = Math.round(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
            loserMatchesWinner = Math.floor(
              (toInteger(loserBrackets[i - 2]?.winners) + matches) / 2
            );
          }
          if (!losers && i === totalRounds) {
            console.log("loser bracket done");
          } else {
            const loserObj = {
              round: i,
              matches: loserMatches,
              brackets: "losers",
              winners: loserMatchesWinner,
            };
            loserBrackets.push(loserObj);
            console.log("loser Obj : ", loserObj);
          }
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
    const roundMatchMap = new Map();
    const roundWinnerMap = new Map();
    let winnersBrackets = [];
    let losersBrackets = [];
    for (let i = 1; i <= totalRounds; i++) {
      let matches = 0;
      let winners = 0;
      let losers = 0;
      if (tourTeams % 2 === 0) {
        matches = Math.round(tourTeams / 2);
        losers = Math.floor(tourTeams / 2);
        winners = Math.round(tourTeams / 2);
        roundMatchMap.set(i, matches);
        tourTeams = Math.round(tourTeams / 2);
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
      } else {
        matches = Math.round(tourTeams / 2);
        losers = Math.floor(tourTeams / 2);
        winners = Math.round(tourTeams / 2);
        roundMatchMap.set(i, matches);
        tourTeams = Math.round(tourTeams / 2);
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
      }
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
  } catch (error) {
    throw new Error(
      ",Error in get brackets rounds and matches data " + error?.message
    );
  }
};

const getBracketsRoundsAndMatches2 = (participants) => {
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
    const winnersRoundNames = winnersBrackets?.map((bracket)=>bracket?.roundName);
    const losersRoundNames = losersBrackets?.map((bracket)=>bracket?.roundName);
    console.log('winners round names : ',winnersRoundNames)
    console.log('losersRoundNames round names : ',losersRoundNames)
    const bracketsPayload = {
      winnersBrackets,
      losersBrackets,
      winnersRoundNames,
      losersRoundNames
    }
  } catch (error) {
    throw new Error(
      ",Error in get brackets rounds and matches data " + error?.message
    );
  }
};


getBracketsRoundsAndMatches2(6);
