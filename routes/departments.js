import express from "express";
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

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

router.get('/:id/classes', async (req, res) => {
    try {
        // Fetch the department document

        const docRef = doc(db, "Departments", req.params.id);
        const docSnap = await getDoc(docRef);

        // Check if department document exists
        if (docSnap.exists()) {
            const departmentData = docSnap.data();


            // Check if the department data contains classID field
            if (departmentData.classId && Array.isArray(departmentData.classId)) {
                // Fetch class documents using classID list
                const classPromises = departmentData.classId.map(async (classId) => {
                    const classDocRef = doc(db, "Classes", classId);
                    const classDocSnap = await getDoc(classDocRef);
                    if (classDocSnap.exists()) {
                        const classData = classDocSnap.data();
                        // Return an object containing both name and id
                        return { id: classId, name: classData.name };
                    } else {
                        return null;
                    }
                });

                // Wait for all class document fetches to complete
                const classDocs = await Promise.all(classPromises);

                // Filter out null values (non-existing class documents)
                const classes = classDocs.filter(Boolean);

                // Return the list of classes
                return res.json(classes);
            } else {
                return res.status(404).json({ error: "No classes found for this department" });
            }
        } else {
            return res.status(404).json({ error: "Department not found" });
        }
    } catch (error) {
        console.error("Error fetching classes:", error);
        return res.status(500).json({ error: "Failed to fetch classes" });
    }
});

export { router };
