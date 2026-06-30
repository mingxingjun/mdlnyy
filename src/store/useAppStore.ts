import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentMessage, AgentSession, LearningState } from '@/lib/agents/types';

/* ═══════════════════════════════════════════════════════
   领域模型类型（期末复习模式 MVP）
   ═══════════════════════════════════════════════════════ */

export interface StudyMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'word' | 'ppt' | 'text' | 'markdown';
  /** 资料用途：知识点拆解 / 题库导入 / 自动识别 */
  kind: 'knowledge' | 'bank' | 'auto';
  size: number;
  uploadedAt: number;
  parsedText?: string;       // raw extracted text
  status: 'pending' | 'parsing' | 'parsed' | 'failed';
}

export interface KnowledgePoint {
  id: string;
  materialId: string;
  name: string;
  description: string;
  priority: number;          // 1-5
  mastery: number;           // 0-1, updated by wrongbook agent
  relatedIds: string[];      // prerequisite/related knowledge points
  tags: string[];
  createdAt: number;
}

export interface Question {
  id: string;
  materialId: string;
  knowledgePointIds: string[];
  type: 'choice' | 'fill' | 'short' | 'calculation';
  difficulty: 1 | 2 | 3 | 4 | 5;
  stem: string;
  options?: string[];        // for choice questions
  answer: string;
  explanation: string;
  /** 题目来源：bank=题库原题（有标准答案），ai=AI 现场生成 */
  source: 'bank' | 'ai';
  /** 当 source=bank 时，关联的题库资料 id（等同 materialId，单独留存便于筛选） */
  bankId?: string;
  /** 该题库题是否由 AI 补答（原题无标准答案） */
  aiFilled?: boolean;
  createdAt: number;
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answeredAt: number;
  timeSpentMs: number;
}

export interface WrongQuestion {
  id: string;
  questionId: string;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  knowledgePointIds: string[];
  tags: string[];
  explanationStyle?: 'concise' | 'detailed' | 'feynman' | 'socratic';
  stepBreakdown?: string;    // from explanation agent
  createdAt: number;
  reviewedAt?: number;
  reviewCount: number;
  isResolved: boolean;
}

export interface MemoryCard {
  id: string;
  knowledgePointId: string;
  front: string;
  back: string;
  // SM-2 spaced repetition fields
  easeFactor: number;        // default 2.5
  interval: number;          // days
  repetitions: number;
  nextReviewDate: string;    // ISO date
  lastReviewedAt?: number;
  isMastered: boolean;
  createdAt: number;
}

export interface StudyProgress {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  streakDays: number;
  lastStudyDate: string;     // ISO date
  studyMinutesToday: number;
  weakPointIds: string[];    // knowledge point ids with mastery < 0.6
  reviewedCardCount: number;
  lastReportAt?: number;
}

export interface ReviewPlanItem {
  date: string;
  knowledgePointIds: string[];
  taskType: 'review' | 'practice' | 'mock_exam';
  durationMinutes: number;
  priority: number;
  completed: boolean;
}

export interface ReviewPlan {
  items: ReviewPlanItem[];
  rationale: string;
  totalMinutes: number;
  examDate?: string;
  createdAt: number;
}

/* ═══════════════════════════════════════════════════════
   AppState
   ═══════════════════════════════════════════════════════ */

interface AppState {
  currentUser: string | null;
  setCurrentUser: (name: string | null) => void;

  /** 学习状态机：Orchestrator 路由决策依据 */
  learningState: LearningState;
  setLearningState: (state: LearningState) => void;

  materials: StudyMaterial[];
  addMaterial: (m: StudyMaterial) => void;
  updateMaterial: (id: string, updates: Partial<Omit<StudyMaterial, 'id'>>) => void;
  removeMaterial: (id: string) => void;
  /** 删除整套资料及其关联的所有题目与知识点（题库管理"删除整套"用） */
  removeMaterialAndQuestions: (id: string) => void;

  knowledgePoints: KnowledgePoint[];
  addKnowledgePoints: (points: KnowledgePoint[]) => void;
  updateKnowledgePointMastery: (id: string, mastery: number) => void;
  removeKnowledgePointsByMaterial: (materialId: string) => void;

  questions: Question[];
  addQuestions: (qs: Question[]) => void;
  /** 新增单道题目（题库管理手动添加） */
  addQuestion: (q: Question) => void;
  /** 更新指定题目（题库管理编辑） */
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id'>>) => void;
  /** 删除指定题目（题库管理删除） */
  deleteQuestion: (id: string) => void;
  removeQuestionsByMaterial: (materialId: string) => void;
  /** 用新题替换指定 materialId 下的所有题目（题库重新导入时使用） */
  replaceQuestionsByMaterial: (materialId: string, qs: Question[]) => void;

