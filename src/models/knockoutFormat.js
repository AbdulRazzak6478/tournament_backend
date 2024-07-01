const mongoose = require("mongoose")

const knockoutSchema = new mongoose.Schema({

    tournamentID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "tournament"
    },
    formatType:{
        type: String,
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
    totalTeams:{
        type: Number,
    },
    totalParticipants:{
        type: Number,
    },
    roundNames:[{
        type: String,
    }],
    teams:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team"
    }],
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "player"
    }],
    players:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "player"
    }],
    rounds : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "round"
        }
    ]
},{timestamps:true})

module.exports = mongoose.model("knockout", knockoutSchema)