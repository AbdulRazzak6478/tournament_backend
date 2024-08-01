const count = 3;
const newId = `GBT${(count + 1).toString().padStart(6, '0')}`;
console.log('id : ',newId);
// GBT000004
// // PUT : to recover tournament from the archive section
// const { tournamentID } = req.params;
// /api/v2/admin/tournament/recoverTournament/:tournamentID