  answerRecords: AnswerRecord[];
  addAnswerRecord: (record: AnswerRecord) => void;

  wrongQuestions: WrongQuestion[];
  addWrongQuestion: (wq: WrongQuestion) => void;
  updateWrongQuestion: (id: string, updates: Partial<Omit<WrongQuestion, 'id'>>) => void;
  markWrongResolved: (id: string) => void;
  incrementWrongReview: (id: string) => void;

  memoryCards: MemoryCard[];
  addMemoryCards: (cards: MemoryCard[]) => void;
  reviewMemoryCard: (id: string, isCorrect: boolean) => void;
  removeMemoryCard: (id: string) => void;

  studyProgress: StudyProgress;
  updateStudyProgress: (updates: Partial<StudyProgress>) => void;
  incrementQuestions: (correct: boolean) => void;
  addStudyMinutes: (mins: number) => void;

  reviewPlan: ReviewPlan | null;
  setReviewPlan: (plan: ReviewPlan) => void;
  togglePlanItemCompleted: (date: string, index: number) => void;

  agentSessions: AgentSession[];
  addAgentMessage: (sessionId: string, message: AgentMessage) => void;
  createAgentSession: (agentId: string) => string;
  clearAgentSession: (sessionId: string) => void;

  /** 单页视图切换：工作台 / 出题 / 错题本 / 记忆卡片 / 督学 / 题库管理 */
  activeView: 'dashboard' | 'practice' | 'wrongbook' | 'memory' | 'supervisor' | 'questionbank';
  setActiveView: (view: 'dashboard' | 'practice' | 'wrongbook' | 'memory' | 'supervisor' | 'questionbank') => void;

  /** 清除所有持久化数据（重置到初始状态）。直接移除 localStorage 项，规避 persist 中间件竞态导致的水合回填。 */
  clearAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (name) => set({ currentUser: name }),

      learningState: 'Onboarded',
      setLearningState: (learningState) => set({ learningState }),

