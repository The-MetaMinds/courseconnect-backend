import express from "express";
const router = express.Router();

import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , addDoc, getDoc, deleteDoc, query, where, setDoc, doc, getDocs, limit } from "firebase/firestore"
import 'firebase/firestore';
import {auth} from '../middleware/auth.js'
import { getUserById } from "./users.js";



router.get('/:id', auth, async (req, res) => {
    try {
        const courseId = req.params.id;

        const q = query(collection(db, "Posts"), where("courseId", "==", courseId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Extract data from each document and form an array of post objects
            const postsPromises = querySnapshot.docs.map(async doc => {
                let userData = null;

                try {
                    userData = await getUserById(doc.data().userId);
                    console.log(userData)
                } catch (error) {
                    if (error.message === "User not found") {
                        userData = null;
                    } else {
                        throw error; // Re-throw other errors
                    }
                }

                // Check if user data exists
                const userName = userData ? `${userData.firstname} ${userData.lastname}` : 'Unknown User'; 

                return {
                    id: doc.id,
                    ...doc.data(),
                    username: userName // Add the user name to the post object
                };
            });

            const posts = await Promise.all(postsPromises);

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
router.post('/', auth, async (req, res) => {

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