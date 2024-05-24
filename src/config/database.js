const mongoose = require('mongoose');
const {UR_INDENTIFIER} = require('./server-config')

// async function DBconnect(){
//     try {
//         console.log('Connecting to Mongo DB , Please wait .....');
//         const result = await mongoose.connect(UR_INDENTIFIER)
//         console.log('Mongo DB connected',UR_INDENTIFIER);
//     } catch (error) {
//         console.log('error in connecting to database ,Please check the connection ...');
//     }
// }
async function DBconnect(){
    try {
        console.log('Connecting to Mongo DB , Please wait .....');

        // console.log('db uri : ',UR_INDENTIFIER);
        const result = await mongoose.connect(UR_INDENTIFIER);
        // console.log('db connected : ',result);
        console.log('connected');
        const connection = mongoose.connection;
        connection.on('connected',()=>{
            console.log('MongoDB connected');
        });
        connection.on('error',(err)=>{
            console.log('MongoDB connection error, Please make sure DB is up and running'+err);
            process.exit();
        });
    } catch (error) {
        console.log('error in connecting to database ,Please check the connection ...'+error);
    }
}


module.exports = {
    DBconnect,
} 