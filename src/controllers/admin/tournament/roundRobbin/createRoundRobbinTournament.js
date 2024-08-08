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

const getRoundsAndMatchesData = (len) => {
  //   const participants = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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
  console.log("SCHEDULE", dataPayload);
  return dataPayload;
};
getRoundsAndMatchesData(12);
const createRoundRobbinTournament = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    console.log("data for round robbin :", data);

    await session.commitTransaction();
    await session.endSession();
    return data;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(
      ",Error in creating round robbin tournament section " + error?.message
    );
  }
};
module.exports = createRoundRobbinTournament;
