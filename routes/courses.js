import express from "express";
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import { doc, getDoc } from "firebase/firestore";

const router = express.Router();

router.get('/:id', async (req, res) => {
    const courseId = req.params.id;

    try {
        const docRef = doc(db, "Classes", courseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return res.json(docSnap.data());
        } else {
            throw new Error('Course not found');
        }
    } catch (error) {
        console.error('Error fetching course by ID:', error);
        throw error; // Optionally re-throw the error to be handled elsewhere
    }
});


export { router };
