import { NextResponse } from "next/server";
import { chatWithAssistant, ChatMessage } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, teamContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const chatMessages: ChatMessage[] = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await chatWithAssistant(chatMessages, teamContext);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Failed to get response. Please try again." },
      { status: 500 }
    );
  }
}
