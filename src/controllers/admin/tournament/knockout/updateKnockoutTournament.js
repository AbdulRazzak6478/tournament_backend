const categoriesModel = require("../../../../models/categories");
const subCategoriesModel = require("../../../../models/subCategories");
const tournamentModel = require("../../../../models/tournament");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentRoundsModel = require("../../../../models/tournamentRounds");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentKnockoutModel = require("../../../../models/tournamentKnockoutFormat");
const mongoose = require("mongoose");
const _ = require("lodash");

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
      " ,error in arranging participants based on fixingType : ",
      error?.message
    );
    throw new Error(error?.message);
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
    let winnersBrackets = [];
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
      } else {
        matches = Math.round(tourTeams / 2);
        losers = Math.floor(tourTeams / 2);
        winners = Math.round(tourTeams / 2);
        roundMatchMap.set(i, matches);
        tourTeams = Math.round(tourTeams / 2);
      }
      let winnerObj = {
        roundNumber: i,
        matches,
        winners,
        losers,
      };
      winnersBrackets.push(winnerObj);
    }
    winnersBrackets = getRoundsNamesForBrackets(winnersBrackets);
    console.log("winners brackets data : ", winnersBrackets);
    return winnersBrackets;
  } catch (error) {
    throw new Error(
      ",Error in get brackets rounds and matches data " + error?.message
    );
  }
};

