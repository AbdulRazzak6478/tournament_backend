const mongoose = require("mongoose")

const matchSchema = new mongoose.Schema({

    name:{
        type: String,
    },
    tournamentID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "tournament"
    },
    roundID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "round"
    },
    formatID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "tournamentFormat"
    },
    teamA:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team",
        default : null
    },
    teamB:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team",
        default : null
    },
    matchA:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "match",
        default : null
    },
    matchB:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "match",
        default : null
    },
    scoreA: {
        type: String,
        default : 0
    },
    scoreB: {
        type: String,
        default : 0
    },
    // status: {
    //     type: String,
    //     enum: ["active", "suspended"],
    //     default: "active"
    // },
    winner:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team",
        default : null,
    },
    nextMatch:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team",
        default : null
    },
},{timestamps:true})

module.exports = mongoose.model("match", matchSchema)