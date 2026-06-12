import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Trash2,
  Settings,
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Play,
  RotateCcw,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/components/Toast';
import { AGENTS, getAgent, compressPrompt, getAgentSkillPrompt } from '@/lib/agents/definitions';
import { loadModelSettings, saveModelSettings, callModelWithCache, clearCache as clearModelCache } from '@/lib/models/api';
import type { AgentIdentity } from '@/lib/agents/types';
import type { ModelProvider, ModelConfig, ModelSettings } from '@/lib/models/types';
import { DEFAULT_PROVIDERS } from '@/lib/models/types';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type TabId = 'agent' | 'model';
type WorkflowId = 'free-chat' | 'full-review' | 'exam-sprint' | 'feynman-understand';

interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

interface UploadedFile {
  name: string;
  size: number;
  content: string;
  type: string;
}

interface WorkflowStep {
  agentId: string;
  label: string;
  prompt: string;
}

interface Workflow {
  id: WorkflowId;
  name: string;
  icon: string;
  steps: WorkflowStep[];
}

interface StepOutput {
  agentId: string;
  content: string;
  tokens: number;
  collapsed: boolean;
}

/* ================================================================== */
/*  Workflow Definitions                                               */
/* ================================================================== */

const WORKFLOWS: Workflow[] = [
  {
    id: 'free-chat',
    name: '自由对话',
    icon: '💬',
    steps: [],
  },
  {
    id: 'full-review',
    name: '完整复习流程',
    icon: '📚',
    steps: [
      { agentId: 'knowledge-extractor', label: '知识提取', prompt: '请从以下材料中提取核心考点和知识框架：' },
      { agentId: 'flashcard-master', label: '生成闪卡', prompt: '请基于以下知识点生成记忆闪卡：' },
      { agentId: 'review-planner', label: '复习规划', prompt: '请根据以下内容制定科学的复习计划：' },
    ],
  },
  {
    id: 'exam-sprint',
    name: '考前冲刺',
    icon: '🚀',
    steps: [
      { agentId: 'knowledge-extractor', label: '知识提取', prompt: '请从以下材料中提取核心考点和知识框架：' },
      { agentId: 'exam-coach', label: '模拟考试', prompt: '请基于以下知识点生成模拟试卷：' },
      { agentId: 'review-planner', label: '复习规划', prompt: '请根据以下考试情况制定考前冲刺复习计划：' },
    ],
  },
  {
    id: 'feynman-understand',
    name: '费曼理解',
    icon: '💡',
    steps: [
      { agentId: 'study-mentor', label: '费曼解释', prompt: '请用最简单的话解释以下内容中的核心概念：' },
      { agentId: 'knowledge-extractor', label: '知识提取', prompt: '请从以下解释中提取结构化的知识框架：' },
    ],
  },
];

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function AIEngine() {
  const { addToast } = useToastStore();
  const {
    agentSessions,
    createAgentSession,
    addAgentMessage,
    clearAgentSession,
  } = useAppStore();

  /* ─── Tab State ─── */
  const [activeTab, setActiveTab] = useState<TabId>('agent');

  /* ─── Workflow State ─── */
  const [activeWorkflowId, setActiveWorkflowId] = useState<WorkflowId>('free-chat');
  const activeWorkflow = WORKFLOWS.find((w) => w.id === activeWorkflowId)!;

  /* ─── Agent State (Free Chat) ─── */
  const [selectedAgentId, setSelectedAgentId] = useState<string>('knowledge-extractor');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ─── Workflow Execution State ─── */
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepOutputs, setStepOutputs] = useState<StepOutput[]>([]);
  const [workflowComplete, setWorkflowComplete] = useState(false);
  const [workflowChatInput, setWorkflowChatInput] = useState('');
  const [workflowChatAgent, setWorkflowChatAgent] = useState<string>('knowledge-extractor');
  const [workflowChatMessages, setWorkflowChatMessages] = useState<AgentMessage[]>([]);
  const [workflowChatTyping, setWorkflowChatTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workflowChatEndRef = useRef<HTMLDivElement>(null);

  /* ─── Model Settings State ─── */
  const [modelSettings, setModelSettings] = useState<ModelSettings>(loadModelSettings);

  /* ─── Derived ─── */
  const selectedAgent = getAgent(selectedAgentId);
  const agentSessionsForSelected = agentSessions.filter(
    (s) => s.agentId === selectedAgentId,
  );
  const latestSession = [...agentSessionsForSelected].sort(
    (a, b) => b.createdAt - a.createdAt,
  )[0];

  /* ─── When agent changes, load latest session ─── */
  useEffect(() => {
    if (latestSession) {
      setActiveSessionId(latestSession.id);
    } else {
      setActiveSessionId(null);
    }
    setSelectedSkill(null);
    setChatInput('');
  }, [selectedAgentId]);

  /* ─── Auto-scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [latestSession?.messages, isTyping]);

  useEffect(() => {
    workflowChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workflowChatMessages, workflowChatTyping]);

  /* ─── Reset workflow state when switching workflows ─── */
  useEffect(() => {
    setUploadedFile(null);
    setWorkflowRunning(false);
    setCurrentStep(-1);
    setStepOutputs([]);
    setWorkflowComplete(false);
    setWorkflowChatMessages([]);
    setWorkflowChatInput('');
  }, [activeWorkflowId]);

  /* ================================================================== */
  /*  File Upload                                                        */
  /* ================================================================== */

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setUploadedFile({ name: file.name, size: file.size, content: text, type: file.type });
      addToast('success', '文件上传成功');
    };
    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  }, [addToast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  /* ================================================================== */
  /*  Workflow Execution                                                  */
  /* ================================================================== */

  const executeWorkflow = useCallback(async (workflow: Workflow, input: string) => {
    setWorkflowRunning(true);
    setWorkflowComplete(false);
    setStepOutputs([]);
    setCurrentStep(-1);

    const outputs: StepOutput[] = [];

    for (let i = 0; i < workflow.steps.length; i++) {
      setCurrentStep(i);
      const step = workflow.steps[i];
      const agent = getAgent(step.agentId);
      if (!agent) continue;

      const prompt = i === 0
        ? `${step.prompt}\n\n${input}`
        : `基于上一步的分析结果：\n${outputs[i - 1].content}\n\n${step.prompt}`;

      try {
        const result = await callModelWithCache(modelSettings, agent.systemPrompt, prompt);
        const output: StepOutput = {
          agentId: step.agentId,
          content: result.content,
          tokens: result.tokens,
          collapsed: false,
        };
        outputs.push(output);
        setStepOutputs([...outputs]);
        addToast('success', `${agent.name} 完成`);

        setModelSettings((prev) => ({
          ...prev,
          tokenUsed: prev.tokenUsed + result.tokens,
        }));
      } catch (error: any) {
        const output: StepOutput = {
          agentId: step.agentId,
          content: `❌ 调用失败：${error.message || '未知错误'}`,
          tokens: 0,
          collapsed: false,
        };
        outputs.push(output);
        setStepOutputs([...outputs]);
        addToast('error', error.message || '工作流执行失败');
        break;
      }
    }

    setWorkflowRunning(false);
    setWorkflowComplete(true);
    if (outputs.length === workflow.steps.length) {
      addToast('success', '工作流全部完成');
    }
  }, [modelSettings, addToast]);

  const handleStartWorkflow = useCallback(() => {
    if (!uploadedFile || activeWorkflow.steps.length === 0) return;
    executeWorkflow(activeWorkflow, uploadedFile.content);
  }, [uploadedFile, activeWorkflow, executeWorkflow]);

  const handleResetWorkflow = useCallback(() => {
    setUploadedFile(null);
    setWorkflowRunning(false);
    setCurrentStep(-1);
    setStepOutputs([]);
    setWorkflowComplete(false);
    setWorkflowChatMessages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ================================================================== */
  /*  Workflow Chat                                                      */
  /* ================================================================== */

  const handleWorkflowChatSend = useCallback(async () => {
    if (!workflowChatInput.trim() || workflowChatTyping) return;

    const userText = workflowChatInput.trim();
    setWorkflowChatInput('');

    const userMsg: AgentMessage = {
      id: `wc-user-${Date.now()}`,
      agentId: workflowChatAgent,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    setWorkflowChatMessages((prev) => [...prev, userMsg]);

    const agent = getAgent(workflowChatAgent);
    if (!agent) return;

    // Include workflow context
    const contextParts = stepOutputs
      .map((o) => { const a = getAgent(o.agentId); return `${a?.name || o.agentId}的分析结果：\n${o.content}`; })
      .join('\n\n---\n\n');
    const fullPrompt = `【工作流上下文】\n${contextParts}\n\n【用户问题】${userText}`;

    setWorkflowChatTyping(true);
    try {
      const result = await callModelWithCache(modelSettings, agent.systemPrompt, fullPrompt);
      const aiMsg: AgentMessage = {
        id: `wc-ai-${Date.now()}`,
        agentId: workflowChatAgent,
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        tokens: result.tokens,
      };
      setWorkflowChatMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      addToast('error', error.message || 'AI 响应失败');
    } finally {
      setWorkflowChatTyping(false);
    }
  }, [workflowChatInput, workflowChatTyping, workflowChatAgent, stepOutputs, modelSettings, addToast]);

  /* ================================================================== */
  /*  Free Chat Submit                                                   */
  /* ================================================================== */

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isTyping || !selectedAgent) return;

    const userText = chatInput.trim();
    setChatInput('');

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createAgentSession(selectedAgentId);
      setActiveSessionId(sessionId);
    }

    let fullInput = userText;
    if (selectedSkill) {
      const skillPrompt = getAgentSkillPrompt(selectedAgentId, selectedSkill);
      fullInput = skillPrompt + '\n\n' + userText;
    }
    const prompt = compressPrompt(selectedAgent, fullInput);

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      agentId: selectedAgentId,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    addAgentMessage(sessionId, userMsg);

    setIsTyping(true);

    try {
      const result = await callModelWithCache(
        modelSettings,
        selectedAgent.systemPrompt,
        fullInput,
      );

      const aiMsg: AgentMessage = {
        id: `ai-${Date.now()}`,
        agentId: selectedAgentId,
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        tokens: result.tokens,
      };
      addAgentMessage(sessionId, aiMsg);

      setModelSettings((prev) => ({
        ...prev,
        tokenUsed: prev.tokenUsed + result.tokens,
      }));
    } catch (error: any) {
      addToast('error', error.message || 'AI 响应失败');

      const errMsg: AgentMessage = {
        id: `err-${Date.now()}`,
        agentId: selectedAgentId,
        role: 'system',
        content: `❌ 调用失败：${error.message || '未知错误'}`,
        timestamp: Date.now(),
      };
      addAgentMessage(sessionId, errMsg);
    } finally {
      setIsTyping(false);
      setSelectedSkill(null);
    }
  }, [
    chatInput,
    isTyping,
    selectedAgent,
    selectedAgentId,
    selectedSkill,
    activeSessionId,
    modelSettings,
    createAgentSession,
    addAgentMessage,
    addToast,
  ]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleWorkflowChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleWorkflowChatSend();
    }
  };

  /* ─── Clear Session ─── */
  const handleClearSession = useCallback(() => {
    if (activeSessionId) {
      clearAgentSession(activeSessionId);
      setActiveSessionId(null);
      setSelectedSkill(null);
      setChatInput('');
    }
  }, [activeSessionId, clearAgentSession]);

  /* ─── Model Settings Handlers ─── */
  const handleProviderChange = useCallback(
    (provider: ModelProvider, field: keyof ModelConfig, value: any) => {
      setModelSettings((prev) => ({
        ...prev,
        providers: {
          ...prev.providers,
          [provider]: { ...prev.providers[provider], [field]: value },
        },
      }));
    },
    [],
  );

  const handleSettingsChange = useCallback(
    (key: keyof ModelSettings, value: any) => {
      setModelSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSaveSettings = useCallback(() => {
    saveModelSettings(modelSettings);
    addToast('success', '配置已保存');
  }, [modelSettings, addToast]);

  const handleClearCache = useCallback(() => {
    clearModelCache();
    addToast('info', '缓存已清除');
  }, [addToast]);

  /* ─── Messages for display ─── */
  const displayMessages: AgentMessage[] = (() => {
    if (!latestSession) return [];

    if (latestSession.messages.length === 0 && selectedAgent) {
      return [
        {
          id: 'welcome',
          agentId: selectedAgentId,
          role: 'assistant',
          content: `你好！我是${selectedAgent.name}（${selectedAgent.role}）\n\n${selectedAgent.description}\n\n请选择下方技能或直接输入你的问题！`,
          timestamp: Date.now(),
        },
      ];
    }
    return latestSession.messages;
  })();

  /* ================================================================== */
  /*  Render Helpers                                                     */
  /* ================================================================== */

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderAgentOrb = (agent: AgentIdentity, isSelected: boolean, onClick: () => void, size: number = 48) => (
    <motion.button
      key={agent.id}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="agent-orb flex flex-col items-center gap-1.5 cursor-pointer group"
      style={{ width: size + 24 }}
    >
      <div
        className="relative rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          width: size,
          height: size,
          background: isSelected ? '#EEF4FF' : '#ffffff',
          border: `2px solid ${isSelected ? '#2383E2' : '#EAEAEA'}`,
        }}
      >
        <span style={{ fontSize: size * 0.45 }}>{agent.avatar}</span>
        {isSelected && (
          <motion.div
            layoutId="agent-orb-ring"
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid #2383E2',
              opacity: 0.3,
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
      <span
        className="text-[10px] font-sans truncate max-w-full text-center transition-colors"
        style={{ color: isSelected ? '#2383E2' : '#666666' }}
      >
        {agent.name}
      </span>
    </motion.button>
  );

  /* ================================================================== */
  /*  Pipeline Visualization                                             */
  /* ================================================================== */

  const renderPipeline = (steps: WorkflowStep[], current: number, outputs: StepOutput[]) => (
    <div className="workflow-pipeline flex items-center justify-center gap-0 py-4 overflow-x-auto">
      {steps.map((step, i) => {
        const agent = getAgent(step.agentId);
        const isCompleted = i < outputs.length && !outputs[i].content.startsWith('❌');
        const isCurrent = i === current;
        const isPending = i > current;

        return (
          <div key={`${step.agentId}-${i}`} className="flex items-center">
            {/* Step orb */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background: isCompleted
                    ? '#f0fdf4'
                    : isCurrent
                    ? '#EEF4FF'
                    : '#ffffff',
                  border: `2px solid ${isCompleted ? '#10b981' : isCurrent ? '#2383E2' : '#EAEAEA'}`,
                }}
              >
                {isCompleted ? (
                  <Check size={18} style={{ color: '#10b981' }} />
                ) : isCurrent && workflowRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-t-transparent rounded-full"
                    style={{ borderColor: '#2383E2', borderTopColor: 'transparent' }}
                  />
                ) : (
                  <span style={{ fontSize: 20 }}>{agent?.avatar || '🤖'}</span>
                )}
              </div>
              <span
                className="text-[10px] font-sans whitespace-nowrap"
                style={{
                  color: isCompleted
                    ? '#10b981'
                    : isCurrent
                    ? '#111111'
                    : '#999999',
                }}
              >
                {step.label}
              </span>
              {agent && (
                <span className="text-[9px] font-sans text-[#999999]">{agent.name}</span>
              )}
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex items-center mx-2">
                <div
                  className="h-[2px] w-8"
                  style={{
                    background: isCompleted ? '#10b981' : '#EAEAEA',
                  }}
                />
                <ArrowRight
                  size={12}
                  style={{
                    color: isCompleted ? '#10b981' : '#d1d5db',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ================================================================== */
  /*  Step Output Cards                                                  */
  /* ================================================================== */

  const renderStepOutputs = () => (
    <div className="space-y-3">
      {stepOutputs.map((output, i) => {
        const agent = getAgent(output.agentId);
        const isError = output.content.startsWith('❌');
        return (
          <motion.div
            key={`step-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card overflow-hidden"
          >
            {/* Card header */}
            <button
              onClick={() =>
                setStepOutputs((prev) =>
                  prev.map((o, idx) => (idx === i ? { ...o, collapsed: !o.collapsed } : o)),
                )
              }
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f9f9f9] transition-colors cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isError ? '#fef2f2' : '#EEF4FF',
                  border: `1px solid ${isError ? '#fecaca' : '#bfdbfe'}`,
                }}
              >
                <span className="text-sm">{agent?.avatar || '🤖'}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-semibold text-[#111111]">
                    {agent?.name || 'Unknown'}
                  </span>
                  <span
                    className={`badge ${isError ? 'badge-red' : 'badge-green'}`}
                  >
                    {isError ? '失败' : '完成'}
                  </span>
                </div>
                <p className="text-[11px] text-[#999999] font-sans">
                  {activeWorkflow.steps[i]?.label}
                  {output.tokens > 0 && ` · ${output.tokens} tokens`}
                </p>
              </div>
              {output.collapsed ? (
                <ChevronRight size={16} className="text-[#999999]" />
              ) : (
                <ChevronDown size={16} className="text-[#999999]" />
              )}
            </button>

            {/* Card content */}
            <AnimatePresence>
              {!output.collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-[#EAEAEA]">
                    <div
                      className="text-sm font-sans text-[#666666] leading-relaxed max-h-[400px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(output.content) }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );

  /* ================================================================== */
  /*  JSX                                                                */
  /* ================================================================== */

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-0 mb-4 flex-shrink-0 border-b border-[#EAEAEA]">
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-sans transition-all duration-200 cursor-pointer border-b-2
            ${activeTab === 'agent'
              ? 'border-[var(--accent)] text-[var(--accent)] font-medium'
              : 'border-transparent text-[#999999] hover:text-[#666666]'
            }`}
        >
          <Bot size={16} />
          Agent 工作台
        </button>
        <button
          onClick={() => setActiveTab('model')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-sans transition-all duration-200 cursor-pointer border-b-2
            ${activeTab === 'model'
              ? 'border-[var(--accent)] text-[var(--accent)] font-medium'
              : 'border-transparent text-[#999999] hover:text-[#666666]'
            }`}
        >
          <Settings size={16} />
          模型配置
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'agent' ? (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* ═══════════════ Workflow Selector ═══════════════ */}
            <div className="flex-shrink-0 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {WORKFLOWS.map((wf) => {
                  const isActive = activeWorkflowId === wf.id;
                  return (
                    <motion.button
                      key={wf.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveWorkflowId(wf.id)}
                      className={`badge flex items-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap
                        ${isActive
                          ? 'badge-blue'
                          : 'bg-white border border-[#EAEAEA] text-[#999999] hover:text-[#666666] hover:border-gray-300'
                        }`}
                    >
                      <span>{wf.icon}</span>
                      {wf.name}
                    </motion.button>
                  );
                })}
              </div>

              {/* Pipeline visualization for non-free-chat workflows */}
              {activeWorkflowId !== 'free-chat' && activeWorkflow.steps.length > 0 && (
                <div className="card px-4 py-2 mt-2">
                  {renderPipeline(activeWorkflow.steps, currentStep, stepOutputs)}
                </div>
              )}
            </div>

            {/* ═══════════════ Main Work Area ═══════════════ */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeWorkflowId === 'free-chat' ? (
                /* ──── Free Chat Mode ──── */
                <div className="h-full flex flex-col card">
                  {/* Agent selector: horizontal scrollable orbs */}
                  <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-[#EAEAEA]">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {AGENTS.map((agent) =>
                        renderAgentOrb(
                          agent,
                          selectedAgentId === agent.id,
                          () => setSelectedAgentId(agent.id),
                          44,
                        )
                      )}
                    </div>
                  </div>

                  {/* Agent info bar */}
                  {selectedAgent && (
                    <div className="flex items-center gap-3 px-5 pt-3 pb-2 border-b border-[#EAEAEA] flex-shrink-0">
                      <span className="text-lg">{selectedAgent.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-sans font-semibold text-[#111111] text-sm">
                            {selectedAgent.name}
                          </h2>
                          <span className="badge badge-blue">
                            {selectedAgent.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#999999] font-sans mt-0.5 line-clamp-1">
                          {selectedAgent.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {latestSession && latestSession.messages.length > 0 && (
                          <button
                            onClick={handleClearSession}
                            className="ghost-btn flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer"
                          >
                            <Trash2 size={12} />
                            清除对话
                          </button>
                        )}
                        <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                        <span className="text-[10px] text-[#999999] font-sans">在线</span>
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                    <AnimatePresence initial={false}>
                      {displayMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {msg.role === 'system' ? (
                            <div className="w-full flex justify-center">
                              <div className="max-w-[80%] px-4 py-2 rounded-[6px] bg-[#f9f9f9] border border-[#EAEAEA] text-[11px] text-[#999999] font-sans text-center">
                                {msg.content}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="w-8 h-8 rounded-[5px] flex items-center justify-center flex-shrink-0"
                                style={
                                  msg.role === 'assistant' && selectedAgent
                                    ? { backgroundColor: '#EEF4FF' }
                                    : { backgroundColor: '#EEF4FF' }
                                }
                              >
                                {msg.role === 'assistant' ? (
                                  <span>{selectedAgent?.avatar || '🤖'}</span>
                                ) : (
                                  <User size={16} className="text-[var(--accent)]" />
                                )}
                              </div>
                              <div
                                className={`max-w-[80%] px-4 py-3 rounded-[6px] text-sm font-sans leading-relaxed
                                  ${msg.role === 'assistant'
                                    ? 'bg-[#f9f9f9] border border-[#EAEAEA] text-[#111111] rounded-tl-sm'
                                    : 'bg-[#EEF4FF] border border-blue-100 text-[#111111] rounded-tr-sm whitespace-pre-wrap'
                                  }`}
                              >
                                {msg.role === 'assistant' ? (
                                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                ) : (
                                  msg.content
                                )}
                                {msg.role === 'assistant' && msg.tokens && msg.tokens > 0 && (
                                  <p className="text-[9px] text-[#999999] mt-1">{msg.tokens} tokens</p>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {isTyping && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                        <div className="w-8 h-8 rounded-[5px] flex items-center justify-center flex-shrink-0 bg-[#f9f9f9]">
                          <span>{selectedAgent?.avatar || '🤖'}</span>
                        </div>
                        <div className="px-4 py-3 rounded-[6px] rounded-tl-sm bg-[#f9f9f9] border border-[#EAEAEA]">
                          <div className="flex gap-1.5 items-center h-5">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                className="w-2 h-2 rounded-full animate-bounce"
                                style={{
                                  backgroundColor: '#2383E2',
                                  animationDelay: `${delay}ms`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Skill quick-select + Input area */}
                  <div className="px-4 pb-4 pt-2 flex-shrink-0 space-y-2">
                    {selectedAgent && selectedAgent.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAgent.skills.map((skill) => {
                          const isActive = selectedSkill === skill.name;
                          return (
                            <button
                              key={skill.name}
                              onClick={() => setSelectedSkill((prev) => (prev === skill.name ? null : skill.name))}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-sans transition-all duration-200 cursor-pointer
                                ${isActive
                                  ? 'badge-blue'
                                  : 'bg-white border border-[#EAEAEA] text-[#999999] hover:text-[#666666] hover:border-gray-300'
                                }`}
                            >
                              <span className="text-xs">{skill.icon}</span>
                              {skill.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-end gap-2 bg-white border border-[#EAEAEA] rounded-[6px] px-4 py-2 focus-within:border-[#2383E2] focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300">
                      <textarea
                        value={chatInput}
                        onChange={(e) => {
                          setChatInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 3 * 24) + 'px';
                        }}
                        onKeyDown={handleInputKeyDown}
                        placeholder="输入你的问题... (Shift+Enter 换行)"
                        rows={1}
                        className="flex-1 bg-transparent text-sm font-sans text-[#111111] placeholder-gray-400 outline-none resize-none leading-6"
                        style={{ maxHeight: '72px' }}
                        disabled={isTyping}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isTyping}
                        className="accent-btn w-8 h-8 rounded-[5px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ──── Workflow Mode ──── */
                <div className="h-full flex flex-col gap-4 overflow-y-auto">
                  {/* File Upload Zone */}
                  {!uploadedFile ? (
                    <div
                      className={`file-drop-zone card flex-shrink-0 flex flex-col items-center justify-center py-12 cursor-pointer transition-all duration-300
                        ${isDragOver ? 'border-[var(--accent)] bg-[#EEF4FF]' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.md,.docx"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                      <motion.div
                        animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                        className="w-16 h-16 rounded-[6px] bg-[#f9f9f9] border border-[#EAEAEA] flex items-center justify-center mb-4"
                      >
                        <Upload size={28} className="text-[#999999]" />
                      </motion.div>
                      <p className="text-sm font-sans text-[#666666] mb-1">
                        拖拽文件到此处，或点击上传
                      </p>
                      <p className="text-[11px] font-sans text-[#999999]">
                        支持 PDF、TXT、MD、DOCX 格式
                      </p>
                    </div>
                  ) : (
                    <div className="card flex-shrink-0 px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[6px] bg-[#EEF4FF] border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={22} className="text-[var(--accent)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-sans font-semibold text-[#111111] truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[11px] text-[#999999] font-sans">
                            {formatFileSize(uploadedFile.size)} · {uploadedFile.type || '未知类型'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!workflowRunning && !workflowComplete && (
                            <button
                              onClick={handleStartWorkflow}
                              className="accent-btn flex items-center gap-2 px-4 py-2 rounded-[5px] text-sm font-sans cursor-pointer"
                            >
                              <Play size={14} />
                              开始分析
                            </button>
                          )}
                          {!workflowRunning && (
                            <button
                              onClick={handleResetWorkflow}
                              className="ghost-btn flex items-center gap-1.5 px-3 py-2 rounded-[5px] text-xs font-sans cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              重置
                            </button>
                          )}
                          {workflowRunning && (
                            <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-sans">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-t-transparent rounded-full border-[var(--accent)]"
                              />
                              执行中...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step Outputs */}
                  {stepOutputs.length > 0 && (
                    <div className="flex-shrink-0">
                      {renderStepOutputs()}
                    </div>
                  )}

                  {/* Workflow Chat Tab */}
                  {(workflowComplete || stepOutputs.length > 0) && (
                    <div className="card flex-1 min-h-[300px] flex flex-col">
                      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[#EAEAEA] flex-shrink-0">
                        <Bot size={16} className="text-[var(--accent)]" />
                        <h3 className="font-sans font-semibold text-[#111111] text-sm">对话</h3>
                        <span className="text-[10px] text-[#999999] font-sans">
                          选择 Agent 继续探讨结果
                        </span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                          {AGENTS.map((agent) => (
                            <button
                              key={agent.id}
                              onClick={() => setWorkflowChatAgent(agent.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer whitespace-nowrap
                                ${workflowChatAgent === agent.id
                                  ? 'badge-blue'
                                  : 'bg-white border border-[#EAEAEA] text-[#999999] hover:text-[#666666]'
                                }`}
                            >
                              <span className="text-xs">{agent.avatar}</span>
                              {agent.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chat messages */}
                      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
                        {workflowChatMessages.length === 0 && (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-[#999999] font-sans">
                              选择一个 Agent，对工作流结果继续提问
                            </p>
                          </div>
                        )}
                        <AnimatePresence initial={false}>
                          {workflowChatMessages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <div
                                className="w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0"
                                style={
                                  msg.role === 'assistant'
                                    ? { backgroundColor: '#EEF4FF' }
                                    : { backgroundColor: '#EEF4FF' }
                                }
                              >
                                {msg.role === 'assistant' ? (
                                  <span className="text-sm">{getAgent(msg.agentId)?.avatar || '🤖'}</span>
                                ) : (
                                  <User size={14} className="text-[var(--accent)]" />
                                )}
                              </div>
                              <div
                                className={`max-w-[80%] px-3.5 py-2.5 rounded-[6px] text-sm font-sans leading-relaxed
                                  ${msg.role === 'assistant'
                                    ? 'bg-[#f9f9f9] border border-[#EAEAEA] text-[#111111] rounded-tl-sm'
                                    : 'bg-[#EEF4FF] border border-blue-100 text-[#111111] rounded-tr-sm whitespace-pre-wrap'
                                  }`}
                              >
                                {msg.role === 'assistant' ? (
                                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                ) : (
                                  msg.content
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {workflowChatTyping && (
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0 bg-[#EEF4FF]">
                              <span className="text-sm">{getAgent(workflowChatAgent)?.avatar || '🤖'}</span>
                            </div>
                            <div className="px-3.5 py-2.5 rounded-[6px] rounded-tl-sm bg-[#f9f9f9] border border-[#EAEAEA]">
                              <div className="flex gap-1.5 items-center h-4">
                                {[0, 150, 300].map((delay) => (
                                  <span
                                    key={delay}
                                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                                    style={{
                                      backgroundColor: '#2383E2',
                                      animationDelay: `${delay}ms`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={workflowChatEndRef} />
                      </div>

                      {/* Input */}
                      <div className="px-4 pb-4 pt-2 flex-shrink-0">
                        <div className="flex items-end gap-2 bg-white border border-[#EAEAEA] rounded-[6px] px-4 py-2 focus-within:border-[#2383E2] focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300">
                          <textarea
                            value={workflowChatInput}
                            onChange={(e) => {
                              setWorkflowChatInput(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = Math.min(e.target.scrollHeight, 3 * 24) + 'px';
                            }}
                            onKeyDown={handleWorkflowChatKeyDown}
                            placeholder={`向 ${getAgent(workflowChatAgent)?.name || 'Agent'} 提问...`}
                            rows={1}
                            className="flex-1 bg-transparent text-sm font-sans text-[#111111] placeholder-gray-400 outline-none resize-none leading-6"
                            style={{ maxHeight: '72px' }}
                            disabled={workflowChatTyping}
                          />
                          <button
                            onClick={handleWorkflowChatSend}
                            disabled={!workflowChatInput.trim() || workflowChatTyping}
                            className="accent-btn w-8 h-8 rounded-[5px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ======== TAB 2: 模型配置 ======== */
          <motion.div
            key="model"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto min-h-0 space-y-4"
          >
            {/* Provider cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(DEFAULT_PROVIDERS) as ModelProvider[]).map((key) => {
                const config = modelSettings.providers[key];
                const isEnabled = config.enabled;
                const hasApiKey = !!config.apiKey;
                const statusText = isEnabled && (hasApiKey || config.provider === 'ollama')
                  ? '已连接'
                  : '未配置';
                const statusColor = isEnabled && (hasApiKey || config.provider === 'ollama')
                  ? '#10b981'
                  : '#f59e0b';

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-5 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-[var(--accent)]" />
                        <h3 className="font-sans font-semibold text-[#111111] text-sm">
                          {config.name}
                        </h3>
                      </div>
                      <span
                        className={`badge ${statusColor === '#10b981' ? 'badge-green' : 'badge-yellow'}`}
                      >
                        {statusText}
                      </span>
                    </div>

                    {/* Model name */}
                    <div>
                      <label className="text-[10px] text-[#999999] font-sans block mb-1">模型名称</label>
                      <input
                        type="text"
                        value={config.model}
                        onChange={(e) => handleProviderChange(key, 'model', e.target.value)}
                        placeholder="模型名称"
                        className="w-full bg-white border border-[#EAEAEA] rounded-[5px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-gray-400 outline-none focus:border-[#2383E2] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    {/* Base URL */}
                    <div>
                      <label className="text-[10px] text-[#999999] font-sans block mb-1">Base URL</label>
                      <input
                        type="text"
                        value={config.baseUrl}
                        onChange={(e) => handleProviderChange(key, 'baseUrl', e.target.value)}
                        placeholder="API 端点地址"
                        className="w-full bg-white border border-[#EAEAEA] rounded-[5px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-gray-400 outline-none focus:border-[#2383E2] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="text-[10px] text-[#999999] font-sans block mb-1">API Key</label>
                      <input
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => handleProviderChange(key, 'apiKey', e.target.value)}
                        placeholder="输入 API Key"
                        className="w-full bg-white border border-[#EAEAEA] rounded-[5px] px-3 py-2 text-xs font-sans text-[#111111] placeholder-gray-400 outline-none focus:border-[#2383E2] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="text-[10px] text-[#999999] font-sans block mb-1">
                        Temperature: {config.temperature.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => handleProviderChange(key, 'temperature', parseFloat(e.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                      <div className="flex justify-between text-[9px] text-[#999999]">
                        <span>精确 0</span>
                        <span>创意 2</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className="text-[10px] text-[#999999] font-sans block mb-1">Max Tokens</label>
                      <input
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) => handleProviderChange(key, 'maxTokens', parseInt(e.target.value) || 2048)}
                        className="w-full bg-white border border-[#EAEAEA] rounded-[5px] px-3 py-2 text-xs font-sans text-[#111111] outline-none focus:border-[#2383E2] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    {/* Top P */}
                    <div>
                      <label className="text-[10px] text-[#999999] font-sans block mb-1">
                        Top P: {config.topP.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.topP}
                        onChange={(e) => handleProviderChange(key, 'topP', parseFloat(e.target.value))}
                        className="w-full accent-[var(--accent)]"
                      />
                    </div>

                    {/* Enable toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#EAEAEA]">
                      <span className="text-[11px] text-[#999999] font-sans">启用此提供者</span>
                      <button
                        onClick={() => handleProviderChange(key, 'enabled', !config.enabled)}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
                          ${config.enabled ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}
                      >
                        <motion.div
                          animate={{ x: config.enabled ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Global settings */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5 space-y-4"
            >
              <h3 className="font-sans font-semibold text-[#111111] text-sm flex items-center gap-2">
                <Settings size={16} className="text-[var(--accent)]" />
                全局设置
              </h3>

              {/* Token usage */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#999999] font-sans">Token 用量显示</span>
                  <span className="text-[11px] text-[#999999] font-sans">
                    {modelSettings.tokenUsed.toLocaleString()} / {modelSettings.tokenBudget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    animate={{
                      width: `${Math.min((modelSettings.tokenUsed / modelSettings.tokenBudget) * 100, 100)}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Enable Cache toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[var(--accent)]" />
                  <span className="text-xs text-[#999999] font-sans">开启响应缓存</span>
                </div>
                <button
                  onClick={() => handleSettingsChange('enableCache', !modelSettings.enableCache)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
                    ${modelSettings.enableCache ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}
                >
                  <motion.div
                    animate={{ x: modelSettings.enableCache ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              {/* Enable Compression toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-[var(--warning)]" />
                  <span className="text-xs text-[#999999] font-sans">开启 Prompt 压缩</span>
                </div>
                <button
                  onClick={() => handleSettingsChange('enableCompression', !modelSettings.enableCompression)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
                    ${modelSettings.enableCompression ? 'bg-[var(--accent)]' : 'bg-gray-300'}`}
                >
                  <motion.div
                    animate={{ x: modelSettings.enableCompression ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2 border-t border-[#EAEAEA]">
                <button
                  onClick={handleSaveSettings}
                  className="accent-btn flex items-center gap-2 px-4 py-2 rounded-[5px] text-sm font-sans cursor-pointer"
                >
                  <Check size={14} />
                  保存配置
                </button>
                <button
                  onClick={handleClearCache}
                  className="ghost-btn flex items-center gap-2 px-4 py-2 rounded-[5px] text-sm font-sans cursor-pointer"
                >
                  <RotateCcw size={14} />
                  清除缓存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  Simple Markdown Renderer                                           */
/* ================================================================== */

function renderMarkdown(text: string): string {
  let html = text;

  // Escape HTML entities
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code backticks
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background:var(--bg-tertiary);color:var(--accent);padding:1px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>',
  );

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // List processing
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^[ \t]*[-•]\s/.test(line)) {
      if (!inUl) {
        processedLines.push('<ul style="padding-left:1.2em;margin:0.3em 0;list-style:disc">');
        inUl = true;
      }
      const content = line.replace(/^[ \t]*[-•]\s/, '');
      processedLines.push(`<li style="margin:0.15em 0">${content}</li>`);
      continue;
    }

    if (/^[ \t]*\d+\.\s/.test(line)) {
      if (!inOl) {
        processedLines.push('<ol style="padding-left:1.2em;margin:0.3em 0;list-style:decimal">');
        inOl = true;
      }
      const content = line.replace(/^[ \t]*\d+\.\s/, '');
      processedLines.push(`<li style="margin:0.15em 0">${content}</li>`);
      continue;
    }

    if (inUl) {
      processedLines.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      processedLines.push('</ol>');
      inOl = false;
    }

    processedLines.push(line);
  }

  if (inUl) processedLines.push('</ul>');
  if (inOl) processedLines.push('</ol>');

  html = processedLines.join('\n');
  html = html.replace(/\n/g, '<br/>');

  return html;
}
