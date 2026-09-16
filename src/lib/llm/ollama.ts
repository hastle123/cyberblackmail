const DEFAULT_HOST = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2";

export function getOllamaHost(): string {
  return process.env.OLLAMA_HOST?.trim() || DEFAULT_HOST;
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL;
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${getOllamaHost()}/api/tags`, {
      signal: AbortSignal.timeout(4_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ollamaGenerate(
  prompt: string,
  options?: { system?: string; json?: boolean; timeoutMs?: number },
): Promise<string> {
  const res = await fetch(`${getOllamaHost()}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getOllamaModel(),
      prompt: options?.system ? `${options.system}\n\n${prompt}` : prompt,
      stream: false,
      format: options?.json ? "json" : undefined,
      options: { temperature: 0.25, num_predict: 8192 },
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? 180_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { response?: string };
  const out = json.response?.trim();
  if (!out) throw new Error("Empty Ollama response");
  return out;
}