      materials: [],
      addMaterial: (m) => set((state) => ({ materials: [...state.materials, m] })),
      updateMaterial: (id, updates) => set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      })),
      removeMaterial: (id) => set((state) => ({
        materials: state.materials.filter((m) => m.id !== id),
      })),
      removeMaterialAndQuestions: (id) => set((state) => ({
        materials: state.materials.filter((m) => m.id !== id),
        questions: state.questions.filter((q) => q.materialId !== id),
        knowledgePoints: state.knowledgePoints.filter((kp) => kp.materialId !== id),
      })),

      knowledgePoints: [],
      addKnowledgePoints: (points) => set((state) => ({
        knowledgePoints: [...state.knowledgePoints, ...points],
      })),
      updateKnowledgePointMastery: (id, mastery) => set((state) => ({
        knowledgePoints: state.knowledgePoints.map((kp) =>
          kp.id === id ? { ...kp, mastery } : kp
        ),
      })),
      removeKnowledgePointsByMaterial: (materialId) => set((state) => ({
        knowledgePoints: state.knowledgePoints.filter((kp) => kp.materialId !== materialId),
      })),

      questions: [],
      addQuestions: (qs) => set((state) => ({ questions: [...state.questions, ...qs] })),
      addQuestion: (q) => set((state) => ({ questions: [...state.questions, q] })),
      updateQuestion: (id, updates) => set((state) => ({
        questions: state.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      })),
      deleteQuestion: (id) => set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
      })),
      removeQuestionsByMaterial: (materialId) => set((state) => ({
        questions: state.questions.filter((q) => q.materialId !== materialId),
      })),
      replaceQuestionsByMaterial: (materialId, qs) => set((state) => ({
        questions: [...state.questions.filter((q) => q.materialId !== materialId), ...qs],
      })),

      answerRecords: [],
      addAnswerRecord: (record) => set((state) => ({
        answerRecords: [...state.answerRecords, record],
      })),

      wrongQuestions: [],
      addWrongQuestion: (wq) => set((state) => ({
        wrongQuestions: [...state.wrongQuestions, wq],
      })),
      updateWrongQuestion: (id, updates) => set((state) => ({
        wrongQuestions: state.wrongQuestions.map((wq) =>
          wq.id === id ? { ...wq, ...updates } : wq
        ),
      })),
      markWrongResolved: (id) => set((state) => ({
        wrongQuestions: state.wrongQuestions.map((wq) =>
          wq.id === id ? { ...wq, isResolved: true, reviewedAt: Date.now() } : wq
        ),
      })),
      incrementWrongReview: (id) => set((state) => ({
        wrongQuestions: state.wrongQuestions.map((wq) =>
          wq.id === id
            ? { ...wq, reviewCount: wq.reviewCount + 1, reviewedAt: Date.now() }
            : wq
        ),
      })),

      memoryCards: [],
      addMemoryCards: (cards) => set((state) => ({
        memoryCards: [...state.memoryCards, ...cards],
      })),
      reviewMemoryCard: (id, isCorrect) => set((state) => ({
        memoryCards: state.memoryCards.map((c) => {
          if (c.id !== id) return c;
          let { easeFactor, interval, repetitions } = c;
          if (isCorrect) {
            if (repetitions === 0) interval = 1;
            else if (repetitions === 1) interval = 6;
            else interval = Math.round(interval * easeFactor);
            repetitions += 1;
          } else {
            repetitions = 0;
            interval = 1;
          }
          easeFactor = Math.max(1.3, easeFactor + (0.1 - (isCorrect ? 0 : 3) * (0.08 + (isCorrect ? 0 : 3) * 0.02)));
          const next = new Date();
          next.setDate(next.getDate() + interval);
          return {
            ...c,
            easeFactor,
            interval,
            repetitions,
            nextReviewDate: next.toISOString().slice(0, 10),
            lastReviewedAt: Date.now(),
            isMastered: repetitions >= 3 && easeFactor >= 2.5,
          };
        }),
      })),
      removeMemoryCard: (id) => set((state) => ({
        memoryCards: state.memoryCards.filter((c) => c.id !== id),
      })),

      studyProgress: {
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        streakDays: 0,
        lastStudyDate: '',
        studyMinutesToday: 0,
        weakPointIds: [],
        reviewedCardCount: 0,
      },
      updateStudyProgress: (updates) => set((state) => ({
        studyProgress: { ...state.studyProgress, ...updates },
      })),
      incrementQuestions: (correct) => set((state) => ({
        studyProgress: {
          ...state.studyProgress,
          totalQuestions: state.studyProgress.totalQuestions + 1,
          correctCount: state.studyProgress.correctCount + (correct ? 1 : 0),
          wrongCount: state.studyProgress.wrongCount + (correct ? 0 : 1),
        },
      })),
      addStudyMinutes: (mins) => set((state) => ({
        studyProgress: {
          ...state.studyProgress,
          studyMinutesToday: state.studyProgress.studyMinutesToday + mins,
        },
      })),

      reviewPlan: null,
      setReviewPlan: (plan) => set({ reviewPlan: plan }),
      togglePlanItemCompleted: (date, index) => set((state) => {
        if (!state.reviewPlan) return state;
        return {
          reviewPlan: {
            ...state.reviewPlan,
            items: state.reviewPlan.items.map((item, i) =>
              item.date === date && i === index
                ? { ...item, completed: !item.completed }
                : item
            ),
          },
        };
      }),

      agentSessions: [],
      createAgentSession: (agentId) => {
        const id = crypto.randomUUID();
        set((state) => ({
          agentSessions: [...state.agentSessions, { id, agentId, messages: [], tasks: [], createdAt: Date.now() }],
        }));
        return id;
      },
      addAgentMessage: (sessionId, message) =>
        set((state) => ({
          agentSessions: state.agentSessions.map((s) =>
            s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
          ),
        })),
      clearAgentSession: (sessionId) =>
        set((state) => ({
          agentSessions: state.agentSessions.filter((s) => s.id !== sessionId),
        })),

      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view }),

      clearAllData: () => {
        // 直接移除 localStorage 持久化项，规避 zustand persist 中间件在 set 后异步重新水合导致数据回填的竞态。
        try {
          localStorage.removeItem('uniflow-storage');
        } catch {
          // 忽略 localStorage 不可用情况
        }
        // 重置内存状态到初始值
        set({
          currentUser: null,
          learningState: 'Onboarded',
          materials: [],
          knowledgePoints: [],
          questions: [],
          answerRecords: [],
          wrongQuestions: [],
          memoryCards: [],
          studyProgress: {
            totalQuestions: 0,
            correctCount: 0,
            wrongCount: 0,
            streakDays: 0,
            lastStudyDate: '',
            studyMinutesToday: 0,
            weakPointIds: [],
            reviewedCardCount: 0,
          },
          reviewPlan: null,
          agentSessions: [],
          activeView: 'dashboard',
        });
      },
    }),
    {
      name: 'uniflow-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        learningState: state.learningState,
        materials: state.materials,
        knowledgePoints: state.knowledgePoints,
        questions: state.questions,
        answerRecords: state.answerRecords,
        wrongQuestions: state.wrongQuestions,
        memoryCards: state.memoryCards,
        studyProgress: state.studyProgress,
        reviewPlan: state.reviewPlan,
        agentSessions: state.agentSessions,
        activeView: state.activeView,
      }),
    }
  )
);
