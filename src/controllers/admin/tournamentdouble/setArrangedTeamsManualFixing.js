// const catchAsync = require("../../../utils/catchAsync.js");
// const {
//   failed_response,
//   success_response,
// } = require("../../../utils/response.js");
const tournamentRoundModel = require("../models/Rounds.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const { SuccessResponse, ErrorResponse } = require("../utils/common/index.js");
const AppError = require("../utils/errors/app-error.js");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const arrangingParticipantsManually = async (participantsArr, roundData) => {
  try {
    // 668e89a7b4304f1af467ba40,668e89a7b4304f1af467ba41,668e89a7b4304f1af467ba42,668e89a7b4304f1af467ba3d,668e89a7b4304f1af467ba3e,668e89a7b4304f1af467ba3f,
    let index = 0;
    return participantsArr;
    for (let match of roundData.matches) {
      if (index < participantsArr.length) {
        match.teamA = participantsArr[index];
        if (index + 1 < participantsArr.length) {
          match.teamB = participantsArr[index + 1];
          index = index + 2;
        } else {
          index++;
        }
      }
      match = await match.save();
    }
    return roundData;
  } catch (error) {
    throw new Error(
      " => error in arranging teams into round " + error?.message
    );
  }
};

const setArrangedTeamsInRound = async (req, res) => {
  try {
    const id = req.params.roundID;
    console.log("round id : ", id);
    let { teams } = req.body;
    // teams = JSON.parse(teams);
    console.log('arr : ',teams)
    console.log("body : ", req.body);
    const arr = teams;
    let rounds = await tournamentRoundModel
      .findById(id)
      .populate(["matches", "tournamentID"]);

    let responseData = await arrangingParticipantsManually(arr, rounds);
    SuccessResponse.data = {
      //   rounds,
      res: responseData,
      // nextRoundDetails
    };
    return res.status(200).json(SuccessResponse);
  } catch (error) {
    console.log("error setting teams manually");
    ErrorResponse.error = new AppError(
      `error in setting teams manually : ${error?.message}`,
      500
    );
    return res.status(500).json(ErrorResponse);
  }
};

module.exports = {
  setArrangedTeamsInRound,
};



// const catchAsync = require("../../../utils/catchAsync.js");
// const {
//   failed_response,
//   success_response,
// } = require("../../../utils/response.js");
// const tournamentRoundModel = require("../../../models/tournamentRounds.js");
// const mongoose = require("mongoose");
// const _ = require("lodash");

// // to validate ObjectId()
// function isValidObjectId(id) {
//   return mongoose.Types.ObjectId.isValid(id);
// }

// const arrangingParticipantsManually = async (participantsArr, roundData) => {
//   try {
//     let index = 0;
//     for (let match of roundData.matches) {
//       if (index < participantsArr.length) {
//         match.teamA = participantsArr[index];
//         if (index + 1 < participantsArr.length) {
//           match.teamB = participantsArr[index + 1];
//           index = index + 2;
//         } else {
//           index++;
//         }
//       }
//       match = await match.save();
//     }
//     return roundData;
//   } catch (error) {
//     throw new Error(
//       " => error in arranging teams into round " + error?.message
//     );
//   }
// };
// const arrangingParticipantsBasedOnFixingType = catchAsync(async (req, res) => {
//   try {
//     const { roundID } = req.params;
//     if (_.isEmpty(roundID)) {
//       return res
//         .status(400)
//         .json(failed_response(400, " roundID is required", {}, false));
//     }
//     if (!isValidObjectId(roundID)) {
//       return res
//         .status(400)
//         .json(
//           failed_response(400, "Pass an valid roundID into params", {}, false)
//         );
//     }
//     if (_.isEmpty(req.body.participantsArr)) {
//       return res
//         .status(400)
//         .json(failed_response(400, " participantsArr is required", {}, false));
//     }
//     let arrangedParticipantsArr = req.body.participantsArr;
//     if (!Array.isArray(arrangedParticipantsArr)) {
//       return res
//         .status(400)
//         .json(
//           failed_response(
//             400,
//             " participantsArr is not an array of Ids ",
//             {},
//             false
//           )
//         );
//     }
//     const isParticipantsArrValid = arrangedParticipantsArr.filter((id) => {
//       if (!isValidObjectId(id)) {
//         return id;
//       }
//     });
//     if (isParticipantsArrValid.length > 0) {
//       return res
//         .status(400)
//         .json(
//           failed_response(
//             400,
//             " incoming field :participantsArr =>  " +
//               isParticipantsArrValid.length +
//               " ids are not valid",
//             { inValid_Ids: isParticipantsArrValid },
//             false
//           )
//         );
//     }

//     let roundData = await tournamentRoundModel
//       .findOne({ _id: roundID })
//       .populate(["matches"]);

//     if (roundData?.fixingType.toLowerCase() !== "manual") {
//       return res
//         .status(400)
//         .json(
//           failed_response(
//             400,
//             " not able to arrange the participants, tournament fixingType is : " +
//               roundData?.fixingType +
//               " , not manual",
//             {},
//             false
//           )
//         );
//     }

//     if (roundData?.winners.length > 0) {
//       return res
//         .status(400)
//         .json(
//           failed_response(
//             400,
//             "Winner is declared in the round , cannot arrange participants",
//             {},
//             false
//           )
//         );
//     }

//     let responseData = await arrangingParticipantsManually(
//       arrangedParticipantsArr,
//       roundData
//     );

//     return res
//       .status(200)
//       .json(
//         success_response(
//           201,
//           "Successfully arranged participants manually into round's matches",
//           responseData,
//           true
//         )
//       );
//   } catch (err) {
//     res
//       .status(400)
//       .json(
//         failed_response(
//           400,
//           "Something went wrong while arranging participants manually into matches",
//           { message: err.message },
//           false
//         )
//       );
//   }
// });

// module.exports = arrangingParticipantsBasedOnFixingType;
