const catchAsync = require("../../../../utils/catchAsync");
const {
  failed_response,
  success_response,
} = require("../../../../utils/response");
const tournamentModel = require("../../../../models/tournament");
const tournamentMatchModel = require("../../../../models/tournamentMatch");
const tournamentTeamModel = require("../../../../models/tournamentTeam");
const tournamentPlayerModel = require("../../../../models/tournamentPlayer");
const tournamentPointsTableModel = require("../../../../models/tournamentPointTable");
const mongoose = require("mongoose");
const _ = require("lodash");

// to validate ObjectId()
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const updateWinnerOfRoundRobbinMatch = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (_.isEmpty(req.body.matchID)) {
      return res
        .status(400)
        .json(failed_response(400, "matchID not found", {}, false));
    }
    if (_.isEmpty(req.body.winnerID)) {
      return res
        .status(400)
        .json(failed_response(400, "winnerID not found", {}, false));
    }
    if (!isValidObjectId(req.body.matchID)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass an valid matchID ", {}, false));
    }
    if (!isValidObjectId(req.body.winnerID)) {
      return res
        .status(400)
        .json(failed_response(400, "Pass an valid winnerID ", {}, false));
    }

    session.startTransaction();

    const { matchID, winnerID } = req.body;
    let matchDetails = await tournamentMatchModel
      .findById(matchID)
      .populate("tournamentID")
      .session(session);
    if (_.isEmpty(matchDetails)) {
      return res
        .status(400)
        .json(failed_response(400, "match not found ", {}, false));
    }
    let validWinner = true;
    if (
      matchDetails?.teamA?.toString() === winnerID ||
      matchDetails?.teamB?.toString() === winnerID
    ) {
      validWinner = false;
    }
    if (validWinner) {
      return res
        .status(400)
        .json(
          failed_response(
            400,
            "winnerID is not valid to this match ",
            {},
            false
          )
        );
    }
    if (matchDetails?.winner) {
      console.log("winner is already declared");
      if (matchDetails?.winner?.toString() === winnerID) {
        await session.commitTransaction();
        await session.endSession();
        return res
          .status(200)
          .json(
            failed_response(
              200,
              "Successfully updated winner of RR match",
              { match: matchDetails },
              true
            )
          );
      }
      let standing = await tournamentPointsTableModel
        .find({
          participantID: [
            matchDetails?.teamA?.toString(),
            matchDetails?.teamB?.toString(),
          ],
        })
        .session(session);
      if (_.isEmpty(standing)) {
        return res
          .status(400)
          .json(failed_response(400, "standing not found ", {}, false));
      }
      // revert back to previous state
      for (let record of standing) {
        if (
          record.participantID.toString() === matchDetails?.winner?.toString()
        ) {
          record.points -= 2;
          record.plays--;
          record.wins--;
        } else {
          record.plays--;
          record.losses--;
        }
        if (record.participantID.toString() === winnerID) {
          record.points += 2;
          record.plays++;
          record.wins++;
          record = await record.save({ session });
          console.log('winner record : ',record)
        } else {
          record.plays++;
          record.losses++;
          record = await record.save({ session });
          console.log('loser record : ',record)
        }
      }
    //   for (let record of standing) {
    //     if (record.participantID.toString() === winnerID) {
    //       record.points += 2;
    //       record.plays++;
    //       record.wins++;
    //       record = await record.save({ session });
    //       console.log('winner record : ',record)
    //     } else {
    //       record.plays++;
    //       record.losses++;
    //       record = await record.save({ session });
    //       console.log('loser record : ',record)
    //     }
    //   }

      matchDetails.winner = winnerID;
      matchDetails = await matchDetails.save({ session });
      await session.commitTransaction();
      await session.endSession();
      return res
        .status(200)
        .json(
          failed_response(
            200,
            "Successfully updated winner of RR match",
            { match: matchDetails },
            true
          )
        );
    }
    matchDetails.winner = winnerID;
    let standing = await tournamentPointsTableModel
      .find({
        participantID: [
          matchDetails?.teamA?.toString(),
          matchDetails?.teamB?.toString(),
        ],
      })
      .session(session);
    if (_.isEmpty(standing)) {
      return res
        .status(400)
        .json(failed_response(400, "standing not found ", {}, false));
    }
    for (let record of standing) {
      if (record.participantID.toString() === winnerID) {
        record.points += 2;
        record.plays++;
        record.wins++;
        record = await record.save({ session });
      } else {
        record.plays++;
        record.losses++;
        record = await record.save({ session });
      }
    }
    // standing = await standing.save({ session });

    matchDetails = await matchDetails.save({ session });

    const responsePayload = {
      match: matchDetails,
    };
    await session.commitTransaction();
    await session.endSession();
    return res
      .status(200)
      .json(
        success_response(
          200,
          "Successfully updated winner of RR match",
          responsePayload,
          true
        )
      );
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return res
      .status(400)
      .json(
        failed_response(
          400,
          "Something Went Wrong while updating winner RR match",
          { message: error?.message },
          false
        )
      );
  }
});

module.exports = updateWinnerOfRoundRobbinMatch;
