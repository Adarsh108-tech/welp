import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: {
      type: String,
      default: "Available",
      enum: ["Available", "In Focus", "Coffee Break", "In Meeting", "Away"],
    },
    currentRoom: {
      type: String,
      default: "open-office",
    },
    currentDesk: {
      type: Number,
      default: null,
    },
    currentTask: {
      type: String,
      default: "Working remotely",
    },
    avatarColor: {
      type: String,
      default: "blue",
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
