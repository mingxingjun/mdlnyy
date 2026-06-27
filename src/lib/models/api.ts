import type { ModelConfig, ModelProvider, ModelSettings } from './types';
import { DEFAULT_PROVIDERS } from './types';

const STORAGE_KEY = 'uniflow-model-settings';

const VALID_PROVIDERS: readonly ModelProvider[] = ['deepseek', 'ollama', 'openai', 'custom'];

const DEFAULT_SETTINGS: ModelSettings = {
  activeProvider: 'deepseek',
  providers: { ...DEFAULT_PROVIDERS },
  tokenBudget: 100000,
  tokenUsed: 0,
  enableCompression: true,
  enableCache: true,
  cacheTTL: 3600,
};

export function loadModelSettings(): ModelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ModelSettings>;
      const activeProvider: ModelProvider = VALID_PROVIDERS.includes(parsed.activeProvider as ModelProvider)
        ? (parsed.activeProvider as ModelProvider)
        : DEFAULT_SETTINGS.activeProvider;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        activeProvider,
        providers: { ...DEFAULT_PROVIDERS, ...(parsed.providers ?? {}) },
      };
    }
  } catch {
    // ignore parse errors - fall back to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveModelSettings(settings: ModelSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('uniflow-model-settings-changed'));
  } catch {
    // storage quota exceeded or private mode - silently degrade
  }
}

const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_MAX_SIZE = 100;

// djb2 string hash - stable and fast, avoids storing full prompt as key
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function getCacheKey(provider: string, model: string, prompt: string): string {
  return `${provider}:${model}:${hashString(prompt)}`;
}

export function getCachedResponse(key: string, ttl: number): string | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl * 1000) {
    return cached.response;
  }
  responseCache.delete(key);
  return null;
}

export function setCachedResponse(key: string, response: string): void {
  if (responseCache.size >= CACHE_MAX_SIZE && !responseCache.has(key)) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { response, timestamp: Date.now() });
}

export function clearCache(): void {
  responseCache.clear();
}

export async function callModel(
  config: ModelConfig,
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  if (!config.apiKey && config.provider !== 'ollama') {
    throw new Error(`请先配置 ${config.name} 的 API Key`);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const endpoint = `${config.baseUrl}/chat/completions`;

  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    stream: false,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`API 调用失败 (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return content;
}

export async function callModelWithCache(
  settings: ModelSettings,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<{ content: string; tokens: number }> {
  const config = settings.providers[settings.activeProvider];
  if (!config) {
    throw new Error(`未找到 provider: ${String(settings.activeProvider)}，请检查模型配置`);
  }
  const cacheKey = getCacheKey(config.provider, config.model, systemPrompt + userMessage);

  if (settings.enableCache) {
    const cached = getCachedResponse(cacheKey, settings.cacheTTL);
    if (cached) {
      return { content: cached, tokens: 0 };
    }
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const content = await callModel(config, messages, signal);
  const tokens = Math.ceil(content.length * 0.5);

  if (settings.enableCache) {
    setCachedResponse(cacheKey, content);
  }

  return { content, tokens };
}