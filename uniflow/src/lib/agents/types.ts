export interface AgentIdentity {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  description: string;
  systemPrompt: string;
  skills: AgentSkill[];
  temperature: number;
  maxTokens: number;
}

export interface AgentSkill {
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: 'parse' | 'generate_flashcards' | 'search' | 'review_plan' | 'mock_exam' | 'explain' | 'summarize';
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  createdAt: number;
}

export interface AgentSession {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  tasks: AgentTask[];
  createdAt: number;
}