const mongoose = require("mongoose")

const roundSchema = new mongoose.Schema({

    tournamentID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "tournament"
    },
    formatTypeID:{
        type:mongoose.Schema.Types.ObjectId,
        default : null,
    },
    formatName : {
        type : String,
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
    brackets : {
        type : String,
        default : 'winners',
    },
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        default : null,
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