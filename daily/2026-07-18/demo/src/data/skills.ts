import type { Skill } from '../types';

// Mock 技能图谱：SQL 数据查询，从 SELECT 到窗口函数，带清晰的前置依赖结构。
// trueMastery = "学习者其实会多少"，只被「对比」页的确定性模拟使用（模拟 AI 要估计的隐藏真值）。
export const SKILLS: Skill[] = [
  {
    id: 'select',
    name: 'SELECT 基础',
    short: 'SELECT',
    desc: '选择列、取别名、去重',
    prereqs: [],
    trueMastery: 0.9,
  },
  {
    id: 'where',
    name: 'WHERE 过滤',
    short: 'WHERE',
    desc: '条件过滤、AND/OR、IN/BETWEEN',
    prereqs: ['select'],
    trueMastery: 0.85,
  },
  {
    id: 'orderby',
    name: 'ORDER BY 排序',
    short: 'ORDER',
    desc: '单/多列排序、升降序、NULLS 位置',
    prereqs: ['select'],
    trueMastery: 0.8,
  },
  {
    id: 'aggregate',
    name: '聚合函数',
    short: 'AGG',
    desc: 'COUNT / SUM / AVG / MIN / MAX',
    prereqs: ['select'],
    trueMastery: 0.55,
  },
  {
    id: 'groupby',
    name: 'GROUP BY 分组',
    short: 'GROUP',
    desc: '分组聚合、HAVING 过滤组',
    prereqs: ['aggregate', 'where'],
    trueMastery: 0.4,
  },
  {
    id: 'join',
    name: 'JOIN 连接',
    short: 'JOIN',
    desc: 'INNER / LEFT JOIN、连接键、多表',
    prereqs: ['where'],
    trueMastery: 0.5,
  },
  {
    id: 'subquery',
    name: '子查询',
    short: 'SUB',
    desc: '标量/相关子查询、EXISTS、IN(子查询)',
    prereqs: ['where', 'aggregate'],
    trueMastery: 0.3,
  },
  {
    id: 'window',
    name: '窗口函数',
    short: 'WIN',
    desc: 'OVER / PARTITION BY、ROW_NUMBER、RANK',
    prereqs: ['groupby', 'join'],
    trueMastery: 0.15,
  },
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
);
