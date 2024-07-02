const mongoose = require("mongoose")

const tournamentSchema = new mongoose.Schema({

    tournamentID:{
        type: String,
    },
    formatId:{
        type: mongoose.Schema.Types.ObjectId,
        default : null,
    },
    formatName:{
        type: String,
        enum: ["knockout", "double knockout","round robin"],
    },
    fixingType:{
        type: String,
    },
    gameType: {
        type: String,
        enum: ["team", "individual"],
        default: "individual"
    },
    totalRounds:{
        type: Number,
    },
    roundNames:[{
        type: String,
    }],
    totalTeams : {
        type: Number,
    },
    totalParticipants : {
        type: Number,
    },
    teams:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team",
        default : null
    }],
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "player",
        default : null,
    }],
    players:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "player",
        default : null,
    }],
},{timestamps:true})

module.exports = mongoose.model("tournament", tournamentSchema)