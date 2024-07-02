const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const roundModel = require("../models/Rounds");
const MatchesModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");

const arrangeTeamsInMatches = async (allRoundsWithMatches) => {
  try {
    let fixingType = "sequential";
    await allRoundsWithMatches?.forEach(async (round) => {
      let teams = round?.teams?.length;
      if (teams % 2 !== 0) {
        let nextMatchId = round?.matches[0]?.nextMatch.toString();
        const lastIndex = round?.matches.length;
        round.matches[0].nextMatch = round?.matches[lastIndex - 1]?._id?.toString();
        round.matches[lastIndex - 1 ].nextMatch = nextMatchId;
        await round?.matches[0].save();
        await round?.matches[lastIndex - 1].save();
      }
    });
  } catch (error) {
    console.log("error message", error.message);
    throw new Error(error?.message);
  }
};

const testTour = async (req, res) => {
  try {
    const roundMatchIdsMap = new Map();
    let tourId = "66828024a4716adf42e9ef0c";
    let formatId = "66828025a4716adf42e9ef1f";
    let allRounds = await roundModel.find({
      tournamentID: tourId,
      formatTypeID: formatId,
    });
    console.log("all rounds : ", allRounds);
    let rounds = Array.from(
      new Array(allRounds.length),
      (value, index) => index + 1
    );
    allRounds?.forEach((round) => {
      const teamsArray = round?.matches?.map((match) => match?.toString());
      roundMatchIdsMap.set(round.roundNumber, teamsArray);
    });
    console.log("round matches ids map : ", roundMatchIdsMap);
    //     SuccessResponse.data = {
    //         allRounds :allRounds,
    //         roundMatchIdsMap : roundMatchIdsMap,
    //         // allMatches : allMatches,
    //     };
    // return res.status(201).json(SuccessResponse);
    for (let round of rounds) {
      // let round = await roundModel.findOne({roundNumber :round, tournamentID :tourId , formatTypeID: formatId});
      let roundMatches = await MatchesModel.find({
        _id: roundMatchIdsMap.get(round),
      });
      console.log("round : ", round, " , matches : ", roundMatches);
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
    let allMatches = await MatchesModel.find({ tournamentID: tourId });
    const allRoundsAndMatches = await roundModel
      .find({
        tournamentID: tourId,
        formatTypeID: formatId,
      })
      .populate(["matches"]);
    SuccessResponse.data = {
      //   allRounds: allRounds,
      //   roundMatchIdsMap: roundMatchIdsMap,
      //   allMatches: allMatches,
      allRoundsAndMatches: allRoundsAndMatches,
    };
    await arrangeTeamsInMatches(allRoundsAndMatches);
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    console.log("error in createTeam controller");
    ErrorResponse.error = new AppError(
      `error in creating createTeam : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};
const info = (req, res) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "API is live",
    error: {},
    data: {},
  });
};

module.exports = {
  testTour,
  info,
};
