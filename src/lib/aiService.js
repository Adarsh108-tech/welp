// In-memory chat history cache for assistant
let chatHistory = [
  { role: "assistant", content: "Hello! I'm your AI assistant. Ask me anything." }
];

export async function askAI(question) {
  if (!question || !question.trim()) {
    throw new Error("Empty question is not allowed.");
  }

  const grokApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const geminiApiKey = process.env.GEMINI_API_KEY;

  chatHistory.push({ role: "user", content: question });
  const recentHistory = chatHistory.slice(-10);

  // 1. Try Groq (using GROK_API_KEY from .env.local)
  if (grokApiKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${grokApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "system",
              content: "You are Welp AI, a helpful, intelligent, and concise assistant.",
            },
            ...recentHistory,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          chatHistory.push({ role: "assistant", content: reply });
          return reply;
        }
      } else {
        const errorText = await res.text();
        console.warn("Groq API error response:", errorText);
      }
    } catch (err) {
      console.warn("Groq API call failed:", err.message);
    }
  }

  // 2. Try OpenRouter if configured
  if (openRouterApiKey) {
    try {
      const res = await fetch(`${openRouterBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-small-3.2-24b-instruct",
          messages: [
            {
              role: "system",
              content: "You are Welp AI, a helpful, intelligent, and concise assistant.",
            },
            ...recentHistory,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          chatHistory.push({ role: "assistant", content: reply });
          return reply;
        }
      }
    } catch (err) {
      console.warn("OpenRouter API call failed:", err.message);
    }
  }

  // Fallback response if external provider is unavailable
  const fallback = `I received your message: "${question}". (AI service is currently operating in offline mode.)`;
  chatHistory.push({ role: "assistant", content: fallback });
  return fallback;
}

export async function generateNotesForSyllabus(topic) {
  const prompt = `Write detailed and clear study notes for the topic: "${topic}" suitable for a student. Include key concepts, definitions, bullet points, and practical examples.`;

  const grokApiKey = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  // 1. Try Groq
  if (grokApiKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${grokApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "system",
              content: "You are an expert educator producing comprehensive, clear, structured study notes.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) return reply;
      }
    } catch (err) {
      console.warn("Groq note generation error:", err.message);
    }
  }

  // 2. Try OpenRouter
  if (openRouterApiKey) {
    try {
      const res = await fetch(`${openRouterBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-small-3.2-24b-instruct",
          messages: [
            {
              role: "system",
              content: "You are an expert educator producing comprehensive, clear, structured study notes.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) return reply;
      }
    } catch (err) {
      console.warn("OpenRouter note generation error:", err.message);
    }
  }

  // Fallback notes
  return `### ${topic}\n\nKey Concepts:\n- Comprehensive overview of ${topic}.\n- Important principles, core definitions, and mechanisms.\n- Study guide and revision tips for exam preparation.`;
}
