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

const defaultSubjects: Subject[] = [
  { id: '1', name: '高等数学下', examDate: '2026-06-20', progress: 45, color: '#00d4ff', icon: 'calculator' },
  { id: '2', name: '大学物理', examDate: '2026-06-22', progress: 30, color: '#00ff88', icon: 'atom' },
  { id: '3', name: '线性代数', examDate: '2026-06-18', progress: 65, color: '#8b5cf6', icon: 'grid-3x3' },
  { id: '4', name: '数据结构', examDate: '2026-06-25', progress: 20, color: '#ff0080', icon: 'binary' },
  { id: '5', name: '概率论与数理统计', examDate: '2026-06-23', progress: 55, color: '#ffd600', icon: 'bar-chart-3' },
];

const defaultFlashCards: FlashCard[] = [
  { id: '1', subjectId: '1', front: '泰勒公式的本质是什么？', back: '用多项式逼近复杂函数，在展开点附近用导数信息构造近似表达式', mastered: false },
  { id: '2', subjectId: '1', front: '格林公式的几何意义？', back: '平面区域上的二重积分可以转化为其边界曲线上的曲线积分，体现了"内部"与"边界"的关系', mastered: false },
  { id: '3', subjectId: '1', front: '多元函数极值的充分条件？', back: 'AC-B²>0 且 A<0 为极大值，A>0 为极小值；AC-B²<0 为鞍点；AC-B²=0 无法判定', mastered: true },
  { id: '4', subjectId: '2', front: '麦克斯韦方程组的物理意义？', back: '描述电场和磁场的产生与相互关系：变化的磁场产生电场，变化的电场产生磁场', mastered: false },
  { id: '5', subjectId: '2', front: '热力学第二定律的表述？', back: '热量不能自发地从低温物体传到高温物体；孤立系统的熵永不减少', mastered: true },
  { id: '6', subjectId: '3', front: '矩阵可逆的充要条件？', back: '行列式不为零 / 满秩 / 特征值均不为零 / 行列向量线性无关', mastered: false },
  { id: '7', subjectId: '3', front: '特征值与特征向量的关系？', back: 'Ax=λx，特征向量是变换后方向不变的向量，特征值是伸缩比例', mastered: true },
  { id: '8', subjectId: '4', front: '时间复杂度 O(n log n) 的排序算法？', back: '归并排序、快速排序（平均）、堆排序', mastered: false },
  { id: '9', subjectId: '4', front: 'AVL 树和红黑树的区别？', back: 'AVL 严格平衡（高度差≤1），查找快但插入慢；红黑树近似平衡，插入删除更快', mastered: false },
  { id: '10', subjectId: '5', front: '大数定律的含义？', back: '当试验次数足够多时，事件发生的频率趋近于其概率', mastered: true },
  { id: '11', subjectId: '5', front: '中心极限定理的意义？', back: '大量独立同分布随机变量之和近似服从正态分布，无论原始分布如何', mastered: false },
  { id: '12', subjectId: '1', front: '斯托克斯公式联系了什么？', back: '空间曲线上的曲线积分与曲面上曲面积分的关系，是格林公式在三维的推广', mastered: false },
];

const defaultKnowledgePoints: KnowledgePoint[] = [
  { id: '1', subjectId: '1', name: '多元函数微分', mastery: 72 },
  { id: '2', subjectId: '1', name: '重积分', mastery: 45 },
  { id: '3', subjectId: '1', name: '曲线曲面积分', mastery: 30 },
  { id: '4', subjectId: '1', name: '级数', mastery: 58 },
  { id: '5', subjectId: '2', name: '力学', mastery: 65 },
  { id: '6', subjectId: '2', name: '电磁学', mastery: 35 },
  { id: '7', subjectId: '2', name: '热学', mastery: 80 },
  { id: '8', subjectId: '2', name: '光学', mastery: 42 },
  { id: '9', subjectId: '3', name: '行列式', mastery: 90 },
  { id: '10', subjectId: '3', name: '矩阵运算', mastery: 75 },
  { id: '11', subjectId: '3', name: '特征值', mastery: 60 },
  { id: '12', subjectId: '3', name: '二次型', mastery: 25 },
  { id: '13', subjectId: '4', name: '排序算法', mastery: 50 },
  { id: '14', subjectId: '4', name: '树与图', mastery: 38 },
  { id: '15', subjectId: '4', name: '动态规划', mastery: 20 },
  { id: '16', subjectId: '5', name: '概率基础', mastery: 70 },
  { id: '17', subjectId: '5', name: '随机变量', mastery: 55 },
  { id: '18', subjectId: '5', name: '参数估计', mastery: 40 },
];

