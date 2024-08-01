const {StatusCodes} = require('http-status-codes');
const AppError = require('../utils/errors/app-error');
const playerModel = require('../models/participents')
const { SuccessResponse, ErrorResponse} = require('../utils/common/index')


const createPlayer = async(req,res)=>{
    try {
        const data = {
            name : req.body.name,
            email : req.body.email
        }
        let user = await playerModel.create(data);
        SuccessResponse.data = user;
        return res.status(201).json(SuccessResponse);
    } catch (error) {
        console.log('error in player controller');
        ErrorResponse.error = AppError("error in creating player",500)
        return res.status(500).json(ErrorResponse);
    }
}

module.exports = {
    createPlayer
}