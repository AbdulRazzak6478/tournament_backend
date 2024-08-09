const categoriesModel = require("../../../../models/categories");
const subCategoriesModel = require("../../../../models/subCategories");
const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentRoundsModel = require("../../../../models/tournamentRounds");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentKnockoutModel = require("../../../../models/tournamentKnockoutFormat");
const tournamentIdModel = require("../../../../models/tournamentIds");
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
  console.log("participant length : ", participants.length);

  let totalRounds = 0;

  let halfSize = 0;
  if (participants.length % 2 === 0) {
    totalRounds = participants.length - 1;
  } else {
    totalRounds = participants.length;
  }
  halfSize = Math.floor(participants.length / 2);
  console.log("total rounds : ", totalRounds);
  console.log("HALF SIZE", halfSize);

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
    roundsData: schedule,
  };
  //   console.log("SCHEDULE", dataPayload);
  return dataPayload;
};
// getRoundsAndMatchesData(12);
const createRoundsAndMatches = async (
  roundsData,
  matchesLength,
  roundsLength,
  participantsIds
) => {
  try {
    const { tournamentID, formatTypeID, formatName, gameType, fixingType } =
      roundsData;
    let matches = Array.from(
      new Array(matchesLength),
      (value, index) => index + 1
    );
    let rounds = Array.from(
      new Array(roundsLength),
      (value, index) => index + 1
    );

    let participantsIdsMap = new Map();
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
        participants : participantsIds
      };
      console.log("data : ", data);

    }
    return {};
  } catch (error) {
    throw new Error(
      ",Error in creating rounds and matches for round robbing " +
        error?.message
    );
  }
};
const createRoundRobbinTournament = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    data.participants = +data.participants;
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

    // Getting Random string for storing it into tournament => tournamentID  ||  unique to tournament
    let tournamentId = await generateTournamentId();

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
    const uniqueId = await tournamentIdModel.create(
      [{ tournamentID: tournamentId }],
      { session: session }
    );
    console.log("tournament Unique id : ", uniqueId);

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

    // creating knockout section
    // knockoutFormatData Payload
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

    // creating tournament knockout format
    let tournamentFormat = await tournamentKnockoutModel.create([formatData], {
      session: session,
    });
    if (_.isEmpty(tournamentFormat)) {
      throw new Error(",not able to create tournament knockout format ");
    }
    tournamentFormat = tournamentFormat[0];

    let roundsData = getRoundsAndMatchesData(data.participants);
    console.log("roundsData : ", roundsData);
    const formatID = tournamentFormat?._id?.toString();
    const roundsPayload = {
      tournamentID: tourId,
      formatTypeID: formatID,
      formatName: "round_robbin",
      gameType: data.gameType,
      fixingType: data.fixingType,
    };
    const rounds = await createRoundsAndMatches(
      roundsPayload,
      roundsData.matchesLength,
      roundsData.totalRounds,
      participantsIds
    );

    await session.commitTransaction();
    await session.endSession();
    return roundsData;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(
      ",Error in creating round robbin tournament section " + error?.message
    );
  }
};
module.exports = createRoundRobbinTournament;
