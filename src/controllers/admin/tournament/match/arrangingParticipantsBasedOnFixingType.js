const catchAsync = require("../../../../utils/catchAsync.js");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response.js");
const tournamentRoundModel = require("../../../../models/tournamentRounds.js");
const mongoose = require("mongoose");
const _ = require("lodash");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const arrangingParticipantsManually = async (participantsArr, roundData) => {
  try {
    let index = 0;
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
const arrangingParticipantsBasedOnFixingType = catchAsync(async (req, res) => {
  try {
    const { roundID } = req.params;
    if (_.isEmpty(roundID)) {
      return res
        .status(400)
        .json(failed_response(400, " roundID is required", {}, false));
    }
    if (!isValidObjectId(roundID)) {
      return res
        .status(400)
        .json(
          failed_response(400, "Pass an valid roundID into params", {}, false)
        );
    }
    if (_.isEmpty(req.body.participantsArr)) {
      return res
        .status(400)
        .json(failed_response(400, " participantsArr is required", {}, false));
    }
    let arrangedParticipantsArr = req.body.participantsArr;
    if (!Array.isArray(arrangedParticipantsArr)) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            " participantsArr is not an array of Ids ",
            {},
            false
          )
        );
    }
    const isParticipantsArrValid = arrangedParticipantsArr.filter((id) => {
      if (!isValidObjectId(id)) {
        return id;
      }
    });
    if (isParticipantsArrValid.length > 0) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            " incoming field :participantsArr:  " +
              isParticipantsArrValid.length +
              " ids are not valid",
            { inValid_Ids: isParticipantsArrValid },
            false
          )
        );
    }

    let roundData = await tournamentRoundModel
      .findOne({ _id: roundID })
      .populate(["matches"]);

    if (roundData?.winners.length > 0) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "Winner is declared in the round , cannot arrange participants",
            {},
            false
          )
        );
    }

    let responseData = await arrangingParticipantsManually(
      arrangedParticipantsArr,
      roundData
    );

    return res
      .status(200)
      .json(
        success_response(
          201,
          "Successfully arranged participants manually into round's matches",
          responseData,
          true
        )
      );
  } catch (err) {
    res
      .status(400)
      .json(
        failed_response(
          400,
          "Something went wrong while arranging participants manually into matches",
          { message: err.message },
          false
        )
      );
  }
});

module.exports = arrangingParticipantsBasedOnFixingType;
