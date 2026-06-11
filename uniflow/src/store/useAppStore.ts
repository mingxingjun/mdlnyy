import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Subject {
  id: string;
  name: string;
  examDate: string;
  progress: number;
  color: string;
  icon: string;
}

export interface FlashCard {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface KnowledgePoint {
  id: string;
  subjectId: string;
  name: string;
  mastery: number;
}

export interface Material {
  id: string;
  title: string;
  type: 'exam' | 'notes' | 'cheatsheet';
  university: string;
  college: string;
  major: string;
  professor: string;
  rating: number;
  downloads: number;
  credits: number;
  tags: string[];
  description: string;
}

export interface PomodoroSession {
  id: string;
  startTime: string;
  duration: number;
  subjectId: string;
  completed: boolean;
}

export type WhiteNoiseType = 'rain' | 'library' | 'cafe' | 'bass' | 'forest' | 'fire';

export interface StudyRoom {
  id: string;
  name: string;
  members: number;
  maxMembers: number;
  isActive: boolean;
}

export interface Note {
  id: string;
  title: string;
  subjectId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  subjects: Subject[];
  flashCards: FlashCard[];
  knowledgePoints: KnowledgePoint[];
  materials: Material[];
  pomodoroSessions: PomodoroSession[];
  activeWhiteNoise: WhiteNoiseType[];
  studyRooms: StudyRoom[];
  joinedRooms: string[];
  todayFlowMinutes: number;
  weeklyFlowData: { day: string; minutes: number }[];
  notes: Note[];

  addSubject: (subject: Subject) => void;
  removeSubject: (id: string) => void;
  updateSubjectProgress: (id: string, progress: number) => void;

  toggleFlashCard: (id: string) => void;
  setFlashCardMastered: (id: string, mastered: boolean) => void;

  toggleWhiteNoise: (noise: WhiteNoiseType) => void;

  addPomodoroSession: (session: PomodoroSession) => void;

  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  removeNote: (id: string) => void;

  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

// 自习室是公共房间，不属于用户数据，保留默认值
const defaultStudyRooms: StudyRoom[] = [
  { id: '1', name: '深夜高数突击营', members: 23, maxMembers: 50, isActive: true },
  { id: '2', name: '线代满分冲刺', members: 15, maxMembers: 30, isActive: true },
  { id: '3', name: '大物不挂科联盟', members: 42, maxMembers: 50, isActive: true },
  { id: '4', name: '数据结构刷题房', members: 8, maxMembers: 20, isActive: true },
  { id: '5', name: '概率论互助小组', members: 19, maxMembers: 30, isActive: true },
  { id: '6', name: '佛系复习室', members: 31, maxMembers: 50, isActive: true },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 用户数据：首次使用为空，引导用户自己添加
      subjects: [],
      flashCards: [],
      knowledgePoints: [],
      materials: [],
      pomodoroSessions: [],
      notes: [],

      activeWhiteNoise: [],
      joinedRooms: [],
      todayFlowMinutes: 0,
      weeklyFlowData: [],

      // 公共数据：非用户私有
      studyRooms: defaultStudyRooms,

      addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
      removeSubject: (id) => set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),
      updateSubjectProgress: (id, progress) => set((state) => ({
        subjects: state.subjects.map((s) => (s.id === id ? { ...s, progress } : s)),
      })),

      toggleFlashCard: (id) => set((state) => ({
        flashCards: state.flashCards.map((c) => (c.id === id ? { ...c, mastered: !c.mastered } : c)),
      })),
      setFlashCardMastered: (id, mastered) => set((state) => ({
        flashCards: state.flashCards.map((c) => (c.id === id ? { ...c, mastered } : c)),
      })),

      toggleWhiteNoise: (noise) => set((state) => ({
        activeWhiteNoise: state.activeWhiteNoise.includes(noise)
          ? state.activeWhiteNoise.filter((n) => n !== noise)
          : [...state.activeWhiteNoise, noise],
      })),

      addPomodoroSession: (session) => set((state) => ({
        pomodoroSessions: [...state.pomodoroSessions, session],
      })),

      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)),
      })),
      removeNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),

      joinRoom: (roomId) => set((state) => ({
        joinedRooms: state.joinedRooms.includes(roomId)
          ? state.joinedRooms
          : [...state.joinedRooms, roomId],
        studyRooms: state.studyRooms.map((r) =>
          r.id === roomId ? { ...r, members: r.members + 1 } : r
        ),
      })),
      leaveRoom: (roomId) => set((state) => ({
        joinedRooms: state.joinedRooms.filter((id) => id !== roomId),
        studyRooms: state.studyRooms.map((r) =>
          r.id === roomId ? { ...r, members: Math.max(0, r.members - 1) } : r
        ),
      })),
    }),
    {
      name: 'uniflow-storage',
      partialize: (state) => ({
        subjects: state.subjects,
        flashCards: state.flashCards,
        knowledgePoints: state.knowledgePoints,
        pomodoroSessions: state.pomodoroSessions,
        notes: state.notes,
        joinedRooms: state.joinedRooms,
        todayFlowMinutes: state.todayFlowMinutes,
      }),
    }
  )
);
