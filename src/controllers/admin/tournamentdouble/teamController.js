const {StatusCodes} = require('http-status-codes');
const AppError = require('../utils/errors/app-error');
const teamModel = require('../models/team')
const { SuccessResponse, ErrorResponse} = require('../utils/common/index');
const { default: mongoose } = require('mongoose');



const createTeam = async(req,res)=>{
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const users = req.body.users.split(',');
        const data = {
            teamName : req.body.name,
            sportName : req.body.sport,
            players : users,
            teamNumber : req.body.teamNumber
        }
        let team = await teamModel.create([data],{session : session});
        // let team = new teamModel(data);
        team[0].sportName = 'football';
        team[0].teamName = 'INDIA';
        let newTeam = await team[0].save();
        // let newTeam = await team[0].save();
        console.log('new team : ',newTeam);
        team[0].sportName = 'hockey';
        newTeam = await team[0].save();
        console.log('new team sportName updated : ',newTeam)
        // try{

            let findTeam = await teamModel.findOne({_id : team[0]?._id }).session(session);
            console.log('findTeam : ',findTeam);
            if(findTeam){
                throw new Error('error in team creation in finding');
            }
        // }
        // catch(error){

        // }
        // if(team[0]){
        //     throw new Error('error in team creation');
        // }
        SuccessResponse.data = team;
        await session.commitTransaction();
        await session.endSession();
        return res.status(201).json(SuccessResponse);
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        console.log('error in createTeam controller : '+error?.message);
        ErrorResponse.error = new AppError("error in creating createTeam : "+error?.message,500)
        return res.status(500).json(ErrorResponse);
    }
}

module.exports = {
    createTeam
}