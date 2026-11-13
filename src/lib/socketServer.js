import { Server } from "socket.io";
import { connectToDatabase } from "./mongodb.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

let io = null;
const onlineUsers = new Map(); // socketId -> { userId, username, status, currentRoom, currentDesk, currentTask }
let activeTeamTimer = {
  running: false,
  title: "Team Sprint",
  duration: 25 * 60,
  remaining: 25 * 60,
  startedBy: "Team",
  startedAt: null,
};

export function initSocket(server) {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // 1. Join user private room
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId);
      }
    });

    // 2. Join Virtual Office Floor
    socket.on("office-enter", async (userData) => {
      if (!userData || !userData._id) return;
      onlineUsers.set(socket.id, {
        _id: userData._id,
        username: userData.username,
        status: userData.status || "Available",
        currentRoom: userData.currentRoom || "open-office",
        currentDesk: userData.currentDesk || null,
        currentTask: userData.currentTask || "Working remotely",
        avatarColor: userData.avatarColor || "blue",
      });

      // Join channel rooms
      socket.join("channel_open-office");
      socket.join("channel_watercooler");
      socket.join("channel_deep-focus");
      socket.join("channel_announcements");

      // Broadcast updated online presence
      io.emit("office-presence", Array.from(onlineUsers.values()));
      // Send current team timer state
      socket.emit("team-timer-state", activeTeamTimer);
    });

    // 3. User status / room / desk update
    socket.on("status-update", async (data) => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        Object.assign(user, data);
        onlineUsers.set(socket.id, user);
        io.emit("office-presence", Array.from(onlineUsers.values()));
      }

      // Update in DB asynchronously
      if (data.userId) {
        try {
          await connectToDatabase();
          await User.findByIdAndUpdate(data.userId, {
            status: data.status,
            currentRoom: data.currentRoom,
            currentDesk: data.currentDesk,
            currentTask: data.currentTask,
          });
        } catch (err) {
          console.error("DB status update error:", err.message);
        }
      }
    });

    // 4. Direct 1-on-1 private message
    socket.on("private-message", async ({ from, to, content, senderName }) => {
      try {
        await connectToDatabase();
        const message = new Message({
          senderId: from,
          receiverId: to,
          senderName: senderName || "Anonymous",
          content,
          type: "text",
          timestamp: new Date(),
        });
        await message.save();

        io.to(to).emit("private-message", {
          _id: message._id,
          from,
          to,
          senderName: message.senderName,
          content,
          type: "text",
          timestamp: message.timestamp,
        });
      } catch (err) {
        console.error("Message saving failed:", err);
      }
    });

    // 5. Office Channel message (#open-office, #watercooler, etc.)
    socket.on("channel-message", async ({ from, channel, content, senderName }) => {
      try {
        await connectToDatabase();
        const message = new Message({
          senderId: from,
          receiverId: channel,
          senderName: senderName || "Anonymous",
          content,
          channel,
          type: "text",
          timestamp: new Date(),
        });
        await message.save();

        io.to(channel).emit("channel-message", {
          _id: message._id,
          from,
          channel,
          senderName: message.senderName,
          content,
          type: "text",
          timestamp: message.timestamp,
        });
      } catch (err) {
        console.error("Channel message saving failed:", err);
      }
    });

    // 6. Interactive Office Actions (Wave, Send Coffee, Knock on Desk)
    socket.on("office-action", ({ fromUser, toUser, action, message }) => {
      if (toUser && toUser._id) {
        io.to(toUser._id).emit("office-action-received", {
          fromUser,
          action, // "wave" | "coffee" | "knock" | "highfive"
          message,
          timestamp: new Date(),
        });
      }
    });

    // 7. Team Co-Focus Synchronized Timer
    socket.on("team-timer-start", ({ title, duration, startedBy }) => {
      activeTeamTimer = {
        running: true,
        title: title || "Team Co-Focus Sprint",
        duration: duration || 25 * 60,
        remaining: duration || 25 * 60,
        startedBy: startedBy || "Team",
        startedAt: Date.now(),
      };
      io.emit("team-timer-state", activeTeamTimer);
    });

    socket.on("team-timer-pause", () => {
      activeTeamTimer.running = false;
      io.emit("team-timer-state", activeTeamTimer);
    });

    socket.on("team-timer-reset", () => {
      activeTeamTimer = {
        running: false,
        title: "Team Sprint",
        duration: 25 * 60,
        remaining: 25 * 60,
        startedBy: "Team",
        startedAt: null,
      };
      io.emit("team-timer-state", activeTeamTimer);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      io.emit("office-presence", Array.from(onlineUsers.values()));
    });
  });

  return io;
}

export function getIO() {
  return io;
}
