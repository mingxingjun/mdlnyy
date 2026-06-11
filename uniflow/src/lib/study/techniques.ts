export interface SpacedRepetitionItem {
  id: string;
  subjectId: string;
  content: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview: number;
  difficulty: number;
}

export function calculateNextReview(
  quality: number,
  item: SpacedRepetitionItem
): Partial<SpacedRepetitionItem> {
  let { easeFactor, interval, repetitions } = item;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);

    repetitions += 1;
  }

  const now = Date.now();
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReview,
    lastReview: now,
    difficulty: quality < 3 ? 1 : quality === 3 ? 2 : 3,
  } as Partial<SpacedRepetitionItem>;
}

export const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30];

export function getReviewSchedule(daysUntilExam: number): number[] {
  if (daysUntilExam <= 0) return [1];
  return EBBINGHAUS_INTERVALS.filter((d) => d <= daysUntilExam);
}

export const ACTIVE_RECALL_TECHNIQUES = [
  {
    name: '闭卷回忆',
    description: '合上书本，写出你能回忆的所有内容',
    duration: '10分钟',
    icon: '📝',
  },
  {
    name: '自问自答',
    description: '就每个知识点向自己提问并回答',
    duration: '15分钟',
    icon: '❓',
  },
  {
    name: '教学讲解',
    description: '假装给一个12岁的孩子讲课',
    duration: '20分钟',
    icon: '🗣️',
  },
  {
    name: '思维导图',
    description: '不看书，凭记忆构建知识图谱',
    duration: '15分钟',
    icon: '🗺️',
  },
  {
    name: '空白测试',
    description: '不看答案，完成所有练习题',
    duration: '25分钟',
    icon: '✍️',
  },
];

export const INTERLEAVING_SCHEDULE = [
  { subject: '科目A', duration: 25, break: 5 },
  { subject: '科目B', duration: 25, break: 5 },
  { subject: '科目C', duration: 25, break: 5 },
  { subject: '科目A', duration: 25, break: 15 },
];

export function generateFeynmanPrompt(concept: string): string {
  return `请用费曼学习法解释以下概念：

概念：${concept}

要求：
1. 用最简单的语言，像教一个12岁的孩子
2. 用生活中的例子做类比
3. 避免使用专业术语（除非先解释）
4. 如果这个概念有常见误区，请指出

请用以下格式回答：
【简单解释】一句话说清楚
【类比】用一个生活中的例子
【关键点】3个最重要的理解点
【常见误区】1个容易出错的地方`;
}

export function generateFlashcardPrompt(content: string, count: number = 5): string {
  return `请基于以下学习内容生成 ${count} 张记忆闪卡。

内容：
${content}

要求：
- 每张闪卡用 Q: 和 A: 格式
- 正面是简洁问题，背面是精炼答案
- 优先覆盖最重要、最常考的知识点
- 每张卡片控制在 50 字以内

输出格式：
Q: [问题]
A: [答案]
标签: [概念标签]

---`;
}

export function generateExamPrompt(knowledgePoints: string[], count: number = 5): string {
  const points = knowledgePoints.join('\n- ');
  return `请基于以下知识点生成 ${count} 道模拟考题。

知识点：
- ${points}

要求：
- 包含选择题和简答题
- 选择题有4个选项，标注正确答案
- 简答题附参考答案
- 难度分布：简单30% 中等50% 困难20%

输出格式：
## 选择题
1. [题目]
   A. [选项A] B. [选项B] C. [选项C] D. [选项D]
   **答案**: [选项] | **解析**: [一句话解析]

## 简答题
1. [题目]
   **参考答案**: [答案]`;
}