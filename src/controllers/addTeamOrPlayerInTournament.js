const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const teamModel = require("../models/team");
const tournamentModel = require("../models/tournament");
const tournamentFormatModel = require("../models/knockoutFormat");
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

const AddTeamInTournament = async (req, res) => {
  try {
    const { tourId } = req.params;
    const tournamentID = tourId;
    console.log("tournament id : ", tournamentID);
    let tournamentDetails = await tournamentModel.findById(tourId);
    let tournamentFormatDetails = await tournamentFormatModel.findOne({
      tournamentID: tourId,
    });

    const teamObj = {
      tournamentID: tourId,
      teamNumber: tournamentDetails?.teams.length + 1,
      sportName: "cricket",
      teamName: "Team #" + (tournamentDetails?.teams.length + 1),
    };

    let newTeam = await teamModel.create(teamObj);
    tournamentDetails.teams.push(newTeam?._id?.toString());
    tournamentFormatDetails.teams.push(newTeam?._id?.toString());

    // deleting rounds and there tournament matches
    let deleteRounds = await roundModel.deleteMany({
      tournamentID: tournamentDetails?._id,
    });
    let deleteAllMatches = await matchModel.deleteMany({
      tournamentID: tournamentDetails?._id,
    });

    console.log("deleted rounds : ", deleteRounds);
    console.log("deleted rounds matches : ", deleteAllMatches);

    tournamentFormatDetails.rounds = [];
    tournamentDetails = await tournamentDetails.save();
    tournamentFormatDetails = await tournamentFormatDetails.save();

    let totalTeams = tournamentDetails?.teams.length;
    let teamsIds = tournamentDetails?.teams.map((team) => team.toString());
    const totalRounds = Math.ceil(Math.log2(totalTeams));

    // preparing rounds data and number of matches possible in each round and storing them in roundsData
    let roundNames = [];
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
    let roundsData = [];
    let roundMatchMap = new Map();
    let tourTeams = totalTeams;
    for (let i = 1; i <= totalRounds; i++) {
      let roundObj = {
        tournamentID: tournamentDetails?._id?.toString(),
        formatTypeID: tournamentFormatDetails?._id?.toString(),
        fixingType: tournamentDetails.fixingType,
        gameType: tournamentDetails.gameType,
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
      let matchesObj = [];
      for (let matchData of roundMatches) {
        const matchObj = {
          name: "match #" + matchData,
          tournamentID: roundData.tournamentID,
          roundID: round?._id?.toString(),
          formatID: roundData.formatTypeID,
        };
        matchesObj.push(matchObj);
      }
      const matches = await matchModel.create(matchesObj);
      // await match.save();
      matchIds = matches?.map((match) => match?._id?.toString());
      // matchIds.push(match?._id?.toString());
      round?.matches.push(...matchIds);
      await round.save();

      // Update the round with match IDs
      // console.log(
      //   `Round '${roundData.roundName}' created with ${matchIds.length} matches.`
      // );
    }

    // referencing next rounds matches into previous rounds matches to help the winner to move forward
    const roundMatchIdsMap = new Map();
    let formatId = tournamentFormatDetails?._id?.toString();
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
    

    // arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

    const allRoundsAndMatches = await roundModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate(["matches"]);
    console.log("all rounds : ", allRoundsAndMatches);
    const arrangedTeams = arrangingTeamsBasedOnFixingType(
      tournamentDetails?.fixingType,
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
        let nextMatchId = round?.matches[0]?.nextMatch?.toString();
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
    // let allRoundsWithMatches = await roundModel
    //   .find({
    //     tournamentID: tournamentDetails?._id,
    //   })
    //   .populate("matches");

    // storing rounds ids in format model
    const allRounds = await roundModel
      .find({ tournamentID: tourId })
      .populate("matches");
    console.log("round 1 matches : ", allRounds[0].matches);
    let roundsIds = allRounds?.map((round) => round?._id?.toString());
    tournamentFormatDetails?.rounds.push(...roundsIds);
    tournamentFormatDetails = await tournamentFormatDetails.save();
    console.log(
      "updated tournament format after adding rounds ids : ",
      tournamentFormatDetails
    );

    tournamentDetails.formatId = tournamentFormatDetails?._id?.toString();
    tournamentDetails = await tournamentDetails.save();
    console.log("updated tournament after adding format MongoID: ", tournamentDetails);
    SuccessResponse.data = {
      tournament: tournamentDetails,
      tournamentFormatDetails,
      teamObj,
      deleteRounds,
      deleteAllMatches,
      allRounds,
    };
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    console.log("error in add Team controller");
    ErrorResponse.error = new AppError(
      "error in Add Team : " + error?.message,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  AddTeamInTournament,
};