const defaultNotes: Note[] = [
  { id: '1', title: '多元函数微分 - 重点笔记', subjectId: '1', content: '偏导数：对某个变量求导，其他变量视为常数\n全微分：dz = (∂z/∂x)dx + (∂z/∂y)dy\n方向导数：沿某方向的变化率，梯度方向最大\n极值：AC-B²判别法，条件极值用拉格朗日乘数法', tags: ['偏导数', '全微分', '极值'], createdAt: '2026-06-08T10:30:00', updatedAt: '2026-06-08T10:30:00' },
  { id: '2', title: '格林公式与曲线积分', subjectId: '1', content: '格林公式：∮Pdx+Qdy = ∬(∂Q/∂x - ∂P/∂y)dA\n路径无关条件：∂Q/∂x = ∂P/∂y\n应用：计算面积、简化曲线积分', tags: ['格林公式', '曲线积分', '路径无关'], createdAt: '2026-06-07T14:20:00', updatedAt: '2026-06-09T08:15:00' },
  { id: '3', title: '电磁学公式汇总', subjectId: '2', content: '库仑定律：F = kq₁q₂/r²\n高斯定理：∮E·dA = Q/ε₀\n安培环路定理：∮B·dl = μ₀I\n法拉第定律：ε = -dΦ/dt', tags: ['电磁学', '公式汇总', '麦克斯韦'], createdAt: '2026-06-06T09:00:00', updatedAt: '2026-06-06T09:00:00' },
  { id: '4', title: '矩阵运算速查表', subjectId: '3', content: '转置：(AB)ᵀ = BᵀAᵀ\n逆矩阵：(AB)⁻¹ = B⁻¹A⁻¹\n行列式：|AB| = |A||B|\n特征值：Ax = λx\n正交化：Gram-Schmidt过程', tags: ['矩阵', '特征值', '速查表'], createdAt: '2026-06-05T16:45:00', updatedAt: '2026-06-08T11:20:00' },
  { id: '5', title: '排序算法对比', subjectId: '4', content: '冒泡 O(n²) 稳定\n快排 O(nlogn) 平均 不稳定\n归并 O(nlogn) 稳定\n堆排 O(nlogn) 不稳定\n选择排序 O(n²) 不稳定', tags: ['排序', '时间复杂度', '算法对比'], createdAt: '2026-06-04T13:10:00', updatedAt: '2026-06-04T13:10:00' },
  { id: '6', title: '概率论核心公式', subjectId: '5', content: '贝叶斯：P(A|B) = P(B|A)P(A)/P(B)\n全概率：P(B) = ΣP(B|Ai)P(Ai)\n期望：E(X) = Σxi·pi\n方差：D(X) = E(X²) - [E(X)]²', tags: ['贝叶斯', '期望', '方差'], createdAt: '2026-06-03T20:30:00', updatedAt: '2026-06-07T15:00:00' },
  { id: '7', title: '级数判敛方法总结', subjectId: '1', content: '比值法：lim|aₙ₊₁/aₙ| < 1 收敛\n根值法：lim ⁿ√|aₙ| < 1 收敛\n比较法：与已知级数比较\n莱布尼茨判别法：交错级数', tags: ['级数', '判敛', '总结'], createdAt: '2026-06-02T11:00:00', updatedAt: '2026-06-02T11:00:00' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      subjects: defaultSubjects,

      flashCards: defaultFlashCards,

      knowledgePoints: defaultKnowledgePoints,

      materials: [],

      pomodoroSessions: [
        { id: '1', startTime: '2026-06-09T09:00:00', duration: 25, subjectId: '1', completed: true },
        { id: '2', startTime: '2026-06-09T09:30:00', duration: 25, subjectId: '1', completed: true },
        { id: '3', startTime: '2026-06-09T10:00:00', duration: 25, subjectId: '3', completed: true },
        { id: '4', startTime: '2026-06-09T14:00:00', duration: 25, subjectId: '2', completed: true },
        { id: '5', startTime: '2026-06-09T14:30:00', duration: 25, subjectId: '4', completed: true },
      ],

      activeWhiteNoise: [],

      studyRooms: [
        { id: '1', name: '深夜高数突击营', members: 23, maxMembers: 50, isActive: true },
        { id: '2', name: '线代满分冲刺', members: 15, maxMembers: 30, isActive: true },
        { id: '3', name: '大物不挂科联盟', members: 42, maxMembers: 50, isActive: true },
        { id: '4', name: '数据结构刷题房', members: 8, maxMembers: 20, isActive: true },
        { id: '5', name: '概率论互助小组', members: 19, maxMembers: 30, isActive: true },
        { id: '6', name: '佛系复习室', members: 31, maxMembers: 50, isActive: true },
      ],

      joinedRooms: [],

      todayFlowMinutes: 125,
      weeklyFlowData: [
        { day: '周一', minutes: 90 },
        { day: '周二', minutes: 120 },
        { day: '周三', minutes: 60 },
        { day: '周四', minutes: 150 },
        { day: '周五', minutes: 105 },
        { day: '周六', minutes: 180 },
        { day: '周日', minutes: 125 },
      ],

      notes: defaultNotes,

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
