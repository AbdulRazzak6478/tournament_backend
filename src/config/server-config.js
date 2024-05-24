const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT : process.env.PORT,
    UR_INDENTIFIER : process.env.UR_INDENTIFIER,
}