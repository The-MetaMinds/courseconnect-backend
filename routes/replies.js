import express from "express";
const router = express.Router();

import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , addDoc, getDoc, deleteDoc, query, where, setDoc, doc, getDocs, limit } from "firebase/firestore"
import 'firebase/firestore';
import {auth} from '../middleware/auth.js'
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

/* I was return 404 for no replies, making it really complicated
router.get('/:id', auth, async (req, res) => {
    try {
        const postId = req.params.id;

        const q = query(collection(db, "Replies"), where("postId", "==", postId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Extract data from each document and form an array of post objects
            const replies = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return res.json(replies);
        } else {
            return res.status(404).json({ error: "No replies yet" });
        }
    } catch (error) {
        console.error("Error fetching repslies:", error);
        return res.status(500).json({ error: "Failed to fetch replies" });
    }
});

*/
router.get('/:id', auth, async (req, res) => {
    try {
        const postId = req.params.id;

        const q = query(collection(db, "Replies"), where("postId", "==", postId));
        const querySnapshot = await getDocs(q);

        // Extract data from each document and form an array of post objects
        const replies = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.json(replies);
    } catch (error) {
        console.error("Error fetching replies:", error);
        return res.status(500).json({ error: "Failed to fetch replies" });
    }
});



//this is the api to add posts
router.post('/', auth, async (req, res) => {

    const { content, userId, timestamp, postId } = req.body;

    try {

        const newReply = { content, timestamp, userId : userId, postId: postId}

        const replyRef = await addReply(newReply);
        const replyDoc = await getDoc(replyRef);
        const reply = { id: replyDoc.id, ...replyDoc.data() };
        res.send(reply);
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).send('Internal server error');
    }
})


async function addReply(newReply) {
    
    const newReplyAdded = await addDoc(collection(db, "Replies"), newReply);
    return newReplyAdded;
}

export {router}