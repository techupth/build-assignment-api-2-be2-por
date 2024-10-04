import express from "express";
import connectionPool from "./utils/lms_db.mjs";
import 'dotenv/config';
import  { body, validationResult } from "express-validator";

const app = express();
const port = process.env.PORT;

app.use(express.json()); //middleware to help handling JSON data -- JSON parsing

// Validation middleware for assignment creation
const validationAssignment = [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').notEmpty().withMessage('Category is required'),
];

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

app.post("/assignments", validationAssignment, handleValidationErrors, async (req, res) => {
    //access data
    const { title, content, category, length, user_id, status } = req.body;
    const assignmentStatus = status || 'draft';

    const newAssignment = {
        // missing length (can be NULL), user_id (FK database will handle), status (set default value in API)
        ...req.body,
        length: length || null,
        user_id,
        status: assignmentStatus,
        created_at: new Date(), //Already handle by database "created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP" but will just specify here
        updated_at: new Date(),
        published_at: assignmentStatus === 'published' ? new Date() : null,
    };

    // about timestamp can let database handle to reduce mismatch data between server and database time
    // more clear code but we will do it this way

    //connect database and query
    try {
        await connectionPool.query(
            `INSERT INTO assignments (title, content, category, length, user_id, status, created_at, updated_at, published_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             `,
             [
                 newAssignment.title,
                 newAssignment.content,
                 newAssignment.category,
                 newAssignment.length,
                 newAssignment.user_id,
                 newAssignment.status,
                 newAssignment.created_at,
                 newAssignment.updated_at,
                 newAssignment.published_at
             ]);
        } catch (error) {
            return res.status(500).json({
                message: "Server could not create assignment because database connection error",
                error: error.message
            });
        }    
    //return response
    return res.status(201).json({
        message: "Created assignment sucessfully"
    });
});



app.listen(port, ()=> {
    console.log(`Server running at port: ${port}`);
});

