const categoriesModel = require("../../../../models/categories");
const subCategoriesModel = require("../../../../models/subCategories");
const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentRoundsModel = require("../../../../models/tournamentRounds");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentKnockoutModel = require("../../../../models/tournamentKnockoutFormat");
const tournamentIdModel = require('../../../../models/tournamentIds');
const mongoose = require("mongoose");
const _ = require("lodash");


const generateTournamentId = async ()=>{
  const count = await tournamentIdModel.find({});
  const newId = `GBT${(count.length + 1).toString().padStart(6, '0')}`;
  console.log('tournament unique id : ',newId);
  return newId;
}

const arrangingTeamsBasedOnFixingType = (fixingType, teams) => {
  try {
    let arrangedTeams = [];
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
    if (matchFixingType === "random") {
      // Generate random sorting metrics proportional to array length
      let randomMetrics = teams.map((item) => ({
        item,
        sortMetric: Math.floor(Math.random() * teams.length),
      }));
      // Sort based on the generated metrics
      randomMetrics.sort((a, b) => a.sortMetric - b.sortMetric);
      // Extract sorted items
      arrangedTeams = randomMetrics.map((item) => item.item);
    }
    if (matchFixingType === "sequential" || matchFixingType === "manual") {
      arrangedTeams = teams;
    }
    return arrangedTeams;
  } catch (error) {
    console.log(
      "error in arranging participants based on fixingType : ",
      error?.message
    );
    throw new Error(error?.message);
  }
};

