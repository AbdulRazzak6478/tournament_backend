const tournamentModel = require("../../../../models/tournament.js");
const tournamentKnockoutModel = require("../../../../models/tournamentKnockoutFormat.js");
const tournamentRoundModel = require("../../../../models/tournamentRounds.js");
const tournamentMatchModel = require("../../../../models/tournamentMatch.js");
const tournamentTeamModel = require("../../../../models/tournamentTeam.js");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer.js");
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
      "error in arranging participants based on fixingType : ",
      error?.message
    );
    throw new Error(error?.message);
  }
};

const removeParticipantInKnockoutFormatAndReArrangeTournament = async (
  tournament,
  participantId
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let tournamentDetails = await tournamentModel
      .findById(tournament?._id?.toString())
      .session(session);
    let tournamentKnockoutDetails = await tournamentKnockoutModel
      .findById(tournament?.formatID?.toString())
      .populate("rounds")
      .session(session);

    let isWinnerDeclared = false;
    if (tournamentKnockoutDetails?.rounds[0]?.winners.length > 0) {
      isWinnerDeclared = true;
    }
    if (isWinnerDeclared) {
      throw new Error(" => tournament started , cannot remove participants");
    }

    // deleting existing rounds and there tournament matches
    let deleteRounds = await tournamentRoundModel
      .deleteMany({
        tournamentID: tournamentDetails?._id,
      })
      .session(session);
    let deleteAllMatches = await tournamentMatchModel
      .deleteMany({
        tournamentID: tournamentDetails?._id,
      })
      .session(session);
    console.log(
      " rounds deleted : " +
        deleteRounds +
        " , deleted matches : " +
        deleteAllMatches
    );

    // Creating new Participant
    // gameType == team
    let tourID = tournamentDetails?._id?.toString();
    let allParticipantsIds = [];
    let deletedParticipant = {};
    if (tournamentDetails?.gameType === "team") {
        deletedParticipant = await tournamentTeamModel.findByIdAndDelete(participantId).session(session);
      const teams = await tournamentTeamModel
        .find({ tournamentID: tourID })
        .session(session);
      if (_.isEmpty(teams)) {
        throw new Error(
          " => Error occur in fetching teams in knockout section"
        );
      }
      allParticipantsIds = teams?.map((team) => team?._id?.toString());
    }
    // gameType == individual
    if (tournamentDetails?.gameType === "individual") {
      deletedParticipant = await tournamentPlayerModel.findByIdAndDelete(participantId).session(session);
      const players = await tournamentPlayerModel
        .find({ tournamentID: tourID })
        .session(session);
      if (_.isEmpty(players)) {
        throw new Error(
          " => Error occur in fetching players in knockout section"
        );
      }
      allParticipantsIds = players?.map((team) => team?._id?.toString());
    }
    console.log("deleted Participant : ", deletedParticipant);

    // Getting number of rounds possible in tournament
    const totalRounds = Math.ceil(Math.log2(allParticipantsIds.length)); // possible number of rounds
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

    // preparing rounds data and number of matches possible in each round and storing them in roundsData
    let roundsData = [];
    let roundMatchMap = new Map();
    let tourTeams = allParticipantsIds.length;
    for (let i = 1; i <= totalRounds; i++) {
      let roundObj = {
        tournamentID: tournamentDetails?._id?.toString(),
        formatTypeID: tournamentKnockoutDetails?._id?.toString(),
        fixingType: tournamentDetails?.fixingType,
        gameType: tournamentDetails.gameType,
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

    // Iterating over rounds data and creating rounds and matches respective to rounds and storing them

    for (let roundData of roundsData) {
      // Create a new round
      const roundPayload = {
        roundNumber: roundData.roundNumber,
        roundName: roundData.roundName,
        tournamentID: roundData.tournamentID,
        formatTypeID: roundData.formatTypeID,
        formatName: tournamentDetails?.formatType,
        fixingType: tournamentDetails?.fixingType,
        brackets: "winners",
        gameType: tournamentDetails?.gameType,
      };
      if (roundData.roundNumber === 1) {
        roundPayload.participants = allParticipantsIds;
      }
      let round = await tournamentRoundModel.create([roundPayload], {
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
          gameType: tournamentDetails.gameType,
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

    // referencing next rounds matches into previous rounds matches to help the winner to move forward

    const roundMatchIdsMap = new Map();
    let formatId = tournamentKnockoutDetails?._id?.toString();
    // Get all rounds data and matches
    let allRoundsData = await tournamentRoundModel
      .find({
        tournamentID: tourID,
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
    // handling winners round one for odd match also updating its references into next matches and round
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

    // arranging teams in matches based on fixingType and also handling if 1 team left in 1st round to happen match

    const allRoundsAndMatches = await tournamentRoundModel
      .find({
        tournamentID: tourID,
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
      tournamentDetails.fixingType,
      allParticipantsIds
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

    // storing rounds ids in format model
    const allRounds = allRoundsAndMatches;
    if (_.isEmpty(allRounds)) {
      throw new Error(
        " => error in fetching rounds and matches to assign ids to tournament Format"
      );
    }
    const roundIds = allRounds?.map((round) => round?._id?.toString());
    if (tournamentDetails?.gameType == "team") {
      tournamentKnockoutDetails.totalRounds = totalRounds;
      tournamentKnockoutDetails.roundNames = roundNames;
      tournamentKnockoutDetails.totalTeams = allParticipantsIds.length;
      tournamentKnockoutDetails.teams = allParticipantsIds;
      tournamentKnockoutDetails.rounds = roundIds;

      tournamentDetails.totalTeams = allParticipantsIds.length;
      tournamentDetails.teams = allParticipantsIds;
    }
    if (tournamentDetails?.gameType == "individual") {
      tournamentKnockoutDetails.totalRounds = totalRounds;
      tournamentKnockoutDetails.roundNames = roundNames;
      tournamentKnockoutDetails.totalParticipants = allParticipantsIds.length;
      tournamentKnockoutDetails.participants = allParticipantsIds;
      tournamentKnockoutDetails.rounds = roundIds;

      tournamentDetails.totalParticipants = allParticipantsIds.length;
      tournamentDetails.participants = allParticipantsIds;
    }
    tournamentDetails = await tournamentDetails.save({ session });
    tournamentKnockoutDetails = await tournamentKnockoutDetails.save({
      session,
    });
    const responsePayload = {
      deleteRounds,
      deleteAllMatches,
      tournament: tournamentDetails,
      tournamentKnockout: tournamentKnockoutDetails,
    };
    await session.commitTransaction();
    await session.endSession();
    return responsePayload;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.log(error?.message);
    throw new Error(
      " Error in removing participant in knockout format :" +
        error?.message
    );
  }
};

module.exports = removeParticipantInKnockoutFormatAndReArrangeTournament;
