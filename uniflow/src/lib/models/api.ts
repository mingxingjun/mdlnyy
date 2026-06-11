import type { ModelConfig, ModelSettings } from './types';
import { DEFAULT_PROVIDERS } from './types';

const STORAGE_KEY = 'uniflow-model-settings';

export function loadModelSettings(): ModelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        providers: { ...DEFAULT_PROVIDERS, ...parsed.providers },
      };
    }
  } catch {}
  return {
    activeProvider: 'deepseek',
    providers: { ...DEFAULT_PROVIDERS },
    tokenBudget: 100000,
    tokenUsed: 0,
    enableCompression: true,
    enableCache: true,
    cacheTTL: 3600,
  };
}

export function saveModelSettings(settings: ModelSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const responseCache = new Map<string, { response: string; timestamp: number }>();

export function getCacheKey(provider: string, model: string, prompt: string): string {
  return `${provider}:${model}:${prompt.slice(0, 200)}`;
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