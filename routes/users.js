import express from "express";
const router = express.Router();

import Joi from 'joi';
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , addDoc, getDoc, deleteDoc, query, where, setDoc, doc, getDocs } from "firebase/firestore"
import 'firebase/firestore';
import bcrypt from "bcrypt";

router.get('/:id', async (req, res) => {
    
    const docRef = doc(db, "users", req.params.id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return res.send(docSnap.data());
    } else {
        // docSnap.data() will be undefined in this case
        return res.status(404).send("Invalid ID")
    }
})



//this is the api to create users.
router.post('/', async (req, res) => {

    const { firstname, lastname, email, password } = req.body;

    const {error} = validateUser({ firstname, lastname, email, password })
    if(error) return res.status(400).send(error.details[0].message);
    try {

        //check if user exists already
        const userExist = await checkEmailExists(email)

        if (userExist){
            return res.status(400).send("User Already Exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { firstname, lastname, email, password }

        const userRef = await addUser(newUser);
        const userDoc = await getDoc(userRef);
        const user = { id: userDoc.id, ...userDoc.data() };
        res.send(user);
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Internal server error');
    }
})

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

function validateUser(user){
    const schema = Joi.object({
        firstname : Joi.string().required(),
        lastname: Joi.string().required(),
        email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password : Joi.string().required()
    })

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
    console.log(querySnapshot)
    return !querySnapshot.empty;
}

export {router}