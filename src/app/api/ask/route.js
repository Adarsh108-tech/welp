import { NextResponse } from "next/server";
import { askAI } from "@/lib/aiService";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { question } = await req.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty question is not allowed." },
        { status: 400 }
      );
    }

    const aiResponse = await askAI(question);
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("AI Error:", error.message || error);
    return NextResponse.json(
      {
        error: "Failed to get AI response",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
