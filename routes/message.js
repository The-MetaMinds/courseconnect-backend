import express from "express";
import { db } from "../firebase.js"; // Assuming your Firebase module file is named firebase.mjs
import {collection , doc,  addDoc, getDoc, deleteDoc, query, where, setDoc, getDocs, limit, updateDoc, orderBy, serverTimestamp } from "firebase/firestore"
import {auth} from '../middleware/auth.js'
import { getUserById } from "./users.js";
import _ from "lodash";

const router = express.Router()


// Endpoint to post new message
router.post('/', auth, async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.status(400).send("Invalid data passed into request");
    }

    try {
        // Fetch sender details
        //const senderDetails = await getUserById(req.user.id);

        // Construct new message object
        const newMessageData = {
            sender: req.user.id, // Store sender ID only
            content: content,
            chat: chatId,
            timestamp: serverTimestamp() 
        };

        // Add new message to Messages collection
        const messagesRef = collection(db, "Messages");
        const newMessageDocRef = await addDoc(messagesRef, newMessageData);

        // Update latestMessage in chat
        await updateDoc(doc(db, "Chat", chatId), { latestMessage: newMessageDocRef.id });

        // Populate sender and chat details
        const sender = await getUserById(req.user.id);
        const chat = await getChatDetails(chatId);

        // Populate users field in the chat
        const usersPromises = chat.users.map(userId => getUserById(userId));
        const users = await Promise.all(usersPromises);

        // Omit password field from each user
        const usersWithoutPassword = users.map(user => ({
            firstname: user.firstname,
            lastname: user.lastname,
            image: user.image,
            email: user.email
        }));

        // Construct response object
        const responseData = {
            sender: {
                firstname: sender.firstname,
                lastname: sender.lastname,
                image: sender.image,
                email: sender.email
            },
            content: content,
            chat: {
                ...chat,
                users: usersWithoutPassword
            }
        };

        res.status(201).json(responseData);
     } catch (error) {
        console.error("Error posting new message:", error);
        res.status(400).send("Internal Server Error");
        throw new Error(error.message)
    }
});

// Function to fetch chat details
const getChatDetails = async (chatId) => {
    try {
        const chatDoc = await getDoc(doc(db, "Chat", chatId));
        if (chatDoc.exists()) {
            return chatDoc.data();
        } else {
            throw new Error(`Chat with ID ${chatId} not found`);
        }
    } catch (error) {
        throw error;
    }
};

//to get all messages in a chat
// router.get('/:chatId', auth, async (req, res) => {
//     const chatId = req.params.chatId

//     try{
//         const q = query(collection(db, "Messages"), where("chat", "==", chatId));
//         const querySnapshot = await getDocs(q);

//         if(!querySnapshot.empty){
//             const messagesPromises = querySnapshot.docs.map(doc => doc.data())
//             const messages = await Promise.all(messagesPromises);
//             return res.send(messages)
//         }

        
//     }
//     catch(error){
//         console.log(error)
//         return res.status(400).send(`Internal Server Error: ${error.message}`)
//     }
// })

router.get('/:chatId', auth, async (req, res) => {
    const chatId = req.params.chatId;

    try {
        // Fetch messages for the specified chat
        const q = query(collection(db, "Messages"), where("chat", "==", chatId), orderBy("timestamp"));
        // orderBy("timestamp", "asc")
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Populate sender and chat details for each message
            const messages = [];
            for (const doc of querySnapshot.docs) {
                const messageData = doc.data();
                const sender = await getUserById(messageData.sender);
                const chat = await getChatDetails(messageData.chat);

                // Populate sender and chat fields in message
                const message = {
                    sender: {
                        id: messageData.sender,
                        firstname: sender.firstname,
                        lastname: sender.lastname,
                        email: sender.email,
                        image: sender.image
                    },
                    content: messageData.content,
                    chat: {
                        ...chat
                    }
                };
                messages.push(message);
            }

            res.status(200).json(messages);
        } else {
            res.status(404).send("No messages found for the specified chat");
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal Server Error");
        throw new Error(error.message)
    }
});

export { router }