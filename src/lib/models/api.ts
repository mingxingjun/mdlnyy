import type { ModelConfig, ModelProvider, ModelSettings, ModelTaskType, TaskRouting } from './types';
import { DEFAULT_PROVIDERS, DEFAULT_TASK_ROUTING } from './types';

const STORAGE_KEY = 'uniflow-model-settings';

const VALID_PROVIDERS: readonly ModelProvider[] = ['deepseek', 'kimi', 'ollama', 'openai', 'custom'];
const VALID_TASKS: readonly ModelTaskType[] = ['doc_parse', 'chat'];

const DEFAULT_SETTINGS: ModelSettings = {
  activeProvider: 'deepseek',
  providers: { ...DEFAULT_PROVIDERS },
  taskRouting: { ...DEFAULT_TASK_ROUTING },
  tokenBudget: 100000,
  tokenUsed: 0,
  enableCompression: true,
  enableCache: true,
  cacheTTL: 3600,
};

/** 规整化 taskRouting：补全缺失字段、剔除无效 provider */
function normalizeTaskRouting(raw: Partial<TaskRouting> | undefined): TaskRouting {
  const result: TaskRouting = { ...DEFAULT_TASK_ROUTING };
  if (!raw) return result;
  for (const task of VALID_TASKS) {
    const v = raw[task];
    if (v && VALID_PROVIDERS.includes(v)) result[task] = v;
  }
  return result;
}

export function loadModelSettings(): ModelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ModelSettings>;
      const activeProvider: ModelProvider = VALID_PROVIDERS.includes(parsed.activeProvider as ModelProvider)
        ? (parsed.activeProvider as ModelProvider)
        : DEFAULT_SETTINGS.activeProvider;
      const taskRouting = normalizeTaskRouting(parsed.taskRouting);
      // 兼容旧配置（无 taskRouting）：用 activeProvider 作为 chat 任务 provider
      if (parsed.taskRouting === undefined) {
        taskRouting.chat = activeProvider;
      }
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        activeProvider,
        taskRouting,
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
    // 保持 activeProvider 与 chat 任务路由同步（向后兼容）
    const normalized: ModelSettings = {
      ...settings,
      activeProvider: settings.taskRouting.chat,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('uniflow-model-settings-changed'));
  } catch {
    // storage quota exceeded or private mode - silently degrade
  }
}

/**
 * 检查指定 provider 是否已配置可用（有 API Key，ollama 除外）。
 * 注：只要 provider 被分配了任务且有 key 即视为可用，不强制要求 enabled 开关打开，
 * 避免"填了 key 但忘开开关"导致功能静默失败。
 */
export function isProviderConfigured(settings: ModelSettings, provider: ModelProvider): boolean {
  const config = settings.providers[provider];
  if (!config) return false;
  if (config.provider === 'ollama') return true;
  return !!config.apiKey && config.apiKey.trim().length > 0;
}

/**
 * 检查指定任务类型的 provider 是否已配置。
 */
export function isTaskConfigured(settings: ModelSettings, task: ModelTaskType): boolean {
  const provider = settings.taskRouting[task];
  return isProviderConfigured(settings, provider);
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
  signal?: AbortSignal,
  overrides?: { temperature?: number; maxTokens?: number }
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
    // agent 级别 overrides 优先于 provider 默认值，让各 agent 的 temperature/maxTokens 真正生效
    temperature: overrides?.temperature ?? config.temperature,
    max_tokens: overrides?.maxTokens ?? config.maxTokens,
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

/**
 * 按任务类型路由调用模型。
 * - 'doc_parse' → 走 taskRouting.doc_parse（默认 Kimi，长上下文文档解析）
 * - 'chat' → 走 taskRouting.chat（默认 DeepSeek，出题/讲解/分析）
 *
 * `agentOverrides` 用于把 Agent 自身的 temperature/maxTokens 注入到本次请求，
 * 使各 Agent 的个性化采样参数真正生效（而非一律使用 provider 默认值）。
 *
 * 若对应 provider 未配置 API Key，抛出带提示的错误。
 */
export async function callModelForTask(
  settings: ModelSettings,
  task: ModelTaskType,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal,
  agentOverrides?: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; tokens: number }> {
  const provider = settings.taskRouting[task];
  const config = settings.providers[provider];
  if (!config) {
    throw new Error(`任务 "${task}" 未配置模型服务，请在设置中选择对应 provider`);
  }
  // 缓存 key 需区分任务、provider 与采样参数，避免不同 agent 串缓存
  const cacheKey = `task:${task}:${getCacheKey(
    config.provider,
    config.model,
    `${systemPrompt + userMessage}|t=${agentOverrides?.temperature ?? ''}|m=${agentOverrides?.maxTokens ?? ''}`,
  )}`;

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

  const content = await callModel(config, messages, signal, agentOverrides);
  const tokens = Math.ceil(content.length * 0.5);

  if (settings.enableCache) {
    setCachedResponse(cacheKey, content);
  }

  return { content, tokens };
}