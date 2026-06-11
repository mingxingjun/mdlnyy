export type ModelProvider = 'deepseek' | 'ollama' | 'openai' | 'custom';

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

export interface ModelSettings {
  activeProvider: ModelProvider;
  providers: Record<ModelProvider, ModelConfig>;
  tokenBudget: number;
  tokenUsed: number;
  enableCompression: boolean;
  enableCache: boolean;
  cacheTTL: number;
}

export const DEFAULT_PROVIDERS: Record<ModelProvider, ModelConfig> = {
  deepseek: {
    provider: 'deepseek',
    name: 'DeepSeek V4 Pro',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.7,
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