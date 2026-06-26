import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearningState } from '@/lib/agents/types';

export interface Subject {
  id: string;
  name: string;
  examDate: string;
  progress: number;
  color: string;
  icon: string;
}

export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashCard {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  mastered: boolean;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: number;
  lastReviewedAt: number | null;
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

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AgentSession {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  subjectId: string;
  type: 'choice' | 'judgment';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  steps: string[];
  mistakes: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WrongAnswer {
  id: string;
  questionId: string;
  subjectId: string;
  userAnswer: number;
  correctAnswer: number;
  timestamp: number;
  reviewed: boolean;
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  subjectId: string;
  userAnswer: number;
  isCorrect: boolean;
  timestamp: number;
}

interface AppState {
  currentUser: string | null;
  setCurrentUser: (name: string | null) => void;
  /** 学习状态机：Orchestrator 路由决策依据 */
  learningState: LearningState;
  setLearningState: (state: LearningState) => void;
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

  addFlashCards: (cards: FlashCard[]) => void;
  toggleFlashCard: (id: string) => void;
  setFlashCardMastered: (id: string, mastered: boolean) => void;
  rateCard: (id: string, rating: CardRating) => void;
  getDueCards: (subjectId?: string | null) => FlashCard[];

  addKnowledgePoints: (points: KnowledgePoint[]) => void;

  toggleWhiteNoise: (noise: WhiteNoiseType) => void;

  addPomodoroSession: (session: PomodoroSession) => void;

  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  removeNote: (id: string) => void;

  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;

  agentSessions: AgentSession[];
  addAgentMessage: (sessionId: string, message: AgentMessage) => void;
  createAgentSession: (agentId: string) => string;
  clearAgentSession: (sessionId: string) => void;

  quizQuestions: QuizQuestion[];
  wrongAnswers: WrongAnswer[];
  answerRecords: AnswerRecord[];
  currentQuestionIndex: number;
  currentSubjectFilter: string | null;

  setCurrentSubjectFilter: (id: string | null) => void;
  submitAnswer: (questionId: string, userAnswer: number) => { isCorrect: boolean };
  markWrongReviewed: (wrongId: string) => void;
  deleteWrongAnswer: (wrongId: string) => void;
  clearReviewedWrongAnswers: () => void;
  resetQuiz: () => void;
  nextQuestion: () => void;
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

const mockSubjects: Subject[] = [
  { id: 'math', name: '高等数学', examDate: '2026-07-10', progress: 65, color: '#8B2500', icon: '📐' },
  { id: 'english', name: '大学英语', examDate: '2026-07-05', progress: 80, color: '#2D5A27', icon: '📖' },
  { id: 'linear', name: '线性代数', examDate: '2026-07-15', progress: 45, color: '#B8860B', icon: '📊' },
  { id: 'programming', name: '程序设计', examDate: '2026-07-08', progress: 90, color: '#5C4033', icon: '💻' },
  { id: 'physics', name: '大学物理', examDate: '2026-07-20', progress: 30, color: '#7A6350', icon: '⚛️' },
];

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const createMockCard = (id: string, subjectId: string, front: string, back: string, mastered: boolean, daysUntilDue: number = 0): FlashCard => {
  const isDue = daysUntilDue <= 0;
  return {
    id,
    subjectId,
    front,
    back,
    mastered,
    repetitions: mastered ? 3 : 0,
    interval: mastered ? 7 : 1,
    easeFactor: 2.5,
    nextReviewDate: now + daysUntilDue * DAY,
    lastReviewedAt: isDue ? now - (mastered ? 7 : 1) * DAY : null,
  };
};

const mockFlashCards: FlashCard[] = [
  createMockCard('fc1', 'math', '求导：f(x) = x²', "f'(x) = 2x", true, -1),
  createMockCard('fc2', 'math', '不定积分：∫ x dx', '(1/2)x² + C', false, 0),
  createMockCard('fc3', 'english', '"abandon" 的意思', 'v. 放弃，抛弃', true, -2),
  createMockCard('fc4', 'linear', '矩阵乘法满足交换律吗？', '一般不满足，AB≠BA', false, 0),
  createMockCard('fc5', 'linear', '什么是行列式？', '方阵的一个标量值，表示线性变换的缩放因子', false, 0),
  createMockCard('fc6', 'programming', 'React中useState的作用？', '在函数组件中添加状态管理', true, -1),
  createMockCard('fc7', 'programming', 'JavaScript中 == 和 === 的区别', '== 会进行类型转换，=== 严格相等不转换', true, -3),
  createMockCard('fc8', 'physics', '牛顿第二定律公式', 'F = ma (力=质量×加速度)', false, 0),
  createMockCard('fc9', 'physics', '动能定理', '合外力做的功等于动能的变化量', false, 0),
  createMockCard('fc10', 'english', '"subsequent" 的意思', 'adj. 随后的，后来的', true, 3),
];

const mockQuizQuestions: QuizQuestion[] = [
  // 高等数学 5题
  {
    id: 'q-math-1',
    subjectId: 'math',
    type: 'choice',
    question: '求函数 f(x) = x³ - 3x² + 2x 的导数 f\'(x) 是？',
    options: ['3x² - 6x + 2', '3x² - 6x', 'x² - 6x + 2', '3x - 6x + 2'],
    correctIndex: 0,
    explanation: '根据幂函数求导法则，(xⁿ)\' = nxⁿ⁻¹，逐项求导后相加。',
    steps: [
      '对 x³ 求导：(x³)\' = 3x²',
      '对 -3x² 求导：(-3x²)\' = -6x',
      '对 2x 求导：(2x)\' = 2',
      '合并结果：f\'(x) = 3x² - 6x + 2'
    ],
    mistakes: ['忘记常数项的导数为0', '求导时幂次减1后忘记乘以原系数'],
    difficulty: 'medium'
  },
  {
    id: 'q-math-2',
    subjectId: 'math',
    type: 'choice',
    question: '计算不定积分 ∫(2x + 1)dx 的结果是？',
    options: ['x² + x + C', '2x² + x + C', 'x² + 1 + C', 'x + C'],
    correctIndex: 0,
    explanation: '根据积分公式 ∫xⁿdx = xⁿ⁺¹/(n+1) + C，逐项积分。',
    steps: [
      '对 2x 积分：∫2xdx = x²',
      '对 1 积分：∫1dx = x',
      '加上积分常数 C',
      '结果：x² + x + C'
    ],
    mistakes: ['积分时忘记加常数C', '积分后幂次计算错误'],
    difficulty: 'easy'
  },
  {
    id: 'q-math-3',
    subjectId: 'math',
    type: 'choice',
    question: '极限 lim(x→0) sin(x)/x 的值是？',
    options: ['1', '0', '∞', '不存在'],
    correctIndex: 0,
    explanation: '这是一个重要极限，当x趋近于0时，sin(x)与x是等价无穷小。',
    steps: [
      '这是0/0型极限，可以用洛必达法则',
      '对分子分母分别求导：cos(x)/1',
      '代入x=0：cos(0) = 1',
      '或者记住这是重要极限公式'
    ],
    mistakes: ['误以为0/0型极限是0', '洛必达法则应用条件不满足时误用'],
    difficulty: 'medium'
  },
  {
    id: 'q-math-4',
    subjectId: 'math',
    type: 'choice',
    question: '函数 f(x) = eˣ 的导数是？',
    options: ['eˣ', 'xeˣ⁻¹', 'eˣ⁻¹', '1'],
    correctIndex: 0,
    explanation: '指数函数eˣ的导数就是它本身，这是指数函数的重要性质。',
    steps: [
      '指数函数求导公式：(aˣ)\' = aˣlna',
      '当a=e时，lne = 1',
      '因此 (eˣ)\' = eˣ · 1 = eˣ'
    ],
    mistakes: ['误用幂函数求导法则', '忘记自然对数lne=1'],
    difficulty: 'easy'
  },
  {
    id: 'q-math-5',
    subjectId: 'math',
    type: 'choice',
    question: '定积分 ∫₀¹ x²dx 的值是？',
    options: ['1/3', '1/2', '1', '2/3'],
    correctIndex: 0,
    explanation: '先求不定积分，再代入上下限相减，使用牛顿-莱布尼茨公式。',
    steps: [
      '求不定积分：∫x²dx = x³/3 + C',
      '代入上限x=1：1³/3 = 1/3',
      '代入下限x=0：0³/3 = 0',
      '相减：1/3 - 0 = 1/3'
    ],
    mistakes: ['计算时忘记除以(n+1)', '上下限相减时顺序颠倒'],
    difficulty: 'medium'
  },

  // 大学英语 5题
  {
    id: 'q-english-1',
    subjectId: 'english',
    type: 'choice',
    question: 'The word "ubiquitous" most nearly means:',
    options: ['present everywhere', 'extremely rare', 'very ancient', 'highly technical'],
    correctIndex: 0,
    explanation: 'ubiquitous意为"无处不在的"，表示某物到处都存在。',
    steps: [
      '识别词根：ubi-（哪里）+ quit（自由）+ -ous（形容词后缀）',
      '联想：在任何地方都能自由出现的',
      '理解为"无处不在的、普遍存在的"',
      '对应选项 present everywhere'
    ],
    mistakes: ['与unique（独特的）混淆', '词根记忆不准确'],
    difficulty: 'hard'
  },
  {
    id: 'q-english-2',
    subjectId: 'english',
    type: 'choice',
    question: 'Choose the correct form: "If I ___ you, I would study harder."',
    options: ['were', 'was', 'am', 'be'],
    correctIndex: 0,
    explanation: '这是虚拟语气，与现在事实相反，be动词一律用were。',
    steps: [
      '识别这是if引导的非真实条件句',
      '主句谓语是would study，表示与现在事实相反',
      '虚拟语气中，if从句的be动词用were（所有人称）',
      '因此选 were'
    ],
    mistakes: ['主语是I时误用was', '分不清真实条件和虚拟条件'],
    difficulty: 'medium'
  },
  {
    id: 'q-english-3',
    subjectId: 'english',
    type: 'choice',
    question: '"He is ____ honest man." 选择正确的冠词：',
    options: ['an', 'a', 'the', '不填'],
    correctIndex: 0,
    explanation: 'honest的h不发音，以元音音素开头，所以用an。',
    steps: [
      '冠词选择取决于发音，不是首字母',
      'honest发音以/ɒ/（元音）开头',
      '元音音素前用an',
      '所以选 an'
    ],
    mistakes: ['看到h开头就用a', '只看字母不看发音'],
    difficulty: 'easy'
  },
  {
    id: 'q-english-4',
    subjectId: 'english',
    type: 'choice',
    question: 'The synonym of "perseverance" is:',
    options: ['persistence', 'intelligence', 'generosity', 'humility'],
    correctIndex: 0,
    explanation: 'perseverance意为"毅力、坚持不懈"，与persistence意思相近。',
    steps: [
      '分析perseverance：per-（贯穿）+ severe（严格）+ -ance',
      '理解为"始终严格要求自己"',
      '即"坚持、毅力"',
      '对应 persistence（坚持、执着）'
    ],
    mistakes: ['与perspective（观点）混淆', '词根记忆不清'],
    difficulty: 'medium'
  },
  {
    id: 'q-english-5',
    subjectId: 'english',
    type: 'choice',
    question: 'Which sentence is grammatically correct?',
    options: ['She has been studying for three hours.', 'She have been studying for three hours.', 'She has studying for three hours.', 'She been studying for three hours.'],
    correctIndex: 0,
    explanation: '现在完成进行时结构：have/has + been + doing，主语she是第三人称单数用has。',
    steps: [
      '时态标志：for three hours表示持续',
      '确定时态：现在完成进行时',
      '结构：has/have + been + V-ing',
      '主语she用has，所以选第一项'
    ],
    mistakes: ['have/has与主语不一致', '忘记been'],
    difficulty: 'easy'
  },

  // 线性代数 5题
  {
    id: 'q-linear-1',
    subjectId: 'linear',
    type: 'choice',
    question: '设A是3阶方阵，|A|=2，则|2A|=？',
    options: ['16', '4', '8', '2'],
    correctIndex: 0,
    explanation: '数乘矩阵的行列式：|kA| = kⁿ|A|，n是矩阵阶数。',
    steps: [
      '公式：n阶方阵A，|kA| = kⁿ|A|',
      '这里n=3，k=2',
      '计算：2³ × |A| = 8 × 2 = 16'
    ],
    mistakes: ['直接把k乘到行列式上得到4', '忘记k的幂次是矩阵阶数'],
    difficulty: 'medium'
  },
  {
    id: 'q-linear-2',
    subjectId: 'linear',
    type: 'choice',
    question: '两个矩阵A和B满足AB=0，则：',
    options: ['不能推出A=0或B=0', '必有A=0', '必有B=0', '必有A=0且B=0'],
    correctIndex: 0,
    explanation: '矩阵乘法存在零因子，两个非零矩阵相乘可能得到零矩阵。',
    steps: [
      '举反例：A=[[1,0],[0,0]], B=[[0,0],[0,1]]',
      '计算AB = [[0,0],[0,0]] = 0',
      '但A≠0且B≠0',
      '因此不能推出A=0或B=0'
    ],
    mistakes: ['将矩阵乘法与数的乘法混淆', '认为AB=0就一定有零矩阵'],
    difficulty: 'medium'
  },
  {
    id: 'q-linear-3',
    subjectId: 'linear',
    type: 'choice',
    question: '单位矩阵I的逆矩阵是：',
    options: ['I本身', '0矩阵', '-I', '不存在'],
    correctIndex: 0,
    explanation: '单位矩阵的逆就是它自己，因为I·I=I。',
    steps: [
      '逆矩阵定义：若AB=BA=I，则B是A的逆',
      '代入B=I：I·I = I，I·I = I',
      '满足逆矩阵定义',
      '因此I⁻¹ = I'
    ],
    mistakes: ['认为逆矩阵是0矩阵', '不清楚单位矩阵的性质'],
    difficulty: 'easy'
  },
  {
    id: 'q-linear-4',
    subjectId: 'linear',
    type: 'choice',
    question: '矩阵A可逆的充要条件是：',
    options: ['|A| ≠ 0', '|A| = 0', 'A是对称矩阵', 'A是方阵'],
    correctIndex: 0,
    explanation: '方阵A可逆当且仅当其行列式不为零，即非奇异矩阵。',
    steps: [
      '回忆可逆矩阵的定义：存在B使AB=BA=I',
      '两边取行列式：|A||B| = |I| = 1',
      '因此|A|不能为0（否则0=1矛盾）',
      '反过来，|A|≠0时A* / |A|就是逆矩阵'
    ],
    mistakes: ['认为只要是方阵就可逆', '混淆可逆与对称概念'],
    difficulty: 'medium'
  },
  {
    id: 'q-linear-5',
    subjectId: 'linear',
    type: 'choice',
    question: '矩阵A的特征值λ满足的方程是：',
    options: ['|A - λI| = 0', 'A - λI = 0', '|A| = λ', 'Aλ = 0'],
    correctIndex: 0,
    explanation: '特征方程是|A - λI| = 0，解此方程可得特征值。',
    steps: [
      '特征值定义：Ax = λx，x≠0',
      '移项：Ax - λx = 0，即(A - λI)x = 0',
      'x是非零解，说明齐次方程组有非零解',
      '系数矩阵行列式为0：|A - λI| = 0'
    ],
    mistakes: ['忘记是行列式等于0而非矩阵等于0', '特征方程形式记错'],
    difficulty: 'hard'
  },

  // 程序设计 5题
  {
    id: 'q-programming-1',
    subjectId: 'programming',
    type: 'choice',
    question: '在JavaScript中，typeof null 的结果是？',
    options: ['"object"', '"null"', '"undefined"', '"number"'],
    correctIndex: 0,
    explanation: '这是JavaScript的历史遗留bug，typeof null返回"object"。',
    steps: [
      'JavaScript最初实现时的类型标签设计',
      'null的机器码表示是0x00（空指针）',
      '对象的类型标签也是0',
      '因此typeof null错误地返回"object"'
    ],
    mistakes: ['想当然认为是"null"', '混淆null和undefined的typeof'],
    difficulty: 'medium'
  },
  {
    id: 'q-programming-2',
    subjectId: 'programming',
    type: 'choice',
    question: '快速排序的平均时间复杂度是？',
    options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
    correctIndex: 0,
    explanation: '快速排序平均情况下是O(n log n)，最坏情况O(n²)。',
    steps: [
      '每次划分将数组分成两部分（平均等分）',
      '划分过程需要O(n)时间遍历',
      '递归深度平均是log n层',
      '总时间：n × log n = O(n log n)'
    ],
    mistakes: ['认为快速排序总是O(n²)', '混淆最好、最坏情况'],
    difficulty: 'medium'
  },
  {
    id: 'q-programming-3',
    subjectId: 'programming',
    type: 'choice',
    question: 'React中，哪个Hook用于在组件中管理副作用？',
    options: ['useEffect', 'useState', 'useContext', 'useMemo'],
    correctIndex: 0,
    explanation: 'useEffect专门用于处理数据获取、订阅、DOM操作等副作用。',
    steps: [
      'useState：管理组件状态',
      'useContext：访问上下文',
      'useMemo：缓存计算结果',
      'useEffect：执行副作用操作'
    ],
    mistakes: ['混淆useState和useEffect的用途', '不了解各个Hook的职责'],
    difficulty: 'easy'
  },
  {
    id: 'q-programming-4',
    subjectId: 'programming',
    type: 'choice',
    question: '栈(Stack)的特点是？',
    options: ['后进先出(LIFO)', '先进先出(FIFO)', '随机访问', '优先级排序'],
    correctIndex: 0,
    explanation: '栈是后进先出的数据结构，最后压入的元素最先弹出。',
    steps: [
      '栈像一摞盘子',
      '只能从顶部放（push）',
      '只能从顶部取（pop）',
      '最后放的最先被拿走，即LIFO'
    ],
    mistakes: ['栈和队列特点混淆（队列是FIFO）', '以为栈支持随机访问'],
    difficulty: 'easy'
  },
  {
    id: 'q-programming-5',
    subjectId: 'programming',
    type: 'choice',
    question: '在Python中，以下哪个是不可变(immutable)类型？',
    options: ['tuple', 'list', 'dict', 'set'],
    correctIndex: 0,
    explanation: '元组tuple是不可变的，创建后不能修改元素。',
    steps: [
      'list（列表）：可变，可以增删改元素',
      'dict（字典）：可变，可以修改键值对',
      'set（集合）：可变，可以添加删除元素',
      'tuple（元组）：不可变，创建后不能修改'
    ],
    mistakes: ['认为list是不可变的', '混淆tuple和list的可变性'],
    difficulty: 'easy'
  },

  // 大学物理 4题
  {
    id: 'q-physics-1',
    subjectId: 'physics',
    type: 'choice',
    question: '一个物体做自由落体运动，下落2秒后的速度约为(g取10m/s²)：',
    options: ['20 m/s', '10 m/s', '40 m/s', '5 m/s'],
    correctIndex: 0,
    explanation: '自由落体速度公式v = gt，初速度为0。',
    steps: [
      '自由落体初速度v₀ = 0',
      '速度公式：v = v₀ + gt',
      '代入：v = 0 + 10 × 2 = 20 m/s'
    ],
    mistakes: ['忘记初速度为0的条件', '公式v=gt中t的单位要注意'],
    difficulty: 'easy'
  },
  {
    id: 'q-physics-2',
    subjectId: 'physics',
    type: 'choice',
    question: '牛顿第三定律描述的是：',
    options: ['作用力与反作用力大小相等方向相反', 'F=ma', '惯性定律', '万有引力'],
    correctIndex: 0,
    explanation: '牛顿第三定律是作用-反作用定律，两个物体间的力大小相等方向相反。',
    steps: [
      '牛顿第一定律：惯性定律',
      '牛顿第二定律：F = ma',
      '牛顿第三定律：作用力与反作用力',
      '内容：大小相等、方向相反、作用在不同物体上'
    ],
    mistakes: ['混淆三个定律的内容', '认为作用力反作用力可以抵消'],
    difficulty: 'easy'
  },
  {
    id: 'q-physics-3',
    subjectId: 'physics',
    type: 'choice',
    question: '两个电阻R₁和R₂并联，总电阻为：',
    options: ['R₁R₂/(R₁+R₂)', 'R₁ + R₂', 'R₁ - R₂', '(R₁+R₂)/2'],
    correctIndex: 0,
    explanation: '并联电阻公式：1/R = 1/R₁ + 1/R₂，通分后得到R = R₁R₂/(R₁+R₂)。',
    steps: [
      '并联电路电压相等，总电流是各支路之和',
      'I = I₁ + I₂，即 U/R = U/R₁ + U/R₂',
      '两边除以U：1/R = 1/R₁ + 1/R₂',
      '通分：R = R₁R₂/(R₁+R₂)'
    ],
    mistakes: ['并联电阻误用串联公式直接相加', '公式记错为R₁+R₂'],
    difficulty: 'medium'
  },
  {
    id: 'q-physics-4',
    subjectId: 'physics',
    type: 'choice',
    question: '动能的表达式是：',
    options: ['(1/2)mv²', 'mgh', 'mv', 'ma'],
    correctIndex: 0,
    explanation: '动能Ek = (1/2)mv²，m是质量，v是速度。',
    steps: [
      '动能是物体由于运动而具有的能量',
      '由功的定义推导：W = Fs = mas',
      '由运动学公式v² = 2as，得as = v²/2',
      '代入得：W = (1/2)mv²，即动能'
    ],
    mistakes: ['与势能mgh混淆', '忘记系数1/2'],
    difficulty: 'easy'
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      learningState: 'Onboarded',
      subjects: mockSubjects,
      flashCards: mockFlashCards,
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

      agentSessions: [],

      quizQuestions: mockQuizQuestions,
      wrongAnswers: [],
      answerRecords: [],
      currentQuestionIndex: 0,
      currentSubjectFilter: null,

      setCurrentUser: (name) => set({ currentUser: name }),

      setLearningState: (learningState) => set({ learningState }),

      addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
      removeSubject: (id) => set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),
      updateSubjectProgress: (id, progress) => set((state) => ({
        subjects: state.subjects.map((s) => (s.id === id ? { ...s, progress } : s)),
      })),

      addFlashCards: (cards) => set((state) => ({ flashCards: [...state.flashCards, ...cards] })),
      toggleFlashCard: (id) => set((state) => ({
        flashCards: state.flashCards.map((c) => (c.id === id ? { ...c, mastered: !c.mastered } : c)),
      })),
      setFlashCardMastered: (id, mastered) => set((state) => ({
        flashCards: state.flashCards.map((c) => (c.id === id ? { ...c, mastered } : c)),
      })),
      rateCard: (id, rating) => set((state) => ({
        flashCards: state.flashCards.map((card) => {
          if (card.id !== id) return card;

          let { repetitions, interval, easeFactor } = card;
          const DAY_MS = 24 * 60 * 60 * 1000;

          switch (rating) {
            case 'again':
              repetitions = 0;
              interval = 1;
              easeFactor = Math.max(1.3, easeFactor - 0.2);
              break;
            case 'hard':
              if (repetitions === 0) {
                interval = 1;
              } else {
                interval = Math.max(1, Math.round(interval * 1.2));
              }
              easeFactor = Math.max(1.3, easeFactor - 0.15);
              repetitions += 1;
              break;
            case 'good':
              repetitions += 1;
              if (repetitions === 1) {
                interval = 1;
              } else if (repetitions === 2) {
                interval = 6;
              } else {
                interval = Math.round(interval * easeFactor);
              }
              break;
            case 'easy':
              repetitions += 1;
              interval = Math.round(interval * easeFactor * 1.3);
              easeFactor = Math.min(3.0, easeFactor + 0.15);
              break;
          }

          const mastered = repetitions >= 5 && easeFactor >= 2.5;
          const nextReviewDate = Date.now() + interval * DAY_MS;

          return {
            ...card,
            repetitions,
            interval,
            easeFactor,
            nextReviewDate,
            lastReviewedAt: Date.now(),
            mastered,
          };
        }),
      })),
      getDueCards: (subjectId) => {
        const state = get();
        const now = Date.now();
        return state.flashCards.filter((card) => {
          if (subjectId && card.subjectId !== subjectId) return false;
          return card.nextReviewDate <= now;
        });
      },

      addKnowledgePoints: (points) => set((state) => ({ knowledgePoints: [...state.knowledgePoints, ...points] })),

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

      createAgentSession: (agentId) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((state) => ({
          agentSessions: [...state.agentSessions, { id, agentId, messages: [], createdAt: Date.now() }],
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

      setCurrentSubjectFilter: (id) => set({ currentSubjectFilter: id, currentQuestionIndex: 0 }),

      submitAnswer: (questionId, userAnswer) => {
        const state = get();
        const question = state.quizQuestions.find((q) => q.id === questionId);
        if (!question) return { isCorrect: false };

        const isCorrect = userAnswer === question.correctIndex;
        const recordId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const record: AnswerRecord = {
          id: recordId,
          questionId,
          subjectId: question.subjectId,
          userAnswer,
          isCorrect,
          timestamp: Date.now(),
        };

        if (!isCorrect) {
          const wrongId = 'w-' + recordId;
          const wrong: WrongAnswer = {
            id: wrongId,
            questionId,
            subjectId: question.subjectId,
            userAnswer,
            correctAnswer: question.correctIndex,
            timestamp: Date.now(),
            reviewed: false,
          };
          set((s) => ({
            answerRecords: [...s.answerRecords, record],
            wrongAnswers: [...s.wrongAnswers, wrong],
          }));
        } else {
          set((s) => ({
            answerRecords: [...s.answerRecords, record],
          }));
        }

        return { isCorrect };
      },

      markWrongReviewed: (wrongId) => set((state) => ({
        wrongAnswers: state.wrongAnswers.map((w) =>
          w.id === wrongId ? { ...w, reviewed: true } : w
        ),
      })),

      deleteWrongAnswer: (wrongId) => set((state) => ({
        wrongAnswers: state.wrongAnswers.filter((w) => w.id !== wrongId),
      })),

      clearReviewedWrongAnswers: () => set((state) => ({
        wrongAnswers: state.wrongAnswers.filter((w) => !w.reviewed),
      })),

      resetQuiz: () => set({ currentQuestionIndex: 0 }),

      nextQuestion: () => set((state) => {
        const filteredQuestions = state.currentSubjectFilter
          ? state.quizQuestions.filter((q) => q.subjectId === state.currentSubjectFilter)
          : state.quizQuestions;
        const nextIndex = (state.currentQuestionIndex + 1) % filteredQuestions.length;
        return { currentQuestionIndex: nextIndex };
      }),
    }),
    {
      name: 'uniflow-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        learningState: state.learningState,
        subjects: state.subjects,
        flashCards: state.flashCards,
        knowledgePoints: state.knowledgePoints,
        pomodoroSessions: state.pomodoroSessions,
        notes: state.notes,
        joinedRooms: state.joinedRooms,
        todayFlowMinutes: state.todayFlowMinutes,
        wrongAnswers: state.wrongAnswers,
        answerRecords: state.answerRecords,
        currentQuestionIndex: state.currentQuestionIndex,
        currentSubjectFilter: state.currentSubjectFilter,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (!state.subjects || state.subjects.length === 0)) {
          state.subjects = mockSubjects;
          state.flashCards = mockFlashCards;
        }
        if (state && (!state.quizQuestions || state.quizQuestions.length === 0)) {
          state.quizQuestions = mockQuizQuestions;
        }
        if (!state) return;
        if (!state.wrongAnswers) state.wrongAnswers = [];
        if (!state.answerRecords) state.answerRecords = [];
        if (state.flashCards) {
          state.flashCards = state.flashCards.map((card) => ({
            repetitions: 0,
            interval: card.mastered ? 7 : 0,
            easeFactor: 2.5,
            nextReviewDate: card.mastered ? Date.now() + 7 * DAY : Date.now(),
            lastReviewedAt: null,
            ...card,
          }));
        }
      },
    }
  )
);
