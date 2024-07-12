const express = require('express');
const { InfoController , playerController, teamController, tournamentController, updateWinnerController, getRoundsController, addTeamController, tournamentDoubleController, tournamentWinnerUpdateController} = require('../controllers');
const router = express.Router();

router.get('/info',InfoController.info);
router.post('/users',playerController.createPlayer);
router.post('/teams',teamController.createTeam);
router.post('/tournaments',tournamentController.createTournament);
router.post('/tournaments/double',tournamentDoubleController.createDoubleEliminationTournament);
router.post('/tournaments/addTeam/:tourId',addTeamController.AddTeamInTournament);
router.put('/tournaments/updateWinner',updateWinnerController.updateMatchWinner);
router.get('/tournaments/getRounds',getRoundsController.getTournamentRounds);
router.get('/tournaments/getRounds/:roundId',getRoundsController.getRoundById);

router.put('/tournaments/double/updateWinner/winners',tournamentWinnerUpdateController.updateWinnerForWinnersBracket);
router.get('/test',InfoController.testTour);


module.exports = router;

