import jwt from 'jsonwebtoken';
import 'dotenv/config'

function auth(req, res, next) {

    const secretKey = process.env.json_secretKey; //get the secret key
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send("Access Denied. No token Provided")

    try{
        const decoded = jwt.verify(token, secretKey) //get the json decoded payload
        req.user = decoded;
        next()
    }
    catch(ex){
        res.status(400).send("Invalid Token")
    }
    
}

export {auth}