import { create } from 'zustand';

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

interface AppState {
  subjects: Subject[];
  flashCards: FlashCard[];
  knowledgePoints: KnowledgePoint[];
  materials: Material[];
  pomodoroSessions: PomodoroSession[];
  activeWhiteNoise: WhiteNoiseType[];
  studyRooms: StudyRoom[];
  todayFlowMinutes: number;
  weeklyFlowData: { day: string; minutes: number }[];

  addSubject: (subject: Subject) => void;
  removeSubject: (id: string) => void;
  updateSubjectProgress: (id: string, progress: number) => void;

  toggleFlashCard: (id: string) => void;
  setFlashCardMastered: (id: string, mastered: boolean) => void;

  toggleWhiteNoise: (noise: WhiteNoiseType) => void;

  addPomodoroSession: (session: PomodoroSession) => void;
}

export const useAppStore = create<AppState>((set) => ({
  subjects: [
    { id: '1', name: '高等数学下', examDate: '2026-06-20', progress: 45, color: '#00d4ff', icon: 'calculator' },
    { id: '2', name: '大学物理', examDate: '2026-06-22', progress: 30, color: '#00ff88', icon: 'atom' },
    { id: '3', name: '线性代数', examDate: '2026-06-18', progress: 65, color: '#8b5cf6', icon: 'grid-3x3' },
    { id: '4', name: '数据结构', examDate: '2026-06-25', progress: 20, color: '#ff0080', icon: 'binary' },
    { id: '5', name: '概率论与数理统计', examDate: '2026-06-23', progress: 55, color: '#ffd600', icon: 'bar-chart-3' },
  ],

  flashCards: [
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
  ],

  knowledgePoints: [
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
  ],

  materials: [
    { id: '1', title: '高等数学下 期末真题集（2020-2025）', type: 'exam', university: '浙江大学', college: '数学学院', major: '工科试验班', professor: '王教授', rating: 4.9, downloads: 2341, credits: 5, tags: ['历年真题', '含答案'], description: '涵盖近6年期末考试真题，附详细解答过程' },
    { id: '2', title: '高数下 思维导图笔记', type: 'notes', university: '浙江大学', college: '数学学院', major: '工科试验班', professor: '王教授', rating: 4.7, downloads: 1856, credits: 3, tags: ['思维导图', '精简版'], description: '一页纸浓缩整学期核心考点，适合考前速览' },
    { id: '3', title: '大学物理 期末押题卷（3套）', type: 'exam', university: '浙江大学', college: '物理学院', major: '工科试验班', professor: '李教授', rating: 4.8, downloads: 3102, credits: 4, tags: ['押题卷', '模拟'], description: '根据历年出题规律预测，命中率极高' },
    { id: '4', title: '大物 实验报告满分模板', type: 'notes', university: '浙江大学', college: '物理学院', major: '工科试验班', professor: '李教授', rating: 4.5, downloads: 987, credits: 2, tags: ['实验报告', '模板'], description: '包含数据处理和误差分析的完整模板' },
    { id: '5', title: '线代 通关秘籍（手写版）', type: 'cheatsheet', university: '清华大学', college: '数学系', major: '计算机科学', professor: '张教授', rating: 4.9, downloads: 4521, credits: 3, tags: ['通关秘籍', '手写笔记'], description: '学长手写整理，覆盖所有考点和易错点' },
    { id: '6', title: '数据结构 算法模板大全', type: 'cheatsheet', university: '清华大学', college: '计算机系', major: '计算机科学', professor: '陈教授', rating: 4.8, downloads: 2876, credits: 4, tags: ['算法模板', '代码'], description: '常用数据结构和算法的代码模板，可直接套用' },
    { id: '7', title: '概率论 重点题型归纳', type: 'notes', university: '北京大学', college: '数学学院', major: '应用数学', professor: '赵教授', rating: 4.6, downloads: 1543, credits: 3, tags: ['题型归纳', '解题技巧'], description: '按题型分类整理，每类配有解题套路' },
    { id: '8', title: '高数下 历年真题解析视频笔记', type: 'notes', university: '浙江大学', college: '数学学院', major: '工科试验班', professor: '王教授', rating: 4.4, downloads: 876, credits: 2, tags: ['视频笔记', '真题'], description: '配合B站讲解视频的配套笔记' },
    { id: '9', title: '线代 真题精选50题', type: 'exam', university: '清华大学', college: '数学系', major: '计算机科学', professor: '张教授', rating: 4.7, downloads: 2103, credits: 3, tags: ['真题精选', '50题'], description: '从10年真题中精选最具代表性的50道题' },
    { id: '10', title: '数据结构 期末真题（2019-2025）', type: 'exam', university: '清华大学', college: '计算机系', major: '计算机科学', professor: '陈教授', rating: 4.8, downloads: 3456, credits: 5, tags: ['历年真题', '含解析'], description: '7年真题完整收录，每题附详细解析' },
  ],

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
}));
