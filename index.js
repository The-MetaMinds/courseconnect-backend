import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import {router as users} from './routes/users.js'
import {router as departments} from './routes/departments.js'
import {router as courses} from './routes/courses.js'
import {router as posts } from './routes/posts.js'
import {router as auth} from './routes/auth.js'
import {router as replies} from './routes/replies.js'
import {router as chats} from './routes/chats.js'
import {router as messages} from './routes/message.js'

const app = express();

app.use(cors())
app.use(express.json()); //middleware
app.use("/api/courses", courses)
app.use("/api/users", users)
app.use("/api/departments", departments)
app.use("/api/posts", posts)
app.use("/api/auth", auth)
app.use("/api/replies", replies)
app.use("/api/chats", chats)
app.use("/api/messages", messages)

const port = process.env.PORT || 3000; // Set the port number dynamically
const server = createServer(app);
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: true    }
});

// io.on('connection', (socket) => {
//     console.log('connected to socket.io');

//     socket.on("setup", (userData) => {
//         socket.join(userData.id);
//         socket.emit("connected");
//     })

//     socket.on("join chat", (room)=> {
//         socket.join(room);
//         console.log("User joined room "+ room);
//     })

//     socket.on('new message', (newMessageRecieved)=> {
//         console.log("message eas recieved")
//         var chat = newMessageRecieved.chat;

//         if (!chat.users) return console.log("chat.users not defined");

//         chat.users.forEach((user) => {
//             if (user.id == newMessageRecieved.sender.id) return;

//             console.log("message sent to "+ user.email)

//             socket.to(user.id).emit("message recieved", newMessageRecieved);
//             console.log("message sent to "+ user.email)
//         });
//     })
// });

io.on('connection', (socket) => {
    console.log('connected to socket.io');

    // Join a room based on the user ID
    socket.on("setup", (userData) => {
        socket.join(userData.id);  // This could be for personal notifications, if needed
        socket.emit("connected");
    });



    // Join a room based on the chat room ID
    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User joined room " + room);
    });

    // Handle sending a new message to a room
    socket.on('new message', (newMessageRecieved) => {
        console.log("message was received", newMessageRecieved);
        var chat = newMessageRecieved.chat;


        if (!chat.users) return console.log("chat.users not defined");

        // Send message to the chat room, not individual users
        socket.to(newMessageRecieved.chatId).emit("message recieved", newMessageRecieved);
        console.log("message sent to room " + newMessageRecieved.chatId);
    });
});


server.listen(port, () => console.log(`listening on port ${port}`));

