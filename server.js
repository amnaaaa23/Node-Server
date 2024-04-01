require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").Server(app);
const PORT = process.env.PORT;
const session = require("express-session");
const socketIO = require("socket.io")(http, {
  cors: {
    origin:
      "https://employee-health-fe-git-dt-chat-amnas-projects-8c1cbb05.vercel.app/",
  },
});

let users = [];

// Use express-session for session management
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Socket.IO middleware to associate socket connection with user session
socketIO.use((socket, next) => {
  const sessionID = socket.handshake.sessionID;
  // Associate socket connection with session
  socket.sessionID = sessionID;
  next();
});

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.emit("me", socket.id);

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    socketIO.to(userToCall).emit("callUser", {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
    console.log("updateMyMedia");
    socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
  });

  socket.on("msgUser", ({ name, to, msg, sender }) => {
    socketIO.to(to).emit("msgRcv", { name, msg, sender });
  });

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    socketIO.to(data.to).emit("callAccepted", data);
  });
  socket.on("endCall", ({ id }) => {
    socketIO.to(id).emit("endCall");
  });

  socket.on("message", (data) => {
    socketIO.emit("messageResponse", data);
  });

  socket.on("typing", (data) => socket.broadcast.emit("typingResponse", data));

  socket.on("newUser", (data) => {
    users.push(data);
    socketIO.emit("newUserResponse", users);
  });

  socket.on("ice-candidate", (candidate) => {
    socket.broadcast.emit("ice-candidate", candidate); // Broadcast ICE candidate to other clients
  });
  // Event handler when a client initiates a call
  socket.on("call-made", (data) => {
    console.log("Call made by client: ", data);
    // Broadcast the call to all other clients
    socket.broadcast.emit("call-made", data);
  });

  // Event handler when a client sends an answer to accept a call
  socket.on("answer-made", (data) => {
    console.log("Answer made by client: ", data);
    // Broadcast the answer to all other clients
    socket.broadcast.emit("answer-made", data);
  });

  // Event handler when a client ends a call
  socket.on("call-ended", () => {
    console.log("Call ended by client: ", socket.id);
    // Broadcast the end of the call to all other clients
    socket.broadcast.emit("call-ended", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");

    const rooms = Object.keys(users);
    rooms.forEach((roomId) => {
      const index = users[roomId].indexOf(socket.id);
      if (index !== -1) {
        users[roomId].splice(index, 1);
        if (users[roomId].length === 0) {
          delete users[roomId];
        }
      }
    });

    socketIO.emit("newUserResponse", users);
    socket.disconnect();
  });
});
app.use(
  cors({
    origin:
      "https://employee-health-fe-git-dt-chat-amnas-projects-8c1cbb05.vercel.app/",
  })
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
