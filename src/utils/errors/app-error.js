class AppError extends Error {
    constructor(message, statusCode)
    {
       super(message);
       this.statusCode = statusCode;
       this.explanation = message;
    }
} 

module.exports = AppError;
// EOD Report 5/06/2024

// 1. Got the access of gamebeez
// 2. Project environment setup
// 3. Few extentions added and setup in environment
// 4. created booking api to fetch and conclude both offline and online bookings
// 5. booking api reviewed and resolved the issues
// 6. started working on staff api