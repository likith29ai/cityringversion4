import OpenAI from "openai";
import { CITYRING_KNOWLEDGE } from "./cityringKnowledge";
import { getGroupsForAI } from "./ai-tools";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function askCityringAI(message: string) {
  try {
    // Fetch latest groups
    const groups = await getGroupsForAI();

    // Convert groups into readable AI context
    const groupsContext = groups
      .map(
        (g: any) => `
Title: ${g.title}
City: ${g.city}
Interest: ${g.interest}
Description: ${g.description}
Platforms: ${g.platforms?.join(", ")}
`
      )
      .join("\n");

    // Ask AI
    const completion =
      await client.chat.completions.create({
        model: "openrouter/free",

        messages: [
          {
            role: "system",
            content: `
You are Cityring Assistant.

ABOUT CITYRING:
${CITYRING_KNOWLEDGE}

AVAILABLE GROUPS:
${groupsContext}

YOUR BEHAVIOR:
- Understand natural language naturally
- Understand spelling mistakes
- Understand slang and casual chat
- Recommend matching groups intelligently
- Behave conversationally like ChatGPT
- Keep responses clean and helpful
- If user asks for groups, recommend the best matching groups from AVAILABLE GROUPS
- If no matching group exists, politely say so
- ONLY answer Cityring-related questions
`,
          },

          {
            role: "user",
            content: message,
          },
        ],
      });

    return (
      completion.choices[0].message.content ||
      "Sorry, I couldn't answer."
    );
  } catch (error) {
    console.error("AI ERROR:", error);

    return "Cityring Assistant is temporarily busy.";
  }
}