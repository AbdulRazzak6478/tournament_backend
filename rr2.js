const Tournament = require("../modals/tournament.js");
const Teams = require("../modals/team.js");
const Round = require("../modals/rounds.js");
const Match = require("../modals/match.js");
const Standing = require("../modals/standings.js");
const createRoundRobin = async (req, res) => {
  try {
    const {
      tournamentName,
      sportName,
      format,
      noOfParticipants,
      selectionType,
      fixingType,
    } = req.body;

    // Create new tournament document
    const newTournament = new Tournament({
      tournamentName,
      sportName,
      selectionType,
      format,
      noOfParticipants,
      fixingType,
    });
    const savedTournament = await newTournament.save();

    //Creating Teams

    for (let i = 0; i < savedTournament.noOfParticipants; i++) {
      let newTeam = new Teams({
        teamName: `Team${i + 1}`,
        tournamentId: savedTournament._id,
      });
      let saveTeam = await newTeam.save();
    }

    let findAllTeams = await Teams.find({
      tournamentId: savedTournament._id,
    });

    findAllTeams.forEach(async (div) => {
      let newStanding = new Standing({
        tournamentId: savedTournament._id,
        team: div._id,
      });
      let saveStanding = await newStanding.save();
    });

    const totalRounds =
      findAllTeams.length % 2 !== 0
        ? findAllTeams.length
        : findAllTeams.length - 1;
    const halfSize = Math.floor(findAllTeams.length / 2);
    let roundNumber = 1;

    // Initialize schedule
    let schedule = [];

    // Create schedule
    for (let round = 0; round < totalRounds; round++) {
      let roundMatches = [];

      if (findAllTeams % 2 !== 0) {
        let popPlayer = findAllTeams.pop();
        findAllTeams.unshift(popPlayer);
      }

      for (let match = 0; match < halfSize; match++) {
        let home = findAllTeams[match]._id;
        let away = findAllTeams[findAllTeams.length - 1 - match]._id;
        roundMatches.push([home, away]);
      }
      schedule.push(roundMatches);
      if (findAllTeams % 2 === 0) {
        let lastPlayer = findAllTeams.pop();
        findAllTeams.splice(1, 0, lastPlayer);
      }
    }

    console.log("SCHEDULE", schedule);

    // Create rounds and matches based on the schedule
    for (let i = 0; i < schedule.length; i++) {
      let newRound = new Round({
        tournamentId: savedTournament._id,
        roundNumber: roundNumber++,
        matches: [],
        bracket: "Winners",
      });
      let saveRound = await newRound.save();
      let matchNumber = 1;
      let matchesIds = [];

      for (let j = 0; j < schedule[i].length; j++) {
        let newMatch = new Match({
          matchNumber: matchNumber++,
          tournamentId: savedTournament._id,
          roundId: saveRound._id,
          team1: schedule[i][j][0],
          team2: schedule[i][j][1],
          winner: null,
          looser: null,
        });
        let saveMatch = await newMatch.save();
        matchesIds.push(saveMatch._id);
      }
      saveRound.matches = matchesIds;
      await saveRound.save();
    }

    const findAllRoundsWithMatches = await Round.find({
      tournamentId: savedTournament._id,
      bracket: "Winners",
    }).populate({ path: "matches", populate: ["team1", "team2"] });

    return res.status(201).json({ rounds: findAllRoundsWithMatches });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = createRoundRobin;