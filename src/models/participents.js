const mongoose = require("mongoose")

const playerSchema = new mongoose.Schema({

    name:{
        type: String,
    },
    email: {
        type: String,
    },
    phone:{
        type: String,
    },
    // status: {
    //     type: String,
    //     enum: ["active", "suspended"],
    //     default: "active"
    // },
    userMongoID:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    team:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "team"
    }
]


},{timestamps:true})

module.exports = mongoose.model("player", playerSchema)