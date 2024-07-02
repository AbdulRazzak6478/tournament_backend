const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentModel = require("../models/tournament");
const teamModel = require("../models/team");
const knockoutModel = require("../models/knockoutFormat");
const roundModel = require("../models/Rounds");
const matchModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");

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
const createTournament = async (req, res) => {
  try {
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

    console.log("data : ", data);
    const totalRounds = Math.ceil(Math.log2(data.teams));
    const roundNames = [];
    let roundsData = [];

    console.log("total : ", totalRounds);

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
      }
    }

    // 1. stores all teams in to round 1
    // create matches into all rounds
    let teamsIdsForTournament = [];
    let knockoutIdForTournament = "";
    //creating tournament

    const tournamentData = {
      tournamentID: random,
      formatName: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
      totalRounds: totalRounds,
      roundNames: roundNames,
      totalTeams: data.teams,
      // teams,
    };

    console.log("tour data : ", tournamentData);
    let tournament = await tournamentModel.create(tournamentData);
    console.log("tournament created : ", tournament);

    // creating Teams
    let newArray = Array.from(
      new Array(data.teams),
      (value, index) => index + 1
    );
    // console.log('new array : ',newArray);
    const id = "1234567890";
    // teamsIds = await createTeams(newArray, id);
    const tourId = tournament?._id?.toString();
    newArray = newArray.map((value, index) => {
      let obj = {
        tournamentID: tourId,
        teamNumber: value,
        sportName: "cricket",
        teamName: "Team #" + value,
      };
      return obj;
      // let newTeam = new teamModel(obj);
      // let saveTeam = await newTeam.save();
      // console.log('team ',(index+1)," , ",saveTeam);
      // console.log('team id :',saveTeam?._id?.toString())
      // idsArr.push(saveTeam?._id?.toString());
    });

    const teams = await teamModel.create([...newArray]);
    console.log("data of teams created : ", teams);
    let teamsIds = teams?.map((team) => team?._id?.toString());
    console.log("teams ids : ", teamsIds);
    SuccessResponse.data = teams;
    if (teamsIds.length > 0) {
      tournament.teams.push(...teamsIds);
      await tournament.save();
    }

    // creating knockout section

    const formatData = {
      tournamentID: tournament?._id?.toString(),
      formatType: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
      totalRounds: totalRounds,
      roundNames: roundNames,
      totalTeams: data.teams,
      // totalParticipants,
      teams: teamsIds,
      //   participants,
      // rounds,
    };

    let tournamentFormat = await knockoutModel.create(formatData);
    console.log("tournament format created: ", tournamentFormat);

    // SuccessResponse.data = {
    //   totalRounds: totalRounds,
    //   roundNames: roundNames,
    //   roundMatchMap: roundMatchMap,
    //   roundData: roundData,
    //   tournament: tournament,
    //   tournamentFormat: tournamentFormat,
    // };
    // return res.status(201).json(SuccessResponse);

    // let roundsData = [];
    let roundMatchMap = new Map();
    let tourTeams = data.teams;
    for (let i = 1; i <= totalRounds; i++) {
      let roundObj = {
        tournamentID: tournament?._id?.toString(),
        formatTypeID: tournamentFormat?._id?.toString(),
        fixingType: data.fixingType,
        gameType: data.gameType,
        roundNumber: i,
        roundName: roundNames[i - 1],
        // teams: teamsIds,
      };
      if (tourTeams % 2 !== 0) {
        let matches = Math.round(tourTeams / 2);
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        roundObj.matches = roundMatchMap.get(i);
        roundsData.push(roundObj);
      } else if (tourTeams % 2 === 0) {
        let matches = Math.round(tourTeams / 2);
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        roundObj.matches = roundMatchMap.get(i);
        roundsData.push(roundObj);
      }
    }

    console.log("roundsData : ", roundsData);
    for (let roundData of roundsData) {
      // Create a new round
      const data = {
        roundNumber: roundData.roundNumber,
        roundName: roundData.roundName,
        tournamentID: roundData.tournamentID,
        formatTypeID: roundData.formatTypeID,
      };
      if (roundData.roundNumber === 1) {
        data.teams = teamsIds;
      }
      const round = await roundModel.create(data);

      // Create matches for the current round
      let roundMatches = Array.from(
        new Array(roundData.matches),
        (value, index) => index + 1
      );
      // console.log("round matches : ", roundMatches);
      let matchIds = [];
      for (let matchData of roundMatches) {
        const matchObj = {
          name: "match #" + matchData,
          tournamentID: roundData.tournamentID,
          roundID: round?._id?.toString(),
          formatID: roundData.formatTypeID,
        };
        const match = await matchModel.create(matchObj);
        // await match.save();
        matchIds.push(match?._id?.toString());
      }
      round?.matches.push(...matchIds);
      await round.save();

      // Update the round with match IDs
      // console.log(
      //   `Round '${roundData.roundName}' created with ${matchIds.length} matches.`
      // );
    }
    // referencing next rounds matches into previous rounds matches to help the winner to move forward

    const roundMatchIdsMap = new Map();
    let formatId = tournamentFormat?._id?.toString();
    let allRoundsData = await roundModel.find({
      tournamentID: tourId,
      formatTypeID: formatId,
    });
    console.log("all rounds : ", allRoundsData);
    let rounds = Array.from(
      new Array(allRoundsData.length),
      (value, index) => index + 1
    );
    allRoundsData?.forEach((round) => {
      const matchArray = round?.matches?.map((match) => match?.toString());
      roundMatchIdsMap.set(round.roundNumber, matchArray);
    });
    console.log("round matches ids map : ", roundMatchIdsMap);
    //     SuccessResponse.data = {
    //         allRounds :allRounds,
    //         roundMatchIdsMap : roundMatchIdsMap,
    //         // allMatches : allMatches,
    //     };
    // return res.status(201).json(SuccessResponse);
    for (let round of rounds) {
      let roundMatches = await matchModel.find({
        _id: roundMatchIdsMap.get(round),
      });
      console.log("round : ", round, " , matches : ", roundMatches);

      // referencing next round or match in current match
      let index = 0;
      for (let i = 0; i < roundMatches.length; i += 2) {
        if (roundMatchIdsMap.get(round + 1)) {
          let nextRoundMatchesIds = roundMatchIdsMap.get(round + 1);
          if (index < nextRoundMatchesIds.length) {
            roundMatches[i].nextMatch = nextRoundMatchesIds[index];
            await roundMatches[i].save();
            if (i + 1 < roundMatches.length) {
              if (roundMatches[i + 1]) {
                roundMatches[i + 1].nextMatch = nextRoundMatchesIds[index];
                await roundMatches[i + 1].save();
              }
            }
          } else {
            roundMatches[i].nextMatch = null; // no in round
            await roundMatches[i].save();
            if (i + 1 < roundMatches.length) {
              if (roundMatches[i + 1]) {
                roundMatches[i + 1].nextMatch = null;
                await roundMatches[i + 1].save();
              }
            }
          }
          index += 1;
        }
      }
    }
    // arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

    const allRoundsAndMatches = await roundModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate(["matches"]);
    console.log("all rounds : ", allRoundsAndMatches);
    const arrangedTeams = arrangingTeamsBasedOnFixingType(
      data.fixingType,
      teamsIds
    );
    console.log(
      "arranged Teams length : ",
      arrangedTeams,
      arrangedTeams.length
    );
    await allRoundsAndMatches?.forEach(async (round) => {
      let teams = round?.teams?.length;
      if (teams % 2 !== 0) {
        let nextMatchId = round?.matches[0]?.nextMatch.toString();
        const lastIndex = round?.matches.length;
        round.matches[0].nextMatch =
          round?.matches[lastIndex - 1]?._id?.toString();
        round.matches[lastIndex - 1].nextMatch = nextMatchId;
        await round?.matches[0].save();
        await round?.matches[lastIndex - 1].save();
      }

      if (round?.roundNumber === 1) {
        let index = 0;
        round.matches.forEach(async (match, i) => {
          if (index < arrangedTeams.length) {
            match.teamA = arrangedTeams[index];
            if (index + 1 < arrangedTeams.length) {
              match.teamB = arrangedTeams[index + 1];
              index += 2;
            }
            const matchData = await round?.matches[i].save();
            console.log("match : ", i, " ,data : ", matchData);
          }
        });
      }
    });

    // storing rounds ids in format model
    const allRounds = await roundModel
      .find({ tournamentID: tourId })
      .populate("matches");
    console.log("round 1 matches : ", allRounds[0].matches);
    let roundsIds = allRounds?.map((round) => round?._id?.toString());
    tournamentFormat?.rounds.push(...roundsIds);
    tournamentFormat = await tournamentFormat.save();
    console.log(
      "updated tournament format after adding rounds ids : ",
      tournamentFormat
    );

    tournament.formatId = tournamentFormat?._id?.toString();
    tournament = await tournament.save();
    console.log("updated tournament after adding format MongoID: ", tournament);
    SuccessResponse.data = {
      teamsIds: teamsIds,
      roundsIds: roundsIds,
      allRounds: allRounds,
      format: tournamentFormat,
      tournament: tournament,
    };
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    console.log("error in createTournament controller");
    ErrorResponse.error = new AppError(
      `error in creating createTournament :  ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  createTournament,
};
