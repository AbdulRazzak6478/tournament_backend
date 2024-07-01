const {StatusCodes} = require('http-status-codes');
const AppError = require('../utils/errors/app-error');
const teamModel = require('../models/team')
const { SuccessResponse, ErrorResponse} = require('../utils/common/index')


const createTeam = async(req,res)=>{
    try {
        const users = req.body.users.split(',');
        const data = {
            teamName : req.body.name,
            sportName : req.body.sport,
            players : users,
            teamNumber : req.body.teamNumber
        }
        let user = await teamModel.create(data);
        SuccessResponse.data = user;
        return res.status(201).json(SuccessResponse);
    } catch (error) {
        console.log('error in createTeam controller');
        ErrorResponse.error = AppError("error in creating createTeam",500)
        return res.status(500).json(ErrorResponse);
    }
}

module.exports = {
    createTeam
}