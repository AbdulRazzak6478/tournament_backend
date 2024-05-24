const mongoose = require('mongoose');
const {UR_INDENTIFIER} = require('./server-config')

async function DBconnect(){
    try {
        console.log('Connecting to Mongo DB , Please wait .....');
        const result = await mongoose.connect(UR_INDENTIFIER)
        console.log('Mongo DB connected');
    } catch (error) {
        console.log('error in connecting to database ,Please check the connection ...');
    }
}


module.exports = {
    DBconnect,
} 