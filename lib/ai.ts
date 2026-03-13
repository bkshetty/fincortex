import OpenAI from "openai";

type SupportedProvider = "openai" | "openrouter" | "gemini";

type OpenAIConfig = {
  provider: "openai" | "openrouter";
  apiKey: string;
  model: string;
  baseURL?: string;
};

type GeminiConfig = {
  provider: "gemini";
  apiKey: string;
  model: string;
};

export type AIConfig = OpenAIConfig | GeminiConfig;

function isOpenRouterKey(apiKey: string) {
  return apiKey.startsWith("sk-or-v1-");
}

function isGeminiKey(apiKey: string) {
  return apiKey.startsWith("AIza");
}

function resolveOpenAIConfig(openAIKey?: string, envBaseURL?: string) {
  if (!openAIKey) {
    return null;
  }

  if (envBaseURL) {
    return {
      provider: isOpenRouterKey(openAIKey) ? "openrouter" : "openai",
      apiKey: openAIKey,
      baseURL: envBaseURL,
      model: process.env.OPENAI_MODEL?.trim() || (isOpenRouterKey(openAIKey) ? "openai/gpt-4o-mini" : "gpt-4o")
    } satisfies OpenAIConfig;
  }

  if (isOpenRouterKey(openAIKey)) {
    return {
      provider: "openrouter",
      apiKey: openAIKey,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENAI_MODEL?.trim() || "openai/gpt-4o-mini"
    } satisfies OpenAIConfig;
  }

  if (isGeminiKey(openAIKey)) {
    return {
      provider: "gemini",
      apiKey: openAIKey,
      model: process.env.GEMINI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gemini-2.0-flash"
    } satisfies GeminiConfig;
  }

  return {
    provider: "openai",
    apiKey: openAIKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o"
  } satisfies OpenAIConfig;
}

export function resolveAIConfigs(): AIConfig[] {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY)?.trim();
  const envBaseURL = process.env.OPENAI_BASE_URL?.trim();
  const configs: AIConfig[] = [];

  const openAIConfig = resolveOpenAIConfig(openAIKey, envBaseURL);
  if (openAIConfig) {
    configs.push(openAIConfig);
  }

  if (geminiKey && isGeminiKey(geminiKey)) {
    const isDuplicate = configs.some(
      (config) => config.provider === "gemini" && config.apiKey === geminiKey
    );
    if (!isDuplicate) {
      configs.push({
        provider: "gemini",
        apiKey: geminiKey,
        model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash"
      });
    }
  }

  return configs;
}

export function resolveAIConfig(): AIConfig | null {
  return resolveAIConfigs()[0] || null;
}

export function hasAIConfig() {
  return resolveAIConfigs().length > 0;
}

export function getAIProviderName(provider?: SupportedProvider) {
  switch (provider) {
    case "gemini":
      return "Gemini";
    case "openrouter":
      return "OpenRouter";
    case "openai":
      return "OpenAI";
    default:
      return "AI";
  }
}

export function getOpenAIClient(config?: OpenAIConfig) {
  const resolved = config || resolveAIConfig();
  if (!resolved || resolved.provider === "gemini") {
    throw new Error("OpenAI-compatible provider is not configured");
  }

  return new OpenAI({
    apiKey: resolved.apiKey,
    ...(resolved.baseURL ? { baseURL: resolved.baseURL } : {})
  });
}

function extractGeminiText(payload: unknown) {
  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return (
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim() || ""
  );
}

export async function generateGeminiContent({
  config,
  systemInstruction,
  prompt,
  temperature,
  inlineData
}: {
  config: GeminiConfig;
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...(systemInstruction
          ? {
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
          : {}),
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              ...(inlineData
                ? [
                  {
                    inline_data: {
                      mime_type: inlineData.mimeType,
                      data: inlineData.data
                    }
                  }
                ]
                : [])
            ]
          }
        ],
        generationConfig: {
          temperature: temperature ?? 0
        }
      })
    }
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message || `Gemini request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = extractGeminiText(payload);

  if (!text) {
    throw new Error("No text output from Gemini");
  }

  return text;
}

export function shouldRetryWithNextProvider(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("quota exceeded") ||
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("402") ||
    message.includes("requires more credits") ||
    message.includes("resource_exhausted") ||
    message.includes("insufficient_quota")
  );
}
