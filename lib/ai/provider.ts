interface ChatMessagePayload {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProviderResult {
  content: string;
}

const provider = process.env.AI_PROVIDER || "openai";
const model = process.env.AI_MODEL || "gpt-4o-mini";

export async function runAI(messages: ChatMessagePayload[]): Promise<ProviderResult> {
  if (provider !== "openai") {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ["Bearer", apiKey].join(" "),
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI provider request failed: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return { content };
}
