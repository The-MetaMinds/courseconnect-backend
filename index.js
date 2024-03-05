import express from 'express';
const app = express();

import {router as learning} from './routes/learning.js'
import {router as users} from './routes/users.js'

app.use(express.json()); //middleware
app.use("/api/courses/", learning)
app.use("/api/users", users)



const port = process.env.PORT || 3000 //this is to set the port number dynamically 
app.listen(port, () => console.log(`listening on port ${port}`));


