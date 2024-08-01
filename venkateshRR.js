const Standing = require("../modals/standings.js");
const Match = require("../modals/match.js");

const updateWinner = async (req, res) => {
  try {
    const { matchId, winnerId } = req.params;
    const findMatch = await Match.findById(matchId);
    if (!findMatch) {
      return res.status(400).json({ message: "Match not found" });
    }
    if (findMatch.winner !== null) {
      if (findMatch.winner.toString() === winnerId.toString()) {
        return res
          .status(
            
          )
          .json({ match: findMatch, message: "Match updated successfully 1" });
      }

      const findWinner = await Standing.findOne({ team: findMatch.winner });
      // findWinner.plays -= 1;
      findWinner.wins -= 1;
      // findWinner.points -= 10;
      await findWinner.save();

      const findLooser = await Standing.findOne({ team: findMatch.looser });
      // findLooser.plays -= 1;
      findLooser.losses -= 1;
      // findLooser.points += 5;
      await findLooser.save();

      let updatedMatch = await Match.findByIdAndUpdate(
        matchId,
        { winner: winnerId },
        { runValidators: true, new: true }
      );

      let looserId;

      if (updatedMatch.winner.toString() === updatedMatch.team1.toString()) {
        looserId = updatedMatch.team2;
      } else if (
        updatedMatch.winner.toString() === updatedMatch.team2.toString()
      ) {
        looserId = updatedMatch.team1;
      }

      if (looserId != "") {
        updatedMatch = await Match.findByIdAndUpdate(
          matchId,
          { looser: looserId },
          { runValidators: true, new: true }
        );
      }

      const findWinnerStanding = await Standing.findOne({
        team: updatedMatch.winner,
      });

      findWinnerStanding.wins += 1;
      // findWinnerStanding.plays += 1;
      // findWinnerStanding.points += 10;

      await findWinnerStanding.save();

      const findLooserStanding = await Standing.findOne({
        team: updatedMatch.looser,
      });

      findLooserStanding.losses += 1;
      // findLooserStanding.plays += 1;
      // findLooserStanding.points -= 5;

      await findLooserStanding.save();

      return res
        .status(201)
        .json({ match: updatedMatch, message: "Match updated successfully 2" });
    }

    let updateWinner = await Match.findByIdAndUpdate(
      matchId,
      {
        winner: winnerId,
        status: "COMPLETED",
      },
      { runValidators: true, new: true }
    );

    let looser;

    if (updateWinner.winner !== null) {
      if (updateWinner.winner.toString() === updateWinner.team1.toString()) {
        looser = updateWinner.team2;
      } else if (
        updateWinner.winner.toString() === updateWinner.team2.toString()
      ) {
        looser = updateWinner.team1;
      }
    }

    if (looser !== "") {
      updateWinner = await Match.findByIdAndUpdate(
        matchId,
        { looser: looser, status: "COMPLETED" },
        { runValidators: true, new: true }
      );
    }

    const findWinner = await Standing.findOne({
      team: updateWinner.winner,
    });

    if (!findWinner) {
      return res.status(400).json({ message: "Winner Standing Not Found" });
    }

    findWinner.plays += 1;
    findWinner.wins += 1;
    // findWinner.points += 10;

    await findWinner.save();

    const findLooser = await Standing.findOne({ team: updateWinner.looser });

    if (!findLooser) {
      return res.status(400).json({ message: "Looser Standing Not Found" });
    }

    findLooser.plays += 1;
    findLooser.losses += 1;
    // findLooser.points -= 5;

    await findLooser.save();

    return res.status(200).json({ match: updateWinner });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "internal server error" });
  }
};

module.exports = updateWinner; 