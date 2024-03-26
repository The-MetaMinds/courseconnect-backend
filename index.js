import express from 'express';
import cors from 'cors';
const app = express();

import {router as learning} from './routes/learning.js'
import {router as users} from './routes/users.js'
import {router as departments} from './routes/departments.js'
import {router as courses} from './routes/courses.js'

app.use(cors())
app.use(express.json()); //middleware
app.use("/api/courses/", learning)
app.use("/api/users", users)
app.use("/api/departments", departments)



const port = process.env.PORT || 3000 //this is to set the port number dynamically 
app.listen(port, () => console.log(`listening on port ${port}`));


