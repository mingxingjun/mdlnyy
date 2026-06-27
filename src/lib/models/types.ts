export type ModelProvider = 'deepseek' | 'kimi' | 'ollama' | 'openai' | 'custom';

export interface ModelConfig {
  provider: ModelProvider;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
}

/**
 * 模型任务类型 —— 用于按任务路由到不同 provider。
 * - doc_parse: 文档/资料解析（长上下文，抽取知识点）→ 默认 Kimi
 * - chat: 对话/出题/讲解/分析等通用任务 → 默认 DeepSeek
 */
export type ModelTaskType = 'doc_parse' | 'chat';

/** 任务分工：每个任务类型由哪个 provider 负责 */
export type TaskRouting = Record<ModelTaskType, ModelProvider>;

export interface ModelSettings {
  /** 主力对话 provider（向后兼容，等于 chat 任务的 provider） */
  activeProvider: ModelProvider;
  providers: Record<ModelProvider, ModelConfig>;
  /** 任务分工配置：决定 doc_parse / chat 各用哪个 provider */
  taskRouting: TaskRouting;
  tokenBudget: number;
  tokenUsed: number;
  enableCompression: boolean;
  enableCache: boolean;
  cacheTTL: number;
}

export const DEFAULT_PROVIDERS: Record<ModelProvider, ModelConfig> = {
  deepseek: {
    provider: 'deepseek',
    name: 'DeepSeek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
    enabled: true,
  },
  kimi: {
    provider: 'kimi',
    name: 'Kimi (Moonshot)',
    apiKey: '',
    baseUrl: 'https://api.moonshot.cn/v1',
    // moonshot-v1-32k 支持长上下文，适合文档解析
    model: 'moonshot-v1-32k',
    temperature: 0.4,
    maxTokens: 4096,
    topP: 0.9,
    enabled: true,
  },
  ollama: {
    provider: 'ollama',
    name: '本地模型 (Ollama)',
    apiKey: '',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    enabled: false,
  },
  openai: {
    provider: 'openai',
    name: 'OpenAI Compatible',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
    enabled: false,
  },
  custom: {
    provider: 'custom',
    name: '自定义端点',
    apiKey: '',
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
    enabled: false,
  },
};

/** 默认任务分工：Kimi 负责文档解析，DeepSeek 负责其他 */
export const DEFAULT_TASK_ROUTING: TaskRouting = {
  doc_parse: 'kimi',
  chat: 'deepseek',
};
