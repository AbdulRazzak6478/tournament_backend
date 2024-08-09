const categoriesModel = require("../../../../models/categories");
const subCategoriesModel = require("../../../../models/subCategories");
const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentRoundsModel = require("../../../../models/tournamentRounds");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentFormatModel = require("../../../../models/tournamentRRFormat");
const tournamentIdModel = require("../../../../models/tournamentIds");
const tournamentPointTableModel = require("../../../../models/tournamentPointTable");
const mongoose = require("mongoose");
const _ = require("lodash");

const generateTournamentId = async () => {
  const count = await tournamentIdModel.find({});
  const newId = `GBT${(count.length + 1).toString().padStart(6, "0")}`;
  console.log("tournament unique id : ", newId);
  return newId;
};

const getRoundsAndMatchesData = (len) => {
  let participants = Array.from(new Array(len), (value, index) => index + 1);

  let totalRounds = 0;

  let halfSize = 0;
  if (participants.length % 2 === 0) {
    totalRounds = participants.length - 1;
  } else {
    totalRounds = participants.length;
  }
  halfSize = Math.floor(participants.length / 2);

  let schedule = [];

  // for odd
  let players = [...participants];
  for (let round = 0; round < totalRounds; round++) {
    let roundsArr = [];
    for (let match = 0; match < halfSize; match++) {
      let home = players[match];
      let away = players[players.length - 1 - match];
      //   roundsArr.push([home, away]);
      roundsArr.push(home);
      roundsArr.push(away);
    }
    schedule.push(roundsArr);
    if (participants.length % 2 == 0) {
      let lastPlayer = players.pop();
      players.splice(1, 0, lastPlayer);
    } else {
      let lastEle = players.pop();
      players.unshift(lastEle);
    }
  }
  let dataPayload = {
    totalRounds: totalRounds,
    matchesLength: halfSize,
    roundsSchedule: schedule,
  };
  return dataPayload;
};
const createRoundsAndMatches = async (roundsData, scheduleData, session) => {
  try {
    const { tournamentID, formatTypeID, formatName, gameType, fixingType } =
      roundsData;
    const { roundsMatches, matchesLength, totalRounds, participantsIds } =
      scheduleData;
    let matches = Array.from(
      new Array(matchesLength),
      (value, index) => index + 1
    );
    let rounds = Array.from(
      new Array(totalRounds),
      (value, index) => index + 1
    );

    let roundsIds = [];
    for (let round of rounds) {
      let data = {
        roundNumber: round,
        roundName: "Round " + round,
        tournamentID: tournamentID,
        formatTypeID: formatTypeID,
        formatName,
        fixingType,
        gameType,
        brackets: "winners",
        participants: participantsIds,
      };
      let roundDetails = await tournamentRoundsModel.create([data], {
        session: session,
      });
      if (_.isEmpty(roundDetails)) {
        throw new Error(",Error in creating round " + round);
      }
      roundDetails = roundDetails[0];
      let matchesData = [];
      for (let match of matches) {
        const teamA_Id_index = roundsMatches[round - 1][match * 2 - 2];
        const teamB_Id_index = roundsMatches[round - 1][match * 2 - 1];
        let matchData = {
          tournamentID,
          roundID: roundDetails?._id?.toString(),
          formatID: formatTypeID,
          gameType,
          name: "K1R" + round + "M" + match,
          teamA: participantsIds[teamA_Id_index - 1],
          teamB: participantsIds[teamB_Id_index - 1],
        };
        matchesData.push(matchData);
      }
      let matchesDetails = await tournamentMatchModel.create(matchesData, {
        session,
      });
      if (_.isEmpty(matchesDetails)) {
        throw new Error(",Error in creating matches for round " + round);
      }
      const matchesIds = matchesDetails.map((match) => match?._id?.toString());
      roundDetails.matches = matchesIds;
      roundDetails = await roundDetails.save({ session });
      roundsIds.push(roundDetails?._id?.toString());
    }
    return roundsIds;
  } catch (error) {
    throw new Error(
      ",Error in creating rounds and matches for round robbin " + error?.message
    );
  }
};
const createRoundRobbinTournament = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    data.participants = +data.participants;
    // Steps For Creation
    // 1 .mainCategory and subCategory for tournament
    // 2 . Getting Random string for storing it into tournament => tournamentID  ||  unique to tournament
    // 3. forming tournament data Payload
    // 4. tournament creation
    // 5.creating record of tournamentId in  model
    // 6. creating participants based on gameType : ['team','individual']
    // 7. creating round robbin format section
    // 8. Getting Corresponding Rounds and matches data for creation
    // 9. Creating Rounds and matches and assigning participants into it
    // 10. Creating Standing Points Table For Round Robbin
    // 11. Storing Rounds Ids and pointsTables into Round Robbin Format
    // 12. Updating tournament to return

    // Start

    // 1 .mainCategory and subCategory for tournament
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

    // 2 . Getting Random string for storing it into tournament => tournamentID  ||  unique to tournament
    let tournamentId = await generateTournamentId();

    // 3. forming tournament data Payload
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

    // 4. tournament creation
    let tournament = await tournamentModel.create([tournamentData], {
      session: session,
    });
    if (_.isEmpty(tournament)) {
      throw new Error(" not able to create tournament");
    }
    tournament = tournament[0];

    // 5.creating record of tournamentId in  model
    const uniqueId = await tournamentIdModel.create(
      [{ tournamentID: tournamentId }],
      { session: session }
    );

    // 6. creating participants based on gameType : ['team','individual']
    let participantsIds = [];
    const tourId = tournament?._id?.toString();
    // 6.1 for teams
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
      if (_.isEmpty(teams)) {
        throw new Error(",Error in fetching teams");
      }
      teams.sort((team1, team2) => team1.teamNumber - team2.teamNumber);
      let teamsIds = teams?.map((team) => team?._id?.toString());
      // if we have team ids storing and saving into tournament model
      tournament.teams = teamsIds;
      tournament = await tournament.save({ session });
      participantsIds = teamsIds;
    }

    // 6.2 for players
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
      if (_.isEmpty(players)) {
        throw new Error(",Error in fetching players");
      }
      players.sort(
        (player1, player2) => player1.playerNumber - player2.playerNumber
      );
      let playersIds = players?.map((player) => player?._id?.toString());
      // if we have players ids storing and saving into tournament model
      tournament.participants = playersIds;
      tournament = await tournament.save({ session });
      participantsIds = playersIds;
    }

    // 7. creating round robbin format section
    // round robbin formatData Payload
    const formatData = {
      tournamentID: tournament?._id?.toString(),
      formatName: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
    };
    if (data.gameType === "team") {
      formatData.totalTeams = data.participants;
      formatData.teams = participantsIds;
    }
    if (data.gameType === "individual") {
      formatData.totalParticipants = data.participants;
      formatData.participants = participantsIds;
    }

    // creating tournament round robbin format
    let tournamentFormat = await tournamentFormatModel.create([formatData], {
      session: session,
    });
    if (_.isEmpty(tournamentFormat)) {
      throw new Error(",not able to create tournament knockout format ");
    }
    tournamentFormat = tournamentFormat[0];

    // 8. Getting Corresponding Rounds and matches data for creation
    let roundsData = getRoundsAndMatchesData(data.participants);

    const formatID = tournamentFormat?._id?.toString();
    const roundsPayload = {
      tournamentID: tourId,
      formatTypeID: formatID,
      formatName: "round_robbin",
      gameType: data.gameType,
      fixingType: data.fixingType,
    };
    const scheduleData = {
      roundsMatches: roundsData.roundsSchedule,
      matchesLength: roundsData.matchesLength,
      totalRounds: roundsData.totalRounds,
      participantsIds,
    };
    // 9. Creating Rounds and matches and assigning participants into it
    const roundIds = await createRoundsAndMatches(
      roundsPayload,
      scheduleData,
      session
    );

    // 10. Creating Standing Points Table For Round Robbin
    const pointTablePayload = participantsIds.map((id) => {
      return {
        tournamentID: tourId,
        formatID: formatID,
        participantID: id,
        gameType: data.gameType,
      };
    });
    const pointTable = await tournamentPointTableModel.create(
      pointTablePayload,
      { session: session }
    );

    if (_.isEmpty(pointTable)) {
      throw new Error(",error in creating point table for participants");
    }

    const pointTableIds = pointTable.map((record) => record?._id?.toString());

    // 11. Storing Rounds Ids and pointsTables into Round Robbin Format
    tournamentFormat.pointTable = pointTableIds;
    tournamentFormat.totalRounds = roundsData.totalRounds;
    tournamentFormat.rounds = roundIds;
    tournamentFormat = await tournamentFormat.save({ session });

    // 12. Updating tournament to return
    tournament.formatID = formatID;
    tournament = await tournament.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return {
      tournament: tournament,
    };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(
      ",Error in creating round robbin tournament section " + error?.message
    );
  }
};
module.exports = createRoundRobbinTournament;
