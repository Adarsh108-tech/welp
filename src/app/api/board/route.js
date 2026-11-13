import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BoardNote from "@/models/BoardNote";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const notes = await BoardNote.find().sort({ timestamp: -1 }).limit(50);
    return NextResponse.json(notes);
  } catch (err) {
    console.error("Fetch board notes error:", err);
    return NextResponse.json(
      { error: "Failed to fetch board notes" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const authData = getUserFromRequest(req);

    const authorId = body.authorId || authData?.userId || "guest";
    const authorName = body.authorName || authData?.username || "Teammate";
    const content = body.content?.trim();
    const category = body.category || "Standup";
    const color = body.color || "yellow";

    if (!content) {
      return NextResponse.json(
        { error: "Note content cannot be empty" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const note = new BoardNote({
      authorId,
      authorName,
      content,
      category,
      color,
      timestamp: new Date(),
    });
    await note.save();

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("Create board note error:", err);
    return NextResponse.json(
      { error: "Failed to create board note" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing note id" }, { status: 400 });
    }

    await connectToDatabase();
    await BoardNote.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