const updateKnockoutTournamentDetails = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log("data : ", data);
    let tournamentDetails = await tournamentModel
      .findOne({ tournamentID: data.tournamentID })
      .session(session);
    if (_.isEmpty(tournamentDetails)) {
      throw new Error(", tournament not found");
    }

    //STEPs
    // 1. checking existing categories in tournament and updating if it is different
    // 2. check for gameType of tournament to not be editable
    // 3. saving details of tournament
    // 4. adding participants and saving into tournament and reArrange entire tournament

    // 1. checking existing categories in tournament and updating if it is different
    // 1.1 mainCategory
    if (data.mainCategoryID !== tournamentDetails?.mainCategoryID?.toString()) {
      let mainCategory = await categoriesModel
        .findById(data.mainCategoryID)
        .session(session);
      if (_.isEmpty(mainCategory)) {
        throw new Error(", main category not found");
      }
      tournamentDetails.mainCategoryID = mainCategory?._id?.toString();
      tournamentDetails.mainCategoryName =
        mainCategory?.categoryName?.toString();
    }
    // 1.2 subCategory
    if (data.subCategoryID !== tournamentDetails?.subCategoryID?.toString()) {
      let subCategory = await subCategoriesModel
        .findById(data.subCategoryID)
        .session(session);
      if (_.isEmpty(subCategory)) {
        throw new Error(", sub category not found");
      }
      tournamentDetails.subCategoryID = subCategory?._id?.toString();
      tournamentDetails.subCategoryName =
        subCategory?.subCategoryName?.toString();
    }

    //checks if sportName is different
    if (
      data.sportName.toLowerCase() !==
      tournamentDetails?.sportName.toLowerCase()
    ) {
      if (tournamentDetails?.gameType === "team") {
        await tournamentTeamModel
          .updateMany(
            { tournamentID: tournamentDetails?._id },
            { sportName: data.sportName }
          )
          .session(session);
      } else {
        await tournamentPlayerModel
          .updateMany(
            { tournamentID: tournamentDetails?._id },
            { sportName: data.sportName }
          )
          .session(session);
      }
      tournamentDetails.sportName = data.sportName;
    }
    // 2. check for gameType of tournament to not be editable
    if (data.gameType !== tournamentDetails?.gameType?.toString()) {
      throw new Error(", tournament gameType cannot change");
    }
    // 3. saving details of tournament
    // tournamentDetails.tournamentName = data.name;
    // tournamentDetails.description = data.description;
    // tournamentDetails.startDate = data.startDate;
    // tournamentDetails.endDate = data.endDate;
    // tournamentDetails = await tournamentDetails.save({ session });
    let flag = false;
    if (tournamentDetails.tournamentName !== data.name) {
      flag = true;
      tournamentDetails.tournamentName = data.name;
    }
    if (tournamentDetails.description !== data.description) {
      flag = true;
      tournamentDetails.description = data.description;
    }
    if (tournamentDetails.startDate !== data.startDate) {
      flag = true;
      tournamentDetails.startDate = data.startDate;
    }
    if (tournamentDetails.endDate !== data.endDate) {
      flag = true;
      tournamentDetails.endDate = data.endDate;
    }
    if (flag) {
      tournamentDetails = await tournamentDetails.save();
    }
    // 4. adding participants and saving into tournament and reArrange entire tournament
    let existingParticipants =
      tournamentDetails?.gameType === "team"
        ? tournamentDetails?.totalTeams
        : tournamentDetails?.totalParticipants;
    data.participants = +data.participants;
    console.log("participants : ", data.participants, existingParticipants);
    if (data.participants !== existingParticipants) {
      let participantsIds = [];
      let checks = data.participants - existingParticipants > 0 ? true : false;
      console.log(
        "checks : ",
        checks,
        data.participants - existingParticipants
      );
      let remainingParticipants = checks
        ? data.participants - existingParticipants
        : data.participants;
      const tourId = tournamentDetails?._id?.toString();
      let starting = checks ? existingParticipants : 0;
      if (!checks) {
        if (tournamentDetails.gameType === "team") {
          const deletedTeams = await tournamentTeamModel.deleteMany({
            tournamentID: tourId,
          });
          console.log("deleting existing teams : ", deletedTeams);
          tournamentDetails.teams = [];
        }
        if (tournamentDetails.gameType === "individual") {
          const deletedPlayers = await tournamentPlayerModel.deleteMany({
            tournamentID: tourId,
          });
          console.log("deleting existing teams : ", deletedPlayers);
          tournamentDetails.participants = [];
        }
      }
      // 4.1 creating remaining teams or players
      if (data.gameType === "team") {
        let teamsObjData = [];
        for (let i = 1; i <= remainingParticipants; i++) {
          let obj = {
            tournamentID: tourId,
            teamNumber: starting + i,
            sportName: data.sportName,
            name: "Team #" + (starting + i),
          };
          teamsObjData.push(obj);
        }

        // creating teams in one time only and passing session into it

        const teams = await tournamentTeamModel.create([...teamsObjData], {
          session: session,
        });
        let teamsIds = teams?.map((team) => team?._id?.toString());
        // if we have team ids storing and saving into tournament model
        tournamentDetails.totalTeams = starting + teamsIds.length;
        tournamentDetails.teams.push(...teamsIds);
        participantsIds = [...tournamentDetails.teams];
      }
      // 4.1 creating remaining players
      if (data.gameType === "individual") {
        let playersObjData = [];
        for (let i = 1; i <= remainingParticipants; i++) {
          let obj = {
            tournamentID: tourId,
            playerNumber: starting + i,
            sportName: data.sport,
            name: "Player #" + (starting + i),
          };
          playersObjData.push(obj);
        }

        // creating players in one time only and passing session into it

        const players = await tournamentPlayerModel.create(
          [...playersObjData],
          {
            session: session,
          }
        );
        let playersIds = players?.map((player) => player?._id?.toString());
        // if we have players ids storing and saving into tournament model
        tournamentDetails.totalTeams = starting + playersIds.length;
        tournamentDetails.participants.push(...playersIds);
        participantsIds = [...tournamentDetails.participants];
      }

      const deletedRounds = await tournamentRoundsModel
        .deleteMany({
          tournamentID: tournamentDetails?._id,
          formatTypeID: tournamentDetails?.formatID,
        })
        .session(session);
      const deletedMatches = await tournamentMatchModel
        .deleteMany({
          tournamentID: tournamentDetails?._id,
          formatTypeID: tournamentDetails?.formatID,
        })
        .session(session);

      console.log("deleted Rounds : ", deletedRounds);
      console.log("deleted matches : ", deletedMatches);

      // 4.2 Getting number of rounds possible in tournament
      const totalRounds = Math.ceil(Math.log2(participantsIds.length)); // possible number of rounds
      const roundNames = [];

      // 4.3 storing rounds names into roundsNames array for reference
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
      // 4.4 getting tournament format
      let tournamentFormat = await tournamentKnockoutModel
        .findById(tournamentDetails?.formatID?.toString())
        .session(session);
      if (_.isEmpty(tournamentFormat)) {
        throw new Error(", tournament knockout format not found");
      }

      // 4.5 storing details into format
      tournamentFormat.totalRounds = totalRounds;
      tournamentFormat.roundNames = roundNames;
      if (tournamentFormat?.gameType === "team") {
        tournamentFormat.totalTeams = participantsIds.length;
        tournamentFormat.teams = participantsIds;
      }
      if (tournamentFormat?.gameType === "individual") {
        tournamentFormat.totalParticipants = participantsIds.length;
        tournamentFormat.participants = participantsIds;
      }

      // 4.6 preparing rounds data and number of matches possible in each round and storing them in roundsData
      let roundsData = getBracketsRoundsAndMatches(participantsIds.length);
      // Forming rounds Data;
      roundsData = roundsData?.map((round) => {
        return {
          roundNumber: round?.roundNumber,
          roundName: round?.roundName,
          matches: round?.matches,
          tournamentID: tournamentDetails?._id?.toString(),
          formatTypeID: tournamentFormat?._id?.toString(),
        };
      });

      // 4.7 Iterating over rounds data and creating rounds and matches respective to rounds and storing them

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
            " ,not able to create round in tournament knockout section "
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
            ",not able to create matches for the respective round"
          );
        }
        matchIds = matches?.map((match) => match?._id?.toString());
        round?.matches.push(...matchIds); // storing matches ids
        await round.save({ session });
      }

      // 4.8 referencing next rounds matches into previous rounds matches to help the winner to move forward

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
        throw new Error(",not able to fetch rounds and matches data");
      }
      // Generating array upto rounds length to iterate
      let rounds = Array.from(
        new Array(allRoundsData.length),
        (value, index) => index + 1
      );
      // saving the next rounds matches Ids into Map
      allRoundsData?.forEach((round) => {
        const matchArray = round?.matches?.map((match) =>
          match?._id?.toString()
        );
        roundMatchIdsMap.set(round.roundNumber, matchArray);
      });

      // 4.9 iterating over the rounds and there matches to add reference of next rounds matches
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

      // 4.10 matches placeholder making
      // 1. start allocating placeholder from next round
      for (let i = 2; i <= rounds.length; i++) {
        let prevRoundMatchesIds = roundMatchIdsMap.get(i - 1);
        let currentRoundMatches = allRoundsData[i - 1].matches;
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

      // 4.11 handling winners round one for odd match also updating its references into next matches and round
      allRoundsData.sort(
        (round1, round2) => round1?.roundNumber - round2?.roundNumber
      );
      // 4.12 arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

      const allRoundsAndMatches = allRoundsData;
      if (_.isEmpty(allRoundsAndMatches)) {
        throw new Error(
          ",not able to fetch rounds & matches data tournamentID and formatTypeID"
        );
      }

      const arrangedTeams = arrangingTeamsBasedOnFixingType(
        data.fixingType,
        participantsIds
      );

      // 4.13 assigning participants into round matches
      let index = 0;
      for (let match of allRoundsAndMatches[0].matches) {
        if (index < arrangedTeams.length) {
          match.teamA = arrangedTeams[index];
          if (index + 1 < arrangedTeams.length) {
            match.teamB = arrangedTeams[index + 1];
            index += 2;
          }
          match = await match.save({ session });
        }
      }

      // 4.14 storing rounds ids in format model
      const allRounds = allRoundsAndMatches;
      if (_.isEmpty(allRounds)) {
        throw new Error(
          ",error in fetching rounds and matches to assign ids to tournament Format"
        );
      }
      let roundsIds = allRounds?.map((round) => round?._id?.toString());
      tournamentFormat?.rounds.push(...roundsIds);
      tournamentFormat = await tournamentFormat.save({ session });

      tournamentDetails.formatID = tournamentFormat?._id?.toString();
      tournamentDetails = await tournamentDetails.save({ session });
    } else if (data.fixingType !== tournamentDetails?.fixingType) {
      console.log(
        "different fixingType",
        tournamentDetails?.fixingType,
        data.fixingType
      );
      await tournamentKnockoutModel
        .findByIdAndUpdate(tournamentDetails?.formatID, {
          fixingType: data.fixingType,
        })
        .session(session);
      await tournamentRoundsModel
        .updateMany(
          { tournamentID: tournamentDetails?._id },
          { fixingType: data.fixingType },
          { new: true, runValidators: true }
        )
        .session(session);
      let rounds = await tournamentRoundsModel
        .find({ tournamentID: tournamentDetails?._id })
        .populate("matches")
        .session(session);
      let round1 = rounds?.filter((round) => round.roundNumber === 1);
      round1 = round1[0];

      let participantsIds =
        tournamentDetails?.gameType === "team"
          ? [...tournamentDetails.teams]
          : [...tournamentDetails.participants];
      const arrangedTeams = arrangingTeamsBasedOnFixingType(
        data.fixingType,
        participantsIds
      );

      // assigning participants into round matches
      let index = 0;
      for (let match of round1.matches) {
        if (index < arrangedTeams.length) {
          match.teamA = arrangedTeams[index];
          if (index + 1 < arrangedTeams.length) {
            match.teamB = arrangedTeams[index + 1];
            index += 2;
          }
          match = await match.save({ session });
        }
      }
      tournamentDetails.fixingType = data.fixingType;
      tournamentDetails = await tournamentDetails.save({ session });
    }

    let responsePayload = { tournament: tournamentDetails };
    await session.commitTransaction();
    await session.endSession();
    return responsePayload;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log(
      "error in updating knockout tournament details ",
      error?.message
    );
    throw new Error(",Error in updating knockout tournament " + error?.message);
  }
};

module.exports = updateKnockoutTournamentDetails;
