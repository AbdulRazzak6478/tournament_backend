const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentModel = require("../models/tournament");
const teamModel = require("../models/team");
const knockoutModel = require("../models/knockoutFormat");
const roundModel = require("../models/Rounds");
const matchModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");
const mongoose = require("mongoose");

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
      teams: +req.body.participants,
    };
    console.log("data payload : ", data);
    // Getting number of rounds possible in tournament
    const totalRounds = Math.ceil(Math.log2(data.teams)); // possible number of rounds
    const roundNames = [];
    console.log("total : ", totalRounds);

    // storing rounds names into roundsNames array for reference
    // Getting rounds Names
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
        roundNames.push(roundType); // storing rounds names into roundsNames array for reference
      }
    }

    // create matches into all rounds
    //creating tournament

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

    // Forming the data of each team and storing into newArray
    const tourId = tournament?._id?.toString();
    newArray = newArray.map((value, index) => {
      let obj = {
        tournamentID: tourId,
        teamNumber: value,
        sportName: "cricket",
        teamName: "Team #" + value,
      };
      return obj;
    });

    // creating teams in one time only and passing session into it

    const teams = await teamModel.create([...newArray], { session: session });
    let teamsIds = teams?.map((team) => team?._id?.toString());
    console.log("teams ids : ", teamsIds);
    // if we have team ids storing and saving into tournament model
    if (teamsIds.length > 0) {
      tournament.teams = teamsIds;
      await tournament.save({ session });
    }

    // creating knockout section

    // formatData Payload
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

    // creating tournament format
    let tournamentFormat = await knockoutModel.create([formatData], {
      session: session,
    });
    console.log("tournament format created: ", tournamentFormat);
    tournamentFormat = tournamentFormat[0];

    // preparing rounds data and number of matches possible in each round and storing them in roundsData
    let roundsData = [];
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
        // if teams length is ODD
        let matches = Math.round(tourTeams / 2);
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        roundObj.matches = roundMatchMap.get(i);
        roundsData.push(roundObj);
      } else if (tourTeams % 2 === 0) {
        // if teams length is EVEN
        let matches = Math.round(tourTeams / 2);
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        roundObj.matches = roundMatchMap.get(i);
        roundsData.push(roundObj);
      }
    }
    console.log("roundsData : ", roundsData);

    // Iterating over rounds data and creating rounds and matches respective to rounds and storing them

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
      let round = await roundModel.create([data], { session: session });
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
        const matchObj = {
          name: "match #" + matchData,
          tournamentID: roundData.tournamentID,
          roundID: round?._id?.toString(),
          formatID: roundData.formatTypeID,
        };
        allMatches.push(matchObj);
      }
      const matches = await matchModel.create(allMatches, { session: session }); // creating matches

      matchIds = matches?.map((match) => match?._id?.toString());
      round?.matches.push(...matchIds); // storing matches ids
      await round.save({ session });
    }

    // referencing next rounds matches into previous rounds matches to help the winner to move forward

    const roundMatchIdsMap = new Map();
    let formatId = tournamentFormat?._id?.toString();
    // Get all rounds data and matches
    let allRoundsData = await roundModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate("matches")
      .session(session);
    console.log("all rounds : ", allRoundsData);
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
    // for (let round of rounds) {
    //   let roundMatches = await matchModel
    //     .find({
    //       _id: roundMatchIdsMap.get(round),
    //     })
    //     .session(session);
    //   console.log("round : ", round, " , matches : ", roundMatches.length);

    //   // referencing next round or match in current match
    //   let index = 0;
    //   for (let i = 0; i < roundMatches.length; i += 2) {
    //     if (roundMatchIdsMap.get(round + 1)) {
    //       let nextRoundMatchesIds = roundMatchIdsMap.get(round + 1);
    //       if (index < nextRoundMatchesIds.length) {
    //         // having next round match
    //         roundMatches[i].nextMatch = nextRoundMatchesIds[index];
    //         await roundMatches[i].save({ session });
    //         if (i + 1 < roundMatches.length) {
    //           if (roundMatches[i + 1]) {
    //             roundMatches[i + 1].nextMatch = nextRoundMatchesIds[index];
    //             await roundMatches[i + 1].save({ session });
    //           }
    //         }
    //       } else {
    //         // no next round match
    //         roundMatches[i].nextMatch = null; // no next round match
    //         await roundMatches[i].save({ session });
    //         if (i + 1 < roundMatches.length) {
    //           if (roundMatches[i + 1]) {
    //             roundMatches[i + 1].nextMatch = null; // no next round match
    //             await roundMatches[i + 1].save({ session });
    //           }
    //         }
    //       }
    //       index += 1; // incrementing to get next match id index
    //     }
    //   }
    // }
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
      }
    }

    // arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

    const allRoundsAndMatches = await roundModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate(["matches"])
      .session(session);
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

    // await allRoundsAndMatches?.forEach(async (round) =>{}  ====>  for(let round of allRoundsAndMatches){}
    for (let round of allRoundsAndMatches) {
      let teams = round?.teams?.length;
      // handling ODD team match reference for round one
      if (teams % 2 !== 0) {
        let nextMatchId = round?.matches[0]?.nextMatch?.toString();
        const lastIndex = round?.matches.length;
        round.matches[0].nextMatch =
          round?.matches[lastIndex - 1]?._id?.toString();
        round.matches[lastIndex - 1].nextMatch = nextMatchId;
        await round?.matches[0].save({ session });
        await round?.matches[lastIndex - 1].save({ session });
      }

      // arranging teams in round 1 only
      if (round?.roundNumber === 1) {
        let index = 0;
        round.matches.forEach(async (match, i) => {
          if (index < arrangedTeams.length) {
            match.teamA = arrangedTeams[index];
            if (index + 1 < arrangedTeams.length) {
              match.teamB = arrangedTeams[index + 1];
              index += 2;
            }
            const matchData = await round?.matches[i].save({ session });
            console.log("match : ", i, " ,data : ", matchData);
          }
        });
      }
    }

    // storing rounds ids in format model
    const allRounds = await roundModel
      .find({ tournamentID: tourId })
      .populate("matches")
      .session(session);
    let roundsIds = allRounds?.map((round) => round?._id?.toString());
    tournamentFormat?.rounds.push(...roundsIds);
    tournamentFormat = await tournamentFormat.save({ session });

    tournament.formatId = tournamentFormat?._id?.toString();
    tournament = await tournament.save({ session });
    SuccessResponse.data = {
      teamsIds: teamsIds,
      roundsIds: roundsIds,
      format: tournamentFormat,
      tournament: tournament,
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
  createTournament,
};
