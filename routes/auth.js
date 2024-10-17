import express from "express";
const router = express.Router();

import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , addDoc, getDoc, deleteDoc, query, where, setDoc, doc, getDocs, limit } from "firebase/firestore"
import 'firebase/firestore';
import bcrypt from "bcrypt";
import generateAuthToken from "../auth.js";
import _ from "lodash"
import {auth} from "../middleware/auth.js"

router.post('/validate', auth, (req, res) => {
    // If the request reaches here, it means the token is valid
    res.status(200).send({ message: 'Token is valid' });
  });

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists with the provided email
        const user = await getUserByEmail(email);

        // If user doesn't exist, return error
        if (!user) {
            return res.status(404).send('User not found');//change it to 400 later
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        // If passwords match, user is authenticated
        if (isPasswordValid) {
            // Generate authentication token or session for the authenticated user
            const authToken = generateAuthToken({id : user.id});

            // Return authentication token or session to the frontend
            return res.status(200).json({ authToken });
            
        } else {
            // If passwords don't match, return authentication error
            return res.status(401).send('Invalid password');
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).send('Internal server error');
    }
});

async function getUserByEmail(email) {
    try {
        // Query the database to find a user with the specified email
        const q = query(collection(db, "users"), where("email", "==", email), limit(1));
        const querySnapshot = await getDocs(q);

        // Initialize user variable
        let user = null;

        // Check if there are any documents in the query snapshot
        if (!querySnapshot.empty) {
            // Assuming only one user exists with the given email, access the first document
            const userData = querySnapshot.docs[0].data();
            // Assuming the user's document ID is needed, you can also get it with querySnapshot.docs[0].id
            user = { id: querySnapshot.docs[0].id, ...userData };
        }
        console.log(user)
        return user; // Return the user object if found, or null if not found
    } catch (error) {
        // Handle any errors that occur during the database query
        console.error('Error fetching user by email:', error);
        throw error; // Optionally re-throw the error to be handled elsewhere
    }
}

export {router}