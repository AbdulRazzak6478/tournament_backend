const catchAsync = require("../../../../utils/catchAsync");



const tournamentDoubleFormatCreation = async ()=>{
    try{
        console.log('in the double creation section');
    }
    catch(error){
        console.log('Error in double knockout creation ',error?.message);
        throw new Error(', Error in double knockout tournament creation ',error?.message);
    }
}