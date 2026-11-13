import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  senderName: { type: String, default: "Anonymous" },
  content: { type: String, required: true },
  channel: { type: String, default: null }, // e.g. "open-office", "watercooler"
  type: { type: String, default: "text" }, // "text", "action", "timer"
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
