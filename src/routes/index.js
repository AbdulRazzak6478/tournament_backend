const express = require('express');
const { InfoController , playerController, teamController, tournamentController} = require('../controllers');
const router = express.Router();

router.get('/info',InfoController.info);
router.post('/users',playerController.createPlayer);
router.post('/teams',teamController.createTeam);
router.post('/tournaments',tournamentController.createTournament);
router.get('/test',InfoController.testTour);


module.exports = router;

