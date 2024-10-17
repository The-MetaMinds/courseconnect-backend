import express from "express";
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , doc,  addDoc, getDoc, deleteDoc, query, where, setDoc, getDocs, limit } from "firebase/firestore"
import {auth} from '../middleware/auth.js'
import { getUserById } from "./users.js";
import _ from "lodash";

const router = express.Router();

async function getLatestMessage(chatId) {
    
    try {
        const chatRef = doc(db, "Messages", chatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
            const latestMessage = chatSnap.data();
            const user = await getUserById(latestMessage.sender);
            const userProfile =  _.pick(user, ['firstname', 'image', 'email']);
            latestMessage.sender = userProfile
            return {...latestMessage}
        } else {
            throw new Error('Latest message not found');
        }
    } catch (error) {
        console.error('Error fetching latest message:', error);
        throw error; // Optionally re-throw the error to be handled elsewhere
    }
}

router.post('/', auth, async (req, res) => {
    const {userId }= req.body;
    const authenticatedUserId = req.user.id;


    console.log(req.body)

    if (!userId) {
        console.log("userId not sent with the params");
        return res.status(400).send("userId not sent with the params");
    }

    const chatsRef = collection(db, "Chat"); 

    const q = query(chatsRef, 
        where("isGroupChat", "==", false),
        where("users", "array-contains", userId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Chat exists, get the first document
        const chatDoc = querySnapshot.docs[0];
        const chatData = chatDoc.data();
        
        // Get user details for each user in the chat
        const usersPromises = chatData.users.map(userId => getUserById(userId));
        const users = await Promise.all(usersPromises);
    
        // Omit password field from each user
        const usersWithoutPassword = users.map(user => _.omit(user, ['password']));
    
        // Get the latest message for the chat
        let latestMessage = null;
        if (chatData.latestMessage) {
            latestMessage = await getLatestMessage(chatData.latestMessage);
        }
    
        // Combine chat data with user details and latest message
        const chatWithDetails = {
            ...chatData,
            users: usersWithoutPassword,
            latestMessage: latestMessage
        };
    
        res.send(chatWithDetails);
    } else {
        // Chat doesn't exist, create a new one
        const newChatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [authenticatedUserId, userId],
            groupAdmin: authenticatedUserId,
            latestMessage: ""
        };

        try {
            // Add a new document to the 'Chat' collection
            const newChatDocRef = await addDoc(chatsRef, newChatData);

            // Get user details for each user in the chat
            const usersPromises = newChatData.users.map(userId => getUserById(userId));
            const users = await Promise.all(usersPromises);
        
            // Omit password field from each user
            const usersWithoutPassword = users.map(user => _.omit(user, ['password']));

            const newChatDataWithUsers = {...newChatData, users: usersWithoutPassword}

            //Send the newly created chat data as response
            res.send({ ...newChatDataWithUsers, id: newChatDocRef.id });
        } catch (error) {
            console.error("Error creating new chat:", error);
            res.status(500).send("Internal Server Error");
        }
    }
});


router.get('/', auth, async (req, res) => {
    const authenticatedUserId = req.user.id;
    const chatsRef = collection(db, "Chat"); 

    const q = query(chatsRef, 
        where("users", "array-contains", authenticatedUserId)
    );

    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const chatsPromises = querySnapshot.docs.map(async chatDoc => {
                const chatData = chatDoc.data();
                
                // Get user details for each user in the chat
                const usersPromises = chatData.users.map(userId => getUserById(userId));
                const users = await Promise.all(usersPromises);
            
                // Omit password field from each user
                const usersWithoutPassword = users.map(user => _.omit(user, ['password']));
            
                // Get the group admin details
                const groupAdmin = await getUserById(chatData.groupAdmin);
                const groupAdminWithoutPassword = _.omit(groupAdmin, ['password']);

                // Get the latest message for the chat
                let latestMessage = null;
                if (chatData.latestMessage) {
                    latestMessage = await getLatestMessage(chatData.latestMessage);
                }
            
                // Combine chat data with user details, group admin, and latest message
                return {
                    ...chatData,
                    id: chatDoc.id,
                    users: usersWithoutPassword,
                    groupAdmin: groupAdminWithoutPassword,
                    latestMessage: latestMessage
                };
            });

            const chats = await Promise.all(chatsPromises);
            res.send(chats);
        } else {
            res.send([]); // Send an empty array if no chats found
        }
    } catch (error) {
        console.error("Error retrieving chats:", error);
        res.status(500).send("Internal Server Error");
    }
});

export { router }