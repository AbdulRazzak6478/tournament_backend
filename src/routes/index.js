const express = require("express");
const createTournament = require("../controllers/admin/tournament/createTournament");
const updateTournamentDetails = require("../controllers/admin/tournament/updateTournamentDetails");
const addParticipantIntoTournament = require("../controllers/admin/tournament/addParticipantIntoTournament");
const removeParticipantFromTournament = require("../controllers/admin/tournament/removeParticipantFromTournament");
const deleteTournamentByID = require("../controllers/admin/tournament/deleteTournamentByID");
const getTournamentsBasedOnStatus = require("../controllers/admin/tournament/getTournamentsBasedOnStatus");
const getOverviewOfTournament = require("../controllers/admin/tournament/getOverviewOfTournament");
const {
  addCategories,
} = require("../controllers/admin/categories/createCategories");
const recoverArchiveTournament = require("../controllers/admin/tournament/recoverArchiveTournament");
const getAllRoundsAndMatchesOfFormat = require("../controllers/admin/tournament/getRoundsOfKnockoutAndDouble");
const updateTournamentRoundMatchWinner = require("../controllers/admin/tournament/knockout/updateMatchWinner");
const gettingRoundMatchesForManualFixing = require("../controllers/admin/tournament/match/getRoundMatchesForManualFixing");
const arrangingParticipantsBasedOnFixingType = require("../controllers/admin/tournament/match/arrangingParticipantsBasedOnFixingType");
const updateWinnerForDoubleKnockoutBrackets = require("../controllers/admin/tournament/doubleKnockout/updateMatchWinnerBracket");
const router = express.Router();

// categories routes
router.post("/tournament/addCategories", addCategories);
// router.get('/tournament/categories');
// router.get('/tournament/categories/:id');

// subCategories routes
// router.post('/tournament/subCategories');
// router.get('/tournament/subCategories');
// router.get('/tournament/subCategories/:id');

// // tournament routes
// POST create Tournament based on format
router.post("/tournament", createTournament);
// PUT update Tournament based on format and re arrange whole tournament
router.put(
  "/tournament/updateTournament/:tournamentID",
  updateTournamentDetails
);
// delete tournament through tournamentID
router.delete(
  "/tournament/deleteTournament/:tournamentID",
  deleteTournamentByID
);
// recover tournament through tournamentID from archived section
router.delete(
  "/tournament/deleteTournament/:tournamentID",
  recoverArchiveTournament
);
// POST Added Participant into Tournament and re arranging all tournament
router.put(
  "/tournament/addParticipant/:tournamentID",
  addParticipantIntoTournament
);
// PUT remove participant from tournament and re arranging all tournament based on format type
router.put(
  "/tournament/removeParticipant/:tournamentID",
  removeParticipantFromTournament
);
// fetch all tournaments based on status [ongoing, upcoming, completed,archived]
router.get("tournament/:status", getTournamentsBasedOnStatus);
// fetch tournament Overview
router.get("/tournament/overview/:tournamentID", getOverviewOfTournament);

// rounds and matches section
router.get(
  "/tournament/getTournamentRounds/brackets/:tournamentID",
  getAllRoundsAndMatchesOfFormat
);

// update Winner For Knockout format
router.put(
  "/tournament/knockout/updateWinner",
  updateTournamentRoundMatchWinner
);
// update Winner For double knockout winners bracket and Final Bracket format
router.put(
  "/tournament/double/winners/updateWinner",
  updateWinnerForDoubleKnockoutBrackets
);



// matches
router.get('/tournament/getParticipants/:roundID',gettingRoundMatchesForManualFixing);
router.put('/tournament/setParticipants/:roundID',arrangingParticipantsBasedOnFixingType);

// router.post("/users", playerController.createPlayer);
// router.post("/teams", teamController.createTeam);
// router.post("/tournaments", tournamentController.createTournament);
// router.post(
//   "/tournaments/double",
//   tournamentDoubleController.createDoubleEliminationTournament
// );
// router.post(
//   "/tournaments/addTeam/:tourId",
//   addTeamController.AddTeamInTournament
// );
// router.put(
//   "/tournaments/updateWinner",
//   updateWinnerController.updateMatchWinner
// );
// router.get("/tournaments/getRounds", getRoundsController.getTournamentRounds);
// router.get("/tournaments/getRounds/:roundId", getRoundsController.getRoundById);
// router.get("/tournaments/getRoundDataForFixing/:roundID", getRoundsController.getRoundAndMatchesDataForFixing);
// router.put("/tournaments/setTeamsInMatches/:roundID", setArrangeTeamsController.setArrangedTeamsInRound);

// router.put(
//   "/tournaments/double/updateWinner/winners",
//   tournamentWinnerUpdateController.updateWinnerForWinnersBracket
// );
// router.get(
//   "/tournaments/double/winnersBracket/getRounds",
//   getDoubleRoundsController.getWinnersBracketsRounds
// );
// router.put(
//   "/tournaments/double/updateWinner/losers",
//   tournamentWinnerUpdateController.updateWinnerForLoserBracket
// );
// // router.put('/tournaments/double/losersBracket/getRounds',tournamentWinnerUpdateController.updateWinnerForLoserBracket);
// router.get("/test", InfoController.testTour);

module.exports = router;
