const mongoose = require("mongoose")

const tournamentIdSchema = new mongoose.Schema({

    tournamentID:{
        type: String,
        required: true
    },

},{timestamps:true})

module.exports = mongoose.model("tournamentId", tournamentIdSchema)