// backend/src/services/anthropicClient.ts
//
// Wrapper único para hablar con la API de Anthropic (Claude).
// Toda llamada a Claude pasa por acá, así no repetimos config ni headers.
//
// ⚠️ La API key va en process.env.ANTHROPIC_API_KEY (archivo .env, NUNCA en el código
// ni en el front). Cuando Maxi pase la key, la cargás en el .env y listo.

import axios from "axios";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Modelo barato y rápido, ideal para descripciones y asistente de redacción.
const DEFAULT_MODEL = "claude-haiku-4-5";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface CallClaudeOptions {
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  model?: string;
  temperature?: number;
}

/**
 * Llama a Claude y devuelve SOLO el texto de la respuesta (concatenado).
 * Tira error si falta la key o si la API responde mal, para que el caller
 * decida si dejar el campo vacío o avisar al usuario.
 */
export async function callClaude(options: CallClaudeOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY en el .env. Cargala con la key que pase Maxi.",
    );
  }

  const body: any = {
    model: options.model || DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 400,
    messages: options.messages,
  };
  if (options.system) body.system = options.system;
  if (options.temperature !== undefined) body.temperature = options.temperature;

  const response = await axios.post(ANTHROPIC_API_URL, body, {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    timeout: 30000, // 30s, por si la API se cuelga
  });

  // La respuesta puede traer varios bloques; nos quedamos con los de texto.
  const content = response.data?.content;
  if (!Array.isArray(content)) {
    throw new Error("Respuesta inesperada de la API de Claude.");
  }

  const text = content
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Claude devolvió una respuesta vacía.");
  }

  return text;
}

export { DEFAULT_MODEL };
