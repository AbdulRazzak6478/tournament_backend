let roundMatchMap = new Map();
async function createRoundsAndMatches(roundsData) {
  try {
    const roundMatchIdsMap = new Map();
    for (let roundData of roundsData) {
      // Create a new round
      const data = {
        roundNumber: roundData.roundNumber,
        roundName: roundData.roundName,
        tourId: roundData.tourId,
        formatId: roundData.formatId,
      };
      // const round = new Round({ name: roundData.name });
      // await round.save();
      // const round = await Round(data);

      // Create matches for the current round
      let roundMatches = Array.from(
        new Array(roundData.matches),
        (value, index) => index + 1
      );
      console.log("round matches : ", roundMatches);
      let matchIds = [];
      for (let matchData of roundMatches) {
        // const match = new Match({ /* matchData */ });
        // await match.save();
        matchIds.push(matchData);
      }

      roundMatchIdsMap.set(roundData.roundNumber, matchIds);
      // Update the round with match IDs
      // round.matches = matchIds;
      // await round.save();

      // console.log(`Round '${round.name}' created with ${matchIds.length} matches.`);
      console.log(
        `Round '${roundData.roundName}' created with ${matchIds.length} matches.`
      );
    }
    console.log("round matches ids map : ", roundMatchIdsMap);
    let tourId = "tourId";
    let formatId = "formatId";
    let rounds = Array.from(new Array(3), (value, index) => index + 1);
    for (let round of rounds) {
      let round = await Round.findOne({
        roundNumber: round,
        tournamentID: tourId,
        formatTypeID: formatId,
      });
      let roundMatches = await MatchesModel.find({
        _id: roundMatchIdsMap.get(round),
      });
      let index = 0;
      for (let i = 0; i < roundMatches.length; i += 2) {
        let nextRoundMatchesIds = roundMatchIdsMap.get(round + 1);
        roundMatches[i].nextMatch = nextRoundMatchesIds[index];
        if (i + 1 < roundMatches.length) {
          if (roundMatches[i + 1]) {
            roundMatches[i + 1].nextMatch = nextRoundMatchesIds[index];
          }
        }
        index += 1;
      }
      await roundMatches.save();
    }
    // console.log('All rounds and matches created successfully.');

    // Continue with any other operations after everything is done
  } catch (error) {
    // Handle errors appropriately
    console.error("Error creating rounds and matches:", error);
  }
}
let roundData = [];
function calculateRoundsAndNames() {
  let teams = 12;
  const totalRounds = Math.ceil(Math.log2(teams));
  const roundNames = [];

  console.log("teams : ", teams);
  console.log("total : ", totalRounds);

  let tourTeams = teams;
  let roundType = "";
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
      // console.log(roundNames[i-1]);
    }
    if (tourTeams % 2 !== 0) {
      let matches = Math.round(tourTeams / 2);
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
    } else {
      console.log("else");
      let obj = {
        roundNumber: i,
        roundName: roundNames[i - 1],
        tourId: "tourID",
        formatId: "formatID",
        matches: roundMatchMap.get(i),
      };
      roundData.push(obj);
    }
    // console.log('teams : ',tourTeams);
  }
  // console.log("rounds names : ", roundNames);
}
calculateRoundsAndNames();
console.log('map matches : ',roundMatchMap);
// console.log('rounds Data : ',roundData);
// createRoundsAndMatches(roundData);
// console.log("odd : ", Math.floor(5/ 2));

const arrangeTeamsBasedOnType = (teams) => {
  try {
    let arrangedTeams = [];
    // let matchFixingType = "random";
    let matchFixingType = "top_vs_bottom";

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
    return {};
  } catch (error) {
    console.log("error in creating teams", error?.message);
    throw new Error(error?.message);
  }
};

const tourTeams = [];
for (let i = 0; i < 9; i++) {
  tourTeams.push("Team #" + (i + 1));
}
console.log("teams before arrangement : ", tourTeams);
// const teams = arrangeTeamsBasedOnType(tourTeams);
