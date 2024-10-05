import  { validationResult } from "express-validator";

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        //return  all validation errors
        return res.status(400).json({
            message: "Server could not create assignment because there are missing data from client",
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
}; 

export default handleValidationErrors;