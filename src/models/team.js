const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({

    name:{
        type: String,
    },
    sportName: {
        type: String,
    },
    teamNumber: {
        type: Number,
    },
    // status: {
    //     type: String,
    //     enum: ["active", "suspended"],
    //     default: "active"
    // },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "player"
    }],
    players:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "player"
    }],
    tournamentID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "tournament"
    }



},{timestamps:true})

module.exports = mongoose.model("team", teamSchema)