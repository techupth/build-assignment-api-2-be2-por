import express, { json } from 'express';
import connectionPool from './utils/lms_db.mjs';
import 'dotenv/config';
import validationAssignment from './middleware/createValidation.mjs';
import handleValidationErrors from './middleware/errorHandling.mjs';

const app = express();
const port = process.env.PORT;

app.use(express.json()); //middleware to help handling JSON data -- JSON parsing

app.post('/assignments', validationAssignment, handleValidationErrors, async (req, res) => {
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
})

app.get('/assignments', async (req, res) => {
    try {
        const result = await connectionPool.query(`SELECT * FROM assignments`);
        return res.status(200).json({
            data: result.rows,
        });
    } catch (error) {
        return res.status(500).json({
             message: "Server could not find a requested assignment",
             error: error.message
        });
    }
})

app.get('/assignments/:assignmentId', async (req, res) => {
    const assignmentIdFromClient = req.params.assignmentId;

    try{

        const result = await connectionPool.query('SELECT * FROM assignments WHERE assignment_id = $1', [assignmentIdFromClient]);

    if(!result.rows[0]) {
        return res.status(404).json({
            message: "Server could not find a requested assignment"
        });
    }
    } catch (error) {
        res.status(500).json({
            message: "Server could not read assignment because database connection",
            error: error.message
        });
    }

    return res.status(200).json({
        data: result.rows[0],
    });
    
})

app.put('/assignments/:assignmentId', async (req, res) => {
    const assignmentIdFromClient = req.params.assignmentId;
    const { title, content, category, length, status } = req.body;

    try {
        const result = await connectionPool.query(
            `
                UPDATE assignments
                SET
                    title = $1,
                    content = $2,
                    category = $3,
                    length = $4,
                    status = $5,
                    updated_at = NOW()
                WHERE 
                    assignment_id = $6;
            `, [title, content, category, length, status, assignmentIdFromClient]);
        
        if(result.rowCount === 0) {
            return res.status(404).json({
                message: "Server could not find a requested assignment",
                error: error.message
            });
        }

    } catch (error) {
        return res.status(500).json({
            message: "Server could not update assignment because database connection",
            error: error.message
        });
    }

    return res.status(200).json({
        message: "Updated assignment sucessfully"
    });

})

app.delete('/assignments/:assignmentId', async (req, res) => {
    const assignmentIdFromClient = req.params.assignmentId;

    try {
        const result = connectionPool.query(
            `
                DELETE FROM assignments WHERE assignment_id = $1
            `, [assignmentIdFromClient]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Server could not find a requested assignment to delete"
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Server could not delete assignment because database connection",
            error: error.message
        });
    }

    return res.status(200).json({
        message: "Deleted assignment sucessfully"
    });
})

// catch-all for route not found
app.all('*', (req, res) => {
    return res.status(404).json({
        message: "Route not found"
    });
})


app.listen(port, ()=> {
    console.log(`Server running at port: ${port}`);
})

