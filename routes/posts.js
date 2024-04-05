import express from "express";
const router = express.Router();

import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , addDoc, getDoc, deleteDoc, query, where, setDoc, doc, getDocs, limit } from "firebase/firestore"
import 'firebase/firestore';
/*
router.get('/:id', async (req, res) => {

    const courseId = req.params.id 

    const q = query(collection(db, "Posts"), where("courseId", "==", courseId));
    const querySnapshot = await getDocs(q)
    if (!querySnapshot .empty) {
        return res.send(querySnapshot.docs);
    } else {
        // querySnapshot .data() will be undefined in this case
        return res.status(404).send("No Posts yet")
    }
})
*/

router.get('/:id', async (req, res) => {
    try {
        const courseId = req.params.id;

        const q = query(collection(db, "Posts"), where("courseId", "==", courseId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Extract data from each document and form an array of post objects
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return res.json(posts);
        } else {
            return res.status(404).json({ error: "No Posts yet" });
        }
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({ error: "Failed to fetch posts" });
    }
});




//this is the api to add posts
router.post('/', async (req, res) => {

    const { title, content, username, timestamp, course } = req.body;

    try {

        const newPost = { title, content, timestamp, userId : username, courseId : course}

        const postRef = await addPost(newPost);
        const postDoc = await getDoc(postRef);
        const post = { id: postDoc.id, ...postDoc.data() };
        res.send(post);
    } catch (error) {
        console.error('Error adding post:', error);
        res.status(500).send('Internal server error');
    }
})


async function addPost(newPost) {
    
    const newPostAdded = await addDoc(collection(db, "Posts"), newPost);
    return newPostAdded;
}

export {router}