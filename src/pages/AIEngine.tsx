import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Trash2,
  Settings,
  Zap,
  Cpu,
  RotateCcw,
  Check,
  AlertCircle,
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

interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

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

  /* ─── Agent State ─── */
  const [selectedAgentId, setSelectedAgentId] = useState<string>('knowledge-extractor');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  /* ─── Chat Submit ─── */
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isTyping || !selectedAgent) return;

    const userText = chatInput.trim();
    setChatInput('');

    // Get or create session
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createAgentSession(selectedAgentId);
      setActiveSessionId(sessionId);
    }

    // Build prompt
    let fullInput = userText;
    if (selectedSkill) {
      const skillPrompt = getAgentSkillPrompt(selectedAgentId, selectedSkill);
      fullInput = skillPrompt + '\n\n' + userText;
    }
    const prompt = compressPrompt(selectedAgent, fullInput);

    // Add user message
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

      // Update token usage in settings
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
    addToast('success', '模型配置已保存');
  }, [modelSettings, addToast]);

  const handleClearCache = useCallback(() => {
    clearModelCache();
    addToast('info', '缓存已清除');
  }, [addToast]);

  /* ─── Messages for display ─── */
  const displayMessages: AgentMessage[] = (() => {
    if (!latestSession) return [];

    // Add welcome message if session is empty
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

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-neon-purple">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">AI 引擎</h1>
            <p className="text-xs text-zinc-500 font-body">多智能体控制台 · 模型配置</p>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 flex-shrink-0 bg-dark-800/60 rounded-xl p-1 border border-white/5">
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-body transition-all duration-200 cursor-pointer
            ${activeTab === 'agent'
              ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
              : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <Bot size={16} />
          Agent 控制台
        </button>
        <button
          onClick={() => setActiveTab('model')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-body transition-all duration-200 cursor-pointer
            ${activeTab === 'model'
              ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
              : 'text-zinc-500 hover:text-zinc-300'
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
            className="flex-1 flex gap-4 min-h-0 overflow-hidden"
          >
            {/* ======== LEFT SIDEBAR: Agent Selection ======== */}
            <div className="w-[280px] flex-shrink-0 glass-card overflow-y-auto p-4 flex flex-col gap-3">
              <h2 className="text-sm font-display font-semibold text-zinc-400 flex items-center gap-2">
                <Bot size={14} className="text-neon-purple" />
                AI Agent
              </h2>
              <p className="text-[10px] text-zinc-600 -mt-1">选择一个 Agent 开始对话</p>

              {AGENTS.map((agent) => {
                const isActive = selectedAgentId === agent.id;
                return (
                  <motion.button
                    key={agent.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer
                      ${isActive
                        ? 'border-opacity-50 bg-opacity-10 shadow-lg'
                        : 'border-white/5 bg-dark-700/50 hover:bg-dark-600/50 hover:border-white/10'
                      }`}
                    style={
                      isActive
                        ? {
                            borderColor: `${agent.color}60`,
                            backgroundColor: `${agent.color}10`,
                            boxShadow: `0 0 20px ${agent.color}20`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agent.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-semibold text-white truncate">
                          {agent.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-body truncate">
                          {agent.role}
                        </p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: agent.color }}
                      />
                    </div>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[11px] text-zinc-400 font-body mt-2 leading-relaxed"
                      >
                        {agent.description}
                      </motion.p>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* ======== MAIN CHAT AREA ======== */}
            <div className="flex-1 glass-card flex flex-col min-h-0 overflow-hidden">
              {/* Agent info bar */}
              {selectedAgent && (
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/5 flex-shrink-0">
                  <span className="text-xl">{selectedAgent.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-semibold text-white text-sm">
                        {selectedAgent.name}
                      </h2>
                      <span
                        className="text-[10px] font-body px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${selectedAgent.color}15`,
                          color: selectedAgent.color,
                          border: `1px solid ${selectedAgent.color}30`,
                        }}
                      >
                        {selectedAgent.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-body mt-0.5 line-clamp-1">
                      {selectedAgent.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestSession && latestSession.messages.length > 0 && (
                      <button
                        onClick={handleClearSession}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        清除对话
                      </button>
                    )}
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-body">在线</span>
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
                        /* System message: centered muted */
                        <div className="w-full flex justify-center">
                          <div className="max-w-[80%] px-4 py-2 rounded-xl bg-dark-600/30 border border-white/5 text-[11px] text-zinc-500 font-body text-center">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                              ${msg.role === 'assistant'
                                ? 'shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                                : 'shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                              }`}
                            style={
                              msg.role === 'assistant' && selectedAgent
                                ? {
                                    backgroundColor: `${selectedAgent.color}15`,
                                  }
                                : undefined
                            }
                          >
                            {msg.role === 'assistant' ? (
                              <span>{selectedAgent?.avatar || '🤖'}</span>
                            ) : (
                              <User size={16} className="text-neon-blue" />
                            )}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-body leading-relaxed
                              ${msg.role === 'assistant'
                                ? 'bg-dark-600/60 border border-white/5 text-zinc-300 rounded-tl-sm'
                                : 'bg-neon-blue/10 border border-neon-blue/20 text-zinc-200 rounded-tr-sm whitespace-pre-wrap'
                              }`}
                          >
                            {msg.role === 'assistant' ? (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: renderMarkdown(msg.content),
                                }}
                              />
                            ) : (
                              msg.content
                            )}
                            {msg.role === 'assistant' && msg.tokens && msg.tokens > 0 && (
                              <p className="text-[9px] text-zinc-600 mt-1">
                                {msg.tokens} tokens
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={
                        selectedAgent
                          ? {
                              backgroundColor: `${selectedAgent.color}15`,
                              boxShadow: `0 0 10px ${selectedAgent.color}20`,
                            }
                          : undefined
                      }
                    >
                      <span>{selectedAgent?.avatar || '🤖'}</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-dark-600/60 border border-white/5">
                      <div className="flex gap-1.5 items-center h-5">
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            backgroundColor: selectedAgent?.color || '#8b5cf6',
                            animationDelay: '0ms',
                          }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            backgroundColor: selectedAgent?.color || '#8b5cf6',
                            animationDelay: '150ms',
                          }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            backgroundColor: selectedAgent?.color || '#8b5cf6',
                            animationDelay: '300ms',
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Skill quick-select + Input area */}
              <div className="px-4 pb-4 pt-2 flex-shrink-0 space-y-2">
                {/* Skill buttons */}
                {selectedAgent && selectedAgent.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.skills.map((skill) => {
                      const isActive = selectedSkill === skill.name;
                      return (
                        <button
                          key={skill.name}
                          onClick={() =>
                            setSelectedSkill((prev) =>
                              prev === skill.name ? null : skill.name,
                            )
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-body transition-all duration-200 cursor-pointer
                            ${isActive
                              ? 'bg-neon-purple/15 border border-neon-purple/30 text-neon-purple shadow-[0_0_8px_rgba(139,92,246,0.15)]'
                              : 'bg-dark-600/40 border border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                            }`}
                        >
                          <span className="text-xs">{skill.icon}</span>
                          {skill.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input row */}
                <div className="flex items-end gap-2 bg-dark-700/60 border border-white/8 rounded-xl px-4 py-2 focus-within:border-neon-purple/40 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300">
                  <textarea
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 3 * 24) + 'px';
                    }}
                    onKeyDown={handleInputKeyDown}
                    placeholder="输入你的问题... (Shift+Enter 换行)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm font-body text-zinc-200 placeholder-zinc-600 outline-none resize-none leading-6"
                    style={{ maxHeight: '72px' }}
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="w-8 h-8 rounded-lg bg-neon-purple/15 flex items-center justify-center text-neon-purple hover:bg-neon-purple/25 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
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
                  ? '#00ff88'
                  : '#ffd600';

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-5 space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-neon-purple" />
                        <h3 className="font-display font-semibold text-white text-sm">
                          {config.name}
                        </h3>
                      </div>
                      <span
                        className="text-[10px] font-body px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                        }}
                      >
                        {statusText}
                      </span>
                    </div>

                    {/* Model name */}
                    <div>
                      <label className="text-[10px] text-zinc-500 font-body block mb-1">
                        模型名称
                      </label>
                      <input
                        type="text"
                        value={config.model}
                        onChange={(e) =>
                          handleProviderChange(key, 'model', e.target.value)
                        }
                        placeholder="模型名称"
                        className="w-full bg-dark-700/60 border border-white/8 rounded-lg px-3 py-2 text-xs font-body text-zinc-200 placeholder-zinc-600 outline-none focus:border-neon-purple/40 transition-all"
                      />
                    </div>

                    {/* Base URL */}
                    <div>
                      <label className="text-[10px] text-zinc-500 font-body block mb-1">
                        Base URL
                      </label>
                      <input
                        type="text"
                        value={config.baseUrl}
                        onChange={(e) =>
                          handleProviderChange(key, 'baseUrl', e.target.value)
                        }
                        placeholder="API 端点地址"
                        className="w-full bg-dark-700/60 border border-white/8 rounded-lg px-3 py-2 text-xs font-body text-zinc-200 placeholder-zinc-600 outline-none focus:border-neon-purple/40 transition-all"
                      />
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="text-[10px] text-zinc-500 font-body block mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={config.apiKey}
                        onChange={(e) =>
                          handleProviderChange(key, 'apiKey', e.target.value)
                        }
                        placeholder="输入 API Key"
                        className="w-full bg-dark-700/60 border border-white/8 rounded-lg px-3 py-2 text-xs font-body text-zinc-200 placeholder-zinc-600 outline-none focus:border-neon-purple/40 transition-all"
                      />
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="text-[10px] text-zinc-500 font-body block mb-1">
                        Temperature: {config.temperature.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) =>
                          handleProviderChange(
                            key,
                            'temperature',
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full accent-neon-purple"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-600">
                        <span>精确 0</span>
                        <span>创意 2</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className="text-[10px] text-zinc-500 font-body block mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) =>
                          handleProviderChange(
                            key,
                            'maxTokens',
                            parseInt(e.target.value) || 2048,
                          )
                        }
                        className="w-full bg-dark-700/60 border border-white/8 rounded-lg px-3 py-2 text-xs font-body text-zinc-200 outline-none focus:border-neon-purple/40 transition-all"
                      />
                    </div>

                    {/* Top P */}
                    <div>
                      <label className="text-[10px] text-zinc-500 font-body block mb-1">
                        Top P: {config.topP.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.topP}
                        onChange={(e) =>
                          handleProviderChange(
                            key,
                            'topP',
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full accent-neon-purple"
                      />
                    </div>

                    {/* Enable toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[11px] text-zinc-400 font-body">
                        启用此提供者
                      </span>
                      <button
                        onClick={() =>
                          handleProviderChange(key, 'enabled', !config.enabled)
                        }
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
                          ${config.enabled ? 'bg-neon-green/60' : 'bg-dark-500'}`}
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
              className="glass-card p-5 space-y-4"
            >
              <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                <Settings size={16} className="text-neon-purple" />
                全局设置
              </h3>

              {/* Token usage */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-body">Token 用量显示</span>
                  <span className="text-[11px] text-zinc-400 font-body">
                    {modelSettings.tokenUsed.toLocaleString()} /{' '}
                    {modelSettings.tokenBudget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neon-purple to-neon-blue rounded-full"
                    animate={{
                      width: `${Math.min(
                        (modelSettings.tokenUsed / modelSettings.tokenBudget) * 100,
                        100,
                      )}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Enable Cache toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-neon-blue" />
                  <span className="text-xs text-zinc-400 font-body">开启响应缓存</span>
                </div>
                <button
                  onClick={() =>
                    handleSettingsChange('enableCache', !modelSettings.enableCache)
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
                    ${modelSettings.enableCache ? 'bg-neon-green/60' : 'bg-dark-500'}`}
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
                  <AlertCircle size={14} className="text-neon-yellow" />
                  <span className="text-xs text-zinc-400 font-body">开启 Prompt 压缩</span>
                </div>
                <button
                  onClick={() =>
                    handleSettingsChange(
                      'enableCompression',
                      !modelSettings.enableCompression,
                    )
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer
                    ${modelSettings.enableCompression ? 'bg-neon-green/60' : 'bg-dark-500'}`}
                >
                  <motion.div
                    animate={{ x: modelSettings.enableCompression ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-body hover:bg-neon-green/15 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  保存配置
                </button>
                <button
                  onClick={handleClearCache}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-600/40 border border-white/5 text-zinc-400 text-sm font-body hover:bg-dark-600/60 hover:text-zinc-300 transition-all cursor-pointer"
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
    '<code style="background:rgba(139,92,246,0.15);color:#c4b5fd;padding:1px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>',
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
        processedLines.push(
          '<ul style="padding-left:1.2em;margin:0.3em 0;list-style:disc">',
        );
        inUl = true;
      }
      const content = line.replace(/^[ \t]*[-•]\s/, '');
      processedLines.push(`<li style="margin:0.15em 0">${content}</li>`);
      continue;
    }

    if (/^[ \t]*\d+\.\s/.test(line)) {
      if (!inOl) {
        processedLines.push(
          '<ol style="padding-left:1.2em;margin:0.3em 0;list-style:decimal">',
        );
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