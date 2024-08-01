const { failed_response } = require("./response");

const catchAsync = (fn)=>{
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((error)=>{
            const message = 'Internal Server Error 500';
            return res.status(500).json(failed_response(500,message,{message : error?.message || message},false));
        });
    }
}

module.exports = catchAsync;