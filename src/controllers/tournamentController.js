const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");
const tournamentModel = require("../models/tournament");
const teamModel = require("../models/team");
const knockoutModel = require("../models/knockoutFormat");
const roundModel = require("../models/Rounds");
const matchModel = require("../models/matches");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index");

const createTeams = async (idsArr, tourId) => {
  try {
    // arr = [1,2,3,4,5,6,7,8]
    let arr2 = [1];
    idsArr = idsArr.map((value, index) => {
      let obj = {
        tournamentID: "667eba1bcef0fb85d04b799a",
        teamNumber: value,
        sportName: "cricket",
        teamName: "Team #" + value,
      };
      return obj;
      // let newTeam = new teamModel(obj);
      // let saveTeam = await newTeam.save();
      // console.log('team ',(index+1)," , ",saveTeam);
      // console.log('team id :',saveTeam?._id?.toString())
      // idsArr.push(saveTeam?._id?.toString());
    });

    // const data = await teamModel.find({ tournamentID: "667eba1bcef0fb85d04b799a" });
    // console.log("object of teams : ", data);
    console.log("before", [...idsArr]);
    const teams = await teamModel.create([
      // { tournamentID: "667eba1bcef0fb85d04b799a", teamNumber: 1, teamName: "team #1" },
      // { tournamentID: "667eba1bcef0fb85d04b799a", teamNumber: 2, teamName: "team #2" },
      ...idsArr,
    ]);
    console.log("data of teams : ", teams);
    idsArr = teams?.map((team) => team?._id?.toString());
    console.log("teams array : ", idsArr);
    return teams;
  } catch (error) {
    console.log("error in creating teams", error?.message);
    throw new Error(error?.message);
  }
};
const createTournament = async (req, res) => {
  try {
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
      teams: +req.body.totalTeams,
    };
    console.log("data : ", data);
    const totalRounds = Math.ceil(Math.log2(data.teams));
    const roundNames = [];
    let roundsData = [];

    console.log("total : ", totalRounds);

    let roundType = "";
    // let roundMatchMap = new Map();
    // // let tourTeams = data.teams;
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
      // if (tourTeams % 2 !== 0) {
      //   let matches = Math.round(tourTeams / 2);
      //   tourTeams = Math.floor(tourTeams / 2);
      //   roundMatchMap.set(i, matches);
      //   let obj = {
      //     roundNumber: i,
      //     roundName: roundNames[i - 1],
      //     tourId: "tourID",
      //     formatId: "formatID",
      //     matches: roundMatchMap.get(i),
      //   };
      //   roundsData.push(obj);
      // } else if (tourTeams % 2 === 0) {
      //   let matches = Math.round(tourTeams / 2);
      //   tourTeams = Math.floor(tourTeams / 2);
      //   roundMatchMap.set(i, matches);
      //   let obj = {
      //     roundNumber: i,
      //     roundName: roundNames[i - 1],
      //     tourId: "tourID",
      //     formatId: "formatID",
      //     matches: roundMatchMap.get(i),
      //   };
      //   roundsData.push(obj);
      // } else {
      //   let obj = {
      //     roundNumber: i,
      //     roundName: roundNames[i - 1],
      //     tourId: "tourID",
      //     formatId: "formatID",
      //     matches: roundMatchMap.get(i),
      //   };
      //   roundsData.push(obj);
      // }
    }
    // console.log("rounds matches map : ", roundMatchMap);
    // SuccessResponse.data = {
    //   totalRounds : totalRounds,
    //   roundNames : roundNames,
    //   roundMatchMap : roundMatchMap,
    //   roundData : roundData,
    // }
    // return res.status(201).json(SuccessResponse);

    // 1. stores all teams in to round 1
    // create matches into all rounds
    let teamsIdsForTournament = [];
    let knockoutIdForTournament = "";
    //creating tournament

    const tournamentData = {
      tournamentID: random,
      formatName: data.formatType,
      fixingType: data.fixingType,
      gameType: data.gameType,
      totalRounds: totalRounds,
      roundNames: roundNames,
      totalTeams: data.teams,
      // teams,
    };

    console.log("tour data : ", tournamentData);
    let tournament = await tournamentModel.create(tournamentData);
    console.log("tournament created : ", tournament);

    // creating Teams
    let newArray = Array.from(
      new Array(data.teams),
      (value, index) => index + 1
    );
    // console.log('new array : ',newArray);
    const id = "1234567890";
    // teamsIds = await createTeams(newArray, id);
    const tourId = tournament?._id?.toString();
    newArray = newArray.map((value, index) => {
      let obj = {
        tournamentID: tourId,
        teamNumber: value,
        sportName: "cricket",
        teamName: "Team #" + value,
      };
      return obj;
      // let newTeam = new teamModel(obj);
      // let saveTeam = await newTeam.save();
      // console.log('team ',(index+1)," , ",saveTeam);
      // console.log('team id :',saveTeam?._id?.toString())
      // idsArr.push(saveTeam?._id?.toString());
    });

    // { tournamentID: "667eba1bcef0fb85d04b799a", teamNumber: 1, teamName: "team #1" },
    // { tournamentID: "667eba1bcef0fb85d04b799a", teamNumber: 2, teamName: "team #2" },
    const teams = await teamModel.create([...newArray]);
    console.log("data of teams created : ", teams);
    let teamsIds = teams?.map((team) => team?._id?.toString());
    console.log("teams ids : ", teamsIds);
    SuccessResponse.data = teams;
    if (teamsIds.length > 0) {
      // console.log("teams ids : ", teamsIds);
      // console.log('before tour : ',tournament);
      tournament.teams.push(...teamsIds);
      await tournament.save();
      // console.log('after tour : ',tournament);
      // console.log("tournament after adding teams : ", tournament);
      // return res.status(201).json(SuccessResponse);
    }

    // creating knockout section

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

    let tournamentFormat = await knockoutModel.create(formatData);
    console.log("tournament format created: ", tournamentFormat);

    // SuccessResponse.data = {
    //   totalRounds: totalRounds,
    //   roundNames: roundNames,
    //   roundMatchMap: roundMatchMap,
    //   roundData: roundData,
    //   tournament: tournament,
    //   tournamentFormat: tournamentFormat,
    // };
    // return res.status(201).json(SuccessResponse);

    // let roundsData = [];
    let roundMatchMap = new Map();
    let tourTeams = data.teams;
    for (let i = 1; i <=totalRounds; i++) {
      let roundObj = {
        tournamentID: tournament?._id?.toString(),
        formatTypeID: tournamentFormat?._id?.toString(),
        fixingType: data.fixingType,
        gameType: data.gameType,
        roundNumber: i,
        roundName: roundNames[i-1],
        // teams: teamsIds,
      };
      // if(i===1){
      //   roundObj.teams = teamsIds; 
      // }
      if (tourTeams % 2 !== 0) {
        let matches = Math.round(tourTeams / 2);
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        roundObj.matches = roundMatchMap.get(i);
        // let obj = {
        //   roundNumber: i,
        //   roundName: roundNames[i - 1],
        //   tourId: "tourID",
        //   formatId: "formatID",
        //   matches: roundMatchMap.get(i),
        // };
        roundsData.push(roundObj);
      } else if (tourTeams % 2 === 0) {
        let matches = Math.round(tourTeams / 2);
        tourTeams = Math.floor(tourTeams / 2);
        roundMatchMap.set(i, matches);
        roundObj.matches = roundMatchMap.get(i);
        // let obj = {
        //   roundNumber: i,
        //   roundName: roundNames[i - 1],
        //   tourId: "tourID",
        //   formatId: "formatID",
        //   matches: roundMatchMap.get(i),
        // };
        roundsData.push(roundObj);
      }
      //  else {
      //   roundObj.matches = roundMatchMap.get(i);
      //   // let obj = {
      //   //   roundNumber: i,
      //   //   roundName: roundNames[i - 1],
      //   //   tourId: "tourID",
      //   //   formatId: "formatID",
      //   //   matches: roundMatchMap.get(i),
      //   // };
      //   roundsData.push(obj);
      // }
      // roundsData.push(roundObj);
      // let newRound = new roundModel(roundObj);
      // let saveRound = await newRound.save();
      // RoundsIds.push(saveRound?._id?.toString());
    }

    // let roundsDataArray = await roundModel.create([roundsData]);
    // console.log("rounds data : ", roundsDataArray);
    // let RoundsIds = [];
    // RoundsIds = roundsDataArray?.map((round)=>round?._id?.toString());
    // tournamentFormat?.rounds.push(RoundsIds);
    console.log('roundsData : ',roundsData);
    for (let roundData of roundsData) {
      // Create a new round
      const data = {
        roundNumber: roundData.roundNumber,
        roundName: roundData.roundName,
        tournamentID: roundData.tournamentID,
        formatTypeID: roundData.formatTypeID,
      };
      if(roundData.roundNumber === 1){
        data.teams = teamsIds;
      }
      const round = await roundModel.create(data);
      // await round.save();
      // const round = await Round(data);

      // Create matches for the current round
      let roundMatches = Array.from(
        new Array(roundData.matches),
        (value, index) => index + 1
      );
      // console.log("round matches : ", roundMatches);
      let matchIds = [];
      for (let matchData of roundMatches) {
        const matchObj = {
          name : "match #"+matchData,
          tournamentID : roundData.tournamentID,
          roundID : round?._id?.toString(),
          formatID : roundData.formatTypeID,
        }
        const match = await matchModel.create(matchObj);
        // await match.save();
        matchIds.push(match?._id?.toString());
      }
      round?.matches.push(...matchIds);
      await round.save();

      // Update the round with match IDs
      // round.matches = matchIds;
      // await round.save();

      console.log(`Round '${round.name}' created with ${matchIds.length} matches.`);
      // console.log(
      //   `Round '${roundData.roundName}' created with ${matchIds.length} matches.`
      // );
    }
    const allRounds = await roundModel.find({tournamentID : tourId});
    console.log('all rounds : ' ,allRounds);
    let roundsIds = allRounds?.map((round)=>round?._id?.toString());
    tournamentFormat?.rounds.push(...roundsIds);
    tournamentFormat = await tournamentFormat.save();
    console.log("updated tournament format after adding rounds ids : ", tournamentFormat);

    tournament.formatId = tournamentFormat?._id?.toString();
    tournament = await tournament.save();
    console.log("updated tournament after adding format MongoID: ", tournament);
    SuccessResponse.data = {
      teamsIds: teamsIds,
      roundsIds: roundsIds,
      allRounds: allRounds,
      format: tournamentFormat,
      tournament: tournament,
    };
    return res.status(201).json(SuccessResponse);
  } catch (error) {
    console.log("error in createTournament controller");
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

// hello sir
// i have the data of each document that i need to create
// i want to create multiple entries or documents into same model in one call
// and i want result of those documents also
// how can i do that
