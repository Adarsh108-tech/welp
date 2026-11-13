import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const authData = getUserFromRequest(req);
    const userId = body.userId || authData?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const updateData = {};
    if (body.status) updateData.status = body.status;
    if (body.currentRoom) updateData.currentRoom = body.currentRoom;
    if (body.currentDesk !== undefined) updateData.currentDesk = body.currentDesk;
    if (body.currentTask !== undefined) updateData.currentTask = body.currentTask;
    if (body.avatarColor) updateData.avatarColor = body.avatarColor;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
