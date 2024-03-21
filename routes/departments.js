import express from "express";
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import { collection, getDocs } from "firebase/firestore";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const querySnapshot = await getDocs(collection(db, "Departments"));
        const departments = [];
        querySnapshot.forEach((document) => {
            departments.push({
                id: document.id,
                data: document.data()
            });
        });
        res.json(departments);
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ error: "Failed to fetch departments" });
    }
});

export { router };
