import  { body } from "express-validator";

// Validation middleware for assignment creation
const validationAssignment = [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').notEmpty().withMessage('Category is required'),
];

export default  validationAssignment;