const tournamentKnockoutFormatCreation = async (dataPayload) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Steps To create Tournament knockout section
    // 1. validating the incoming data and categories exist or not
    // 2. generating random id for unique tournament ID
    // 3. calculating number of rounds possible and round names also
    // 4. preparing tournament data payload and creating tournament
    // 5.creating teams or players based on gameType and storing into tournament
    // 6.preparing data payload for knockout and creating knockout section for tournament
    // 7. preparing number of possible rounds and matches data
    // 8.creating rounds and there matches ,respective to round
    // 9.Referencing the next round matches into previous round matches to help winner to move forward
    // 10.making placeholder for the next round or matches to maintain the flow of game
    // 11.handling winners round one for odd match also updating its references into next matches and round
    // 12.Arranging teams or participants based on the fixingType
    // 13.Storing all rounds ids into knockout format and knockout into tournament
    // 14. returning response of tournament;

    // STEP 1
    const data = {
      mainCategoryID: dataPayload.mainCategoryID,
      subCategoryID: dataPayload.subCategoryID,
      gameType: dataPayload.gameType,
      participants: dataPayload.participants,
      formatType: dataPayload.formatType,
      sport: dataPayload.sport,
      fixingType: dataPayload.fixingType,
    };
    const mainCategory = await categoriesModel.findOne({
      _id: data.mainCategoryID,
    });
    if (_.isEmpty(mainCategory)) {
      throw new Error("mainCategory not found");
    }
    const subCategory = await subCategoriesModel.findOne({
      _id: data.subCategoryID,
    });
    if (_.isEmpty(subCategory)) {
      throw new Error("subCategory not found");
    }

    // STEP 2
    // Getting Random string for storing it into tournament => tournamentID  ||  unique to tournament
    let tournamentId = await generateTournamentId();

    // STEP 3
    // Getting number of rounds possible in tournament
    const totalRounds = Math.ceil(Math.log2(data.participants)); // possible number of rounds
    const roundNames = [];

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

    // STEP 4
    // tournament data Payload
    const tournamentData = {
      tournamentID: tournamentId,
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
    const uniqueId = await tournamentIdModel.create([{tournamentID : tournamentId}],{session : session});
    console.log('tournament Unique id : ',uniqueId);

    // STEP 5 :
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
      let teamsIds = teams?.map((team) => team?._id?.toString());
      // if we have team ids storing and saving into tournament model
      if (teamsIds.length > 0) {
        tournament.teams = teamsIds;
        tournament = await tournament.save({ session });
      }
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
      let playersIds = players?.map((player) => player?._id?.toString());
      // if we have players ids storing and saving into tournament model
      if (playersIds.length > 0) {
        tournament.participants = playersIds;
        tournament = await tournament.save({ session });
      }
      participantsIds = playersIds;
    }

    // STEP 6
    // creating knockout section
    // knockoutFormatData Payload
    const formatData = {
      tournamentID: tournament?._id?.toString(),
      formatName: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
      totalRounds: totalRounds,
      roundNames: roundNames,
    };
    if (data.gameType === "team") {
      formatData.totalTeams = data.participants;
      formatData.teams = participantsIds;
    }
    if (data.gameType === "individual") {
      formatData.totalParticipants = data.participants;
      formatData.participants = participantsIds;
    }

    // creating tournament knockout format
    let tournamentFormat = await tournamentKnockoutModel.create([formatData], {
      session: session,
    });
    if (_.isEmpty(tournamentFormat)) {
      throw new Error(" => not able to create tournament knockout format ");
    }
    tournamentFormat = tournamentFormat[0];

    // STEP 7
    // preparing rounds data and number of matches possible in each round and storing them in roundsData
    let roundsData = [];
    let roundMatchMap = new Map();
    let tourTeams = data.participants;
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

    // STEP : 8
    // Iterating over rounds data and creating rounds and matches respective to rounds and storing them

    for (let roundData of roundsData) {
      // Create a new round
      const roundPayload = {
        roundNumber: roundData.roundNumber,
        roundName: roundData.roundName,
        tournamentID: roundData.tournamentID,
        formatTypeID: roundData.formatTypeID,
        formatName: data.formatType,
        fixingType: data.fixingType,
        brackets: "winners",
        gameType: data.gameType,
      };
      if (roundData.roundNumber === 1) {
        roundPayload.participants = participantsIds;
      }
      let round = await tournamentRoundsModel.create([roundPayload], {
        session: session,
      });
      if (_.isEmpty(round)) {
        throw new Error(
          " => not able to create round in tournament knockout section "
        );
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
          tournamentID: roundData.tournamentID,
          roundID: round?._id?.toString(),
          formatID: roundData.formatTypeID,
          gameType: data.gameType,
          bracket: "winners",
        };
        allMatches.push(matchObj);
      }
      const matches = await tournamentMatchModel.create(allMatches, {
        session: session,
      }); // creating matches

      if (_.isEmpty(matches)) {
        throw new Error(
          " => not able to create matches for the respective round"
        );
      }
      matchIds = matches?.map((match) => match?._id?.toString());
      round?.matches.push(...matchIds); // storing matches ids
      await round.save({ session });
    }

    // STEP : 9
    // referencing next rounds matches into previous rounds matches to help the winner to move forward

    const roundMatchIdsMap = new Map();
    let formatId = tournamentFormat?._id?.toString();
    // Get all rounds data and matches
    let allRoundsData = await tournamentRoundsModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate("matches")
      .session(session);
    if (_.isEmpty(allRoundsData)) {
      throw new Error(" => not able to fetch rounds and matches data");
    }
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

    // iterating over the rounds and there matches to add reference of next rounds matches
    for (let round of rounds) {
      let roundMatches = allRoundsData[round - 1].matches;

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

    // STEP 10
    // matches placeholder making
    // 1. start allocating placeholder from next round
    for (let i = 2; i <= rounds.length; i++) {
      let prevRoundMatchesIds = roundMatchIdsMap.get(i - 1);
      let currentRoundMatches = allRoundsData[i - 1].matches;
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

    // STEP 11
    // handling winners round one for odd match also updating its references into next matches and round
    allRoundsData.sort((round1,round2)=>round1?.roundNumber - round2?.roundNumber);
    let participants = allRoundsData[0].participants.length;
    if (participants % 2 !== 0 && allRoundsData[0].roundNumber === 1) {
      let matchesLength = allRoundsData[0]?.matches.length;
      let nextMatchId = allRoundsData[0]?.matches[0]?.nextMatch?.toString();
      let lastMathReferID =
        allRoundsData[0]?.matches[matchesLength - 1]?.nextMatch?.toString();
      let lastMatchID =
        allRoundsData[0]?.matches[matchesLength - 1]?._id?.toString();
      let firstMatchID = allRoundsData[0]?.matches[0]?._id?.toString();
      allRoundsData[0].matches[0].nextMatch = lastMatchID;
      allRoundsData[0].matches[matchesLength - 1].nextMatch = nextMatchId;
      allRoundsData[0].matches[matchesLength - 1].matchB = firstMatchID;

      let firstReferMatchINDX = 0;
      allRoundsData[1]?.matches?.filter((match, index) => {
        if (match?._id?.toString() === firstMatchID) {
          firstReferMatchINDX = index;
          return match;
        }
      });
      if (lastMathReferID) {
        let referMatchIndex = 0;
        allRoundsData[1]?.matches?.filter((match, index) => {
          if (match?._id?.toString() === lastMathReferID) {
            referMatchIndex = index;
            return match;
          }
        });
        if (
          allRoundsData[1]?.matches[referMatchIndex]?.matchA?.toString() ===
          lastMatchID
        ) {
          allRoundsData[1].matches[referMatchIndex].matchA = null;
        }
        if (
          allRoundsData[1]?.matches[referMatchIndex]?.matchB?.toString() ===
          lastMatchID
        ) {
          allRoundsData[1].matches[referMatchIndex].matchB = null;
        }
        allRoundsData[1].matches[referMatchIndex] =
          await allRoundsData[1].matches[referMatchIndex].save({ session });
      }

      // replacing first match id with lastMatchID
      if (
        allRoundsData[1]?.matches[firstReferMatchINDX]?.matchA?.toString() ===
        firstMatchID
      ) {
        allRoundsData[1].matches[firstReferMatchINDX].matchA = lastMatchID;
      }
      if (
        allRoundsData[1]?.matches[firstReferMatchINDX]?.matchB?.toString() ===
        firstMatchID
      ) {
        allRoundsData[1].matches[firstReferMatchINDX].matchB = lastMatchID;
      }
      allRoundsData[1].matches[firstReferMatchINDX] =
        await allRoundsData[1].matches[firstReferMatchINDX].save({ session });

      allRoundsData[0].matches[0] = await allRoundsData[0].matches[0].save({
        session,
      });
      allRoundsData[0].matches[matchesLength - 1] =
        await allRoundsData[0].matches[matchesLength - 1].save({ session });
    }

    // STEP 12
    // arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

    const allRoundsAndMatches = await tournamentRoundsModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate(["matches"])
      .session(session);
    if (_.isEmpty(allRoundsAndMatches)) {
      throw new Error(
        " => not able to fetch rounds & matches data tournamentID and formatTypeID"
      );
    }

    const arrangedTeams = arrangingTeamsBasedOnFixingType(
      data.fixingType,
      participantsIds
    );

    // assigning participants into round matches
    let idx = 0;
    for (let round = 0; round < allRoundsAndMatches.length; round++) {
      if (allRoundsAndMatches[round]?.roundNumber === 1) {
        idx = round;
      }
    }
    let index = 0;
    for (let match of allRoundsAndMatches[idx].matches) {
      if (index < arrangedTeams.length) {
        match.teamA = arrangedTeams[index];
        if (index + 1 < arrangedTeams.length) {
          match.teamB = arrangedTeams[index + 1];
          index += 2;
        }
        match = await match.save({ session });
      }
    }

    // STEP 13
    // storing rounds ids in format model
    const allRounds = allRoundsAndMatches;
    if (_.isEmpty(allRounds)) {
      throw new Error(
        " => error in fetching rounds and matches to assign ids to tournament Format"
      );
    }
    let roundsIds = allRounds?.map((round) => round?._id?.toString());
    tournamentFormat?.rounds.push(...roundsIds);
    tournamentFormat = await tournamentFormat.save({ session });

    tournament.formatID = tournamentFormat?._id?.toString();
    tournament = await tournament.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return tournament;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(
      "something went wrong in knockout section : " + error?.message
    );
  }
};

module.exports = tournamentKnockoutFormatCreation;
