import mongoose from "mongoose";

const boardNoteSchema = new mongoose.Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    default: "Standup",
    enum: ["Standup", "Idea", "Announcement", "Shoutout"],
  },
  color: {
    type: String,
    default: "yellow", // "yellow", "blue", "green", "pink", "purple"
  },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.BoardNote || mongoose.model("BoardNote", boardNoteSchema);
