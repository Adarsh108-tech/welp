import { NextResponse } from "next/server";
import { generateNotesForSyllabus } from "@/lib/aiService";
import { createPdfFromNotes } from "@/lib/pdfService";

export const dynamic = "force-dynamic";

function parseSyllabus(syllabus) {
  if (!syllabus) return [];
  return syllabus
    .split(/[\n,.]/)
    .map((topic) => topic.trim())
    .filter((topic) => topic !== "");
}

export async function POST(req) {
  try {
    const { syllabus } = await req.json();

    if (!syllabus || !syllabus.trim()) {
      return NextResponse.json(
        { error: "Syllabus cannot be empty" },
        { status: 400 }
      );
    }

    const topics = parseSyllabus(syllabus);
    if (topics.length === 0) {
      return NextResponse.json(
        { error: "No valid topics found in syllabus" },
        { status: 400 }
      );
    }

    const notes = [];
    for (const topic of topics) {
      const noteText = await generateNotesForSyllabus(topic);
      notes.push({ topic, content: noteText });
    }

    const pdfBuffer = await createPdfFromNotes(notes);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="notes.pdf"',
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("❌ Error generating notes:", err.message || err);
    return NextResponse.json(
      { error: "Failed to generate notes", details: err.message },
      { status: 500 }
    );
  }
}
