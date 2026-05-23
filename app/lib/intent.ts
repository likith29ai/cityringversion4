import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function detectIntent(message: string) {
  try {
    const completion = await client.chat.completions.create({
      model: "openrouter/free",

      messages: [
        {
          role: "system",
          content: `
You are an AI intent extractor.

Return ONLY valid JSON.

Possible intents:
- group_search
- general_question

Extract:
- intent
- city
- interest

Examples:

User: "show sports groups in bangalore"

Output:
{
  "intent": "group_search",
  "city": "Bengaluru",
  "interest": "Sports"
}

User: "what is cityring"

Output:
{
  "intent": "general_question",
  "city": null,
  "interest": null
}
`,
        },

        {
          role: "user",
          content: message,
        },
      ],
    });

    const text =
      completion.choices[0].message.content || "{}";

    return JSON.parse(text);
  } catch (error) {
    console.error("INTENT ERROR:", error);

    return {
      intent: "general_question",
      city: null,
      interest: null,
    };
  }
}