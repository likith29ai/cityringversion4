import { NextResponse } from "next/server";
import { askCityringAI } from "@/app/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json(
        { reply: "Message is required" },
        { status: 400 }
      );
    }

    const reply = await askCityringAI(message);

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        reply: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}