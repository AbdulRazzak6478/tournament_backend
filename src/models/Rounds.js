const mongoose = require("mongoose")

const roundSchema = new mongoose.Schema({

    tournamentID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "tournament"
    },
    formatTypeID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "knockoutFormat"
    },
    fixingType:{
        type: String,
    },
    gameType: {
        type: String,
        enum: ["team", "individual"],
        default: "team"
    },
    roundNumber:{
        type: Number,
    },
    roundName:{
        type: String,
    },
    teams:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team"
    }],
    matches:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "match"
    }],
    winners:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team"
    }],
    isCompleted : {
        type : Boolean,
        default : false
    }
},{timestamps:true})

module.exports = mongoose.model("round", roundSchema)