

// tournamentSchema [icon: user, color: gray] {
//     id ObjectId() 
//     tournamentID string
//     name  string
//     mainCategoryID  ObjectId()
//     mainCategoryName  
//     subCategoryID  ObjectId()
//     subCategoryName string
//     sportName string
//     typeFormat  string
//     formatID ObjectId()
//     fixingType string
//     tournamentType string
//     rounds integer
//     roundsNames names[]
//     discription string
//     teams Teams[{ObjectId()}]
//     participents players[{ObjectId()}]
//     players player[{ObjectId()}]
//     venues  venueArray[ObjectId()]
//   }
//   knockoutFormat [icon: user, color: gray] {
//     id ObjectId() 
//     tournamentId ObjectId()
//     typeFormat  string
//     fixingType string
//     gameType string
//     rounds integer
//     roundsNames names[]
//     roundsArr  Rounds[{ ObjectId()}]
//     teams Teams[{ObjectId()}]
//     participents players[{ObjectId()}]
//     players players[{ObjectId()}]
//   }
  
//   teamsSchema [icon: users, color: gray] {
//     id ObjectId() 
//     teamName string
//     sportName ObjectId()
//     members players[ObjectId()]
//     players Players[ObjectId()]
//     tournamentId ObjectId()
//   }
//   participentSchema [icon: users, color: gray] {
//     id ObjectId() 
//     Name string
//     email string
//     phone string
//     userMongoId ObjectId()
//     members players[ObjectId()]
//     players Players[ObjectId()]
//     tournamentId ObjectId()
//   }
//   venueSchema [icon: users, color: gray] {
//     id ObjectId() 
//     tournamentId ObjectId()
//     venueName string
//     ClubID ObjectId()
//     location string
//     arenaName string
//     courts Number
    
//   //   arenaID ObjectId()
//   }
//   MatchSchema [icon: users, color: gray] {
//     id ObjectId() 
//     name string
//     roundId ObjectId()
//     formatId ObjectId()
//     teamA  Team_Id ObjectId()
//     teamB Team_Id ObjectId()
//     scoreA Number
//     scoreB Number
//     winner Team_Id ObjectId()
//     venueID  Venue_ID ObjrctId()
//     dateOfPlay Date()
//     timing Date()
//   }
  
//   roundsSchema [icon: user, color: gray] {
//     id string 
//     tournamentId ObjectId()
//     typeFormat  ObjectId()
//     fixingType string
//     gameType string
//     roundNumber integer
//     roundName  string
//     teams  Teams[ObjectId()]
//     matches  Matche[{ObjectId()}]
//     winnerTeams Teams[{ObjectId()}]
//     isCompleted Boolean
//   }
//   userSettings [icon: gear, color: gray] {
//     theme string
//     show_hints boolean
//   }
//   tournamentSchema.formatID  > knockoutFormat
//   tournamentSchema.teams  > teamsSchema
//   tournamentSchema.players  > participentSchema
//   tournamentSchema.participents  > participentSchema
//   // tournamentSchema.formatId  > knockoutFormat
//   tournamentSchema.venues  > venueSchema
//   knockoutFormat.teams > teamsSchema
//   knockoutFormat.roundsArr > roundsSchema
//   roundsSchema.matches > MatchSchema
//   roundsSchema.winnerTeams > teamsSchema
//   teamsSchema.players > participentSchema
//   MatchSchema.teamA > teamsSchema
//   // MatchSchema.roundId > roundsSchema
//   // MatchSchema.formatId > knockoutFormat
//   MatchSchema.teamB > teamsSchema
//   MatchSchema.winner > teamsSchema
//   MatchSchema.venueID > venueSchema
//   // users.app_settings > userSettings
// npm i @aws-sdk/client-secrets-manager