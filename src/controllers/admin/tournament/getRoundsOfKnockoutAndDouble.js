const catchAsync = require("../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../utils/response.js");
const tournamentModel = require("../../../models/tournament.js");
const tournamentRoundModel = require("../../../models/tournamentRounds.js");
const tournamentTeamModel = require("../../../models/tournamentTeam.js");
const tournamentPlayerModel = require("../../../models/tournamentPlayer.js");
const _ = require("lodash");

const getRoundsAndMatchesWithParticipants = async (rounds) => {
  try {
    let participantsDetails = [];
    if (rounds[0]?.gameType === "team") {
      participantsDetails = await tournamentTeamModel.find({}, { name: 1 });
    } else if (rounds[0]?.gameType === "individual") {
      participantsDetails = await tournamentPlayerModel.find({}, { name: 1 });
    }
    if (_.isEmpty(participantsDetails)) {
      participantsDetails = [];
    }
    let participantsMap = new Map();
    participantsDetails?.map((participant) => {
      participantsMap.set(participant?._id?.toString(), participant?.name);
      return participant;
    });

    let bracketCheck = rounds[0]?.brackets;
    let roundsData = rounds?.map((round) => {
      let matchesData = round?.matches?.map((match) => {
        let winA = "Winner";
        let winB = "Winner";
        if (bracketCheck === "losers") {
          winA = match?.matchA?.bracket === bracketCheck ? "Winner" : "Loser";
          winB = match?.matchA?.bracket === bracketCheck ? "Winner" : "Loser";
        } else if (bracketCheck === "Final Bracket") {
          winA = match?.matchA?.bracket === bracketCheck ? "Winner" : "Winner";
          winB = match?.matchA?.bracket === bracketCheck ? "Winner" : "Winner";
        }
        const matchA = match?.matchA?.name
          ? winA + " From " + match?.matchA?.name
          : "";
        const matchB = match?.matchB?.name
          ? winB + " From " + match?.matchB?.name
          : "";
        const participantA = match?.teamA?.toString()
          ? participantsMap.get(match?.teamA?.toString())
          : matchA;
        const participantB = match?.teamB?.toString()
          ? participantsMap.get(match?.teamB?.toString())
          : matchB;
        console.log("venue : ", match?.venueID);
        return {
          id: match?._id?.toString(),
          name: match?.name,
          participantA_Id: match?.teamA?.toString(),
          participantA: participantA,
          participantB_Id: match?.teamB?.toString(),
          participantB: participantB,
          scoreA: match?.scoreA,
          scoreB: match?.scoreB,
          dateOfPlay: match?.dateOfPlay,
          timing: match?.timing,
          winnerID: match?.winner ? match?.winner?.toString() : null,
          winner: match?.winner?.toString()
            ? participantsMap.get(match?.winner?.toString())
            : null,
          status: match?.status,
          venue: {
            id: match?.venueID?._id?.toString(),
            name: match?.venueID?.venueClubId?.ClubName,
            location: match?.venueID?.venueClubId?.location_operating,
            city: match?.venueID?.city,
          },
        };
      });
      return {
        roundID: round?._id?.toString(),
        roundName: round?.roundName,
        fixingType: round?.fixingType,
        gameType: round?.gameType,
        roundNumber: round?.roundNumber,
        matches: matchesData,
      };
    });
    return roundsData;
  } catch (error) {
    throw new Error(
      ",error in getting rounds and matches with participants " + error?.message
    );
  }
};

const getAllRoundsAndMatchesOfFormat = catchAsync(async (req, res) => {
  try {
    const { tournamentID } = req.params;
    const { bracket } = req.query;
    if (_.isEmpty(tournamentID)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass an valid tournamentID ", {}, false));
    }
    const brackets = ["winners", "losers", "Final Bracket"];
    if (!brackets.includes(bracket)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "Pass a bracket of round like : winners or losers or Final Bracket",
            {},
            false
          )
        );
    }
    const tournament = await tournamentModel.findOne({
      tournamentID: tournamentID,
    });
    if (_.isEmpty(tournament)) {
      return res
        .status(400)
        .json(failed_response(400, "no tournament is found", {}, false));
    }
    const data = {
      tournamentID: tournament?._id?.toString(),
      formatTypeID: tournament?.formatID?.toString(),
      brackets: bracket,
    };
    console.log("before venue");
    let rounds = await tournamentRoundModel
      .find({ tournamentID: data.tournamentID, brackets: data.brackets })
      .populate({ path: "matches", populate: ["matchA", "matchB",{path : 'venueID' , populate : 'venueClubId'}] })
      .populate("participants");
    if (_.isEmpty(rounds)) {
      rounds = [];
    }
    console.log("after venue");
    //sorting rounds based on round number
    rounds.sort((round1, round2) => round1?.roundNumber - round2?.roundNumber);
    let roundsData = await getRoundsAndMatchesWithParticipants(rounds);
    let responsePayload = {
      length: rounds.length,
      rounds: roundsData,
    };

    return res
      .status(200)
      .json(
        success_response(
          200,
          "Successfully fetching tournament rounds and matches through tournamentID ",
          responsePayload,
          true
        )
      );
  } catch (err) {
    res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while fetching tournament rounds and matches",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = getAllRoundsAndMatchesOfFormat;
