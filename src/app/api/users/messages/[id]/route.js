import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = params; // channel name OR user ID
    const authData = getUserFromRequest(req);
    const userId = authData?.userId || req.headers.get("userid");

    await connectToDatabase();

    // Channel messages
    if (id.startsWith("channel_")) {
      const messages = await Message.find({
        receiverId: id,
      })
        .sort({ timestamp: 1 })
        .limit(100);
      return NextResponse.json(messages);
    }

    // Direct Messages
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in headers or auth token" },
        { status: 400 }
      );
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: id },
        { senderId: id, receiverId: userId },
      ],
    })
      .sort({ timestamp: 1 })
      .limit(100);

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { id: receiverId } = params;
    const body = await req.json();
    const authData = getUserFromRequest(req);
    const senderId = body.from || authData?.userId || req.headers.get("userid");
    const senderName = body.senderName || authData?.username || "Teammate";
    const content = body.content || body.msg;
    const type = body.type || "text";

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: "senderId, receiverId and content are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const message = new Message({
      senderId,
      receiverId,
      senderName,
      content,
      channel: receiverId.startsWith("channel_") ? receiverId : null,
      type,
      timestamp: new Date(),
    });
    await message.save();

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
