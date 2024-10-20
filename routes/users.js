//next:step: make the name of profile picture of users unique

import express from "express";
const router = express.Router();

import Joi from 'joi';
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , addDoc, getDoc, deleteDoc, query, where, setDoc, doc, getDocs, limit, or } from "firebase/firestore"
import 'firebase/firestore';
import bcrypt from "bcrypt";
import generateAuthToken from "../auth.js";
import _ from "lodash"
import {auth} from "../middleware/auth.js"
import multer from 'multer';
import { storage } from "../firebase.js";
import { getDownloadURL, ref, uploadBytes }  from "firebase/storage"

// Endpoint handler for retrieving user profile
router.get('/:id', auth, async (req, res) => {
    try {
        const requestedUserId = req.params.id;
        const authenticatedUserId = req.user.id;

        // Retrieve user profile data from the database
        const user = await getUserById(requestedUserId);

        // Check if the requested user profile belongs to the authenticated user
        const isOwner = requestedUserId === authenticatedUserId;
        

        // Return different data based on the user's status
        if (isOwner) {
            // Return the full user profile including the password to the owner
            return res.json(user);
        } else {
            // Return only the public fields of the user profile to other users
            const publicProfile = _.pick(user, ['firstname', 'lastname', 'email', 'major', 'contactNumber', 'openToTutoring', 'coursesCompleted', 'image']);
            return res.json(publicProfile);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal server error');
    }
});

async function getUserById(id) {
    try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {id, ...docSnap.data()};
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error; // Optionally re-throw the error to be handled elsewhere
    }
}

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

//this is the api to create users.
router.post('/', upload.single('image'), async (req, res) => {

    console.log(req.body)
    console.log(req.file)

    let imageDownloadURL = '';

    if (req.file){
        const dateTime = Date.now();
        const imageRef = ref(storage, `profilePicture/${dateTime}`);
        const metadata = {
            contentType: req.file.mimetype
        }
        const snapshot = await uploadBytes(imageRef, req.file.buffer, metadata)
        imageDownloadURL = await getDownloadURL(snapshot.ref)
        console.log(imageDownloadURL);
    }



    const { firstname, lastname, email, password, major, contactNumber, openToTutoring} = req.body;

    const coursesCompleted = JSON.parse(req.body.coursesCompleted);
    console.log(coursesCompleted);

    const {error} = validateUser({ firstname, lastname, email, password, major, contactNumber, openToTutoring, coursesCompleted })
    if(error) return res.status(400).send(error.details[0].message);
    try {

        //check if user exists already
        const userExist = await checkEmailExists(email)

        if (userExist){
            return res.status(400).send("User Already Exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { firstname, lastname, email, password : hashedPassword, major, contactNumber, openToTutoring, coursesCompleted, image :imageDownloadURL }

        const userRef = await addUser(newUser);
        const userDoc = await getDoc(userRef);
        const user = { id: userDoc.id, ...userDoc.data() };

        res.send( _.pick(user , ['firstname', 'lastname', 'email', 'major', 'contactNumber', 'openToTutoring', 'coursesCompleted']));
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Internal server error');
    }
})

/*
// API endpoint to authenticate user credentials during login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists with the provided email
        const user = await getUserByEmail(email);

        // If user doesn't exist, return error
        if (!user) {
            return res.status(404).send('User not found');
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
*/


//for searching for users ** will be used for the chat **still needs working on cos firebase doen't have 
//searching queries ability as strong as mongodb
router.get('/',auth , async (req, res) => {
    try {
        let usersRef = collection(db, "users");

        // Extract the search keyword from the query parameters
        const keyword = req.query.search || '';

        // If a search keyword is provided, add filters to the query
        const q = query(usersRef, or(where("firstname", "==", keyword), where("lastname", "==", keyword) ,where("email", "==", keyword)));

        const querySnapshot = await getDocs(q);
        const matchingDocuments = [];

        if (querySnapshot.empty) {
            console.log("No matching documents.");
        } else {
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                matchingDocuments.push({ id: doc.id, data: doc.data() });
            });
        }
        
        // Send the matching documents as the response
        res.status(200).json(matchingDocuments);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//deleting a user
router.delete('/:id', async (req, res) => {
    //look up the user
    //not exist return 404

    const docRef = doc(db, "users", req.params.id);
    const docSnap = await getDoc(docRef);

    if(!docSnap.exists()) return res.status(404).send("Invalid ID")
    const deletedUser = await deleteDoc(doc(db, "users", req.params.id));
    //const deletedUser = await docRef.ref.delete();

    //return course
    res.send(deletedUser)

})


function validateUser(user) {
    const schema = Joi.object({
      firstname: Joi.string().required(),
      lastname: Joi.string().required(),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'edu'] } })
        .required(),
      password: Joi.string().required(),
      major: Joi.string(),
      contactNumber: Joi.string(),
      openToTutoring: Joi.boolean(),
      image: Joi.any(),
      coursesCompleted: Joi.array().items(Joi.string().required()),
    });
  
    return schema.validate(user);
  }

async function addUser(newUser) {
    //const newUserAdded = await db.collection("users").add(newUser);
    const newUserAdded = await addDoc(collection(db, "users"), newUser);
    //const newUserAdded = await db.collection("users").add(newUser);
    return newUserAdded;
}

async function checkEmailExists(email) {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty;
}

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


export {router, getUserById}


