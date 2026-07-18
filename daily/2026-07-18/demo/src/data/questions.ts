import type { Question } from '../types';

// Mock 题库：每个技能 2–3 道单选题。全部为演示用，答案确定。
export const QUESTIONS: Question[] = [
  // SELECT
  {
    id: 'select-1',
    skillId: 'select',
    prompt: '要从 users 表取出 name 列并去重，正确的是？',
    options: [
      'SELECT DISTINCT name FROM users;',
      'SELECT name UNIQUE FROM users;',
      'SELECT name FROM users DISTINCT;',
      'DISTINCT SELECT name FROM users;',
    ],
    correctIndex: 0,
    difficulty: 0.2,
    explain: 'DISTINCT 紧跟在 SELECT 之后、作用于其后的列。',
  },
  {
    id: 'select-2',
    skillId: 'select',
    prompt: '给列 price 取别名为「单价」，标准写法是？',
    options: [
      'SELECT price = 单价 FROM t;',
      'SELECT price AS 单价 FROM t;',
      'SELECT price 单价 ALIAS FROM t;',
      'SELECT alias(price, 单价) FROM t;',
    ],
    correctIndex: 1,
    difficulty: 0.25,
    explain: 'AS 用于列别名；AS 可省略，但 = 不是别名语法。',
  },
  // WHERE
  {
    id: 'where-1',
    skillId: 'where',
    prompt: '筛选 age 在 18 到 30（含端点）之间，最简洁的是？',
    options: [
      'WHERE age > 18 AND age < 30',
      'WHERE age BETWEEN 18 AND 30',
      'WHERE age IN (18, 30)',
      'WHERE age = 18 TO 30',
    ],
    correctIndex: 1,
    difficulty: 0.3,
    explain: 'BETWEEN a AND b 是闭区间，包含两端。',
  },
  {
    id: 'where-2',
    skillId: 'where',
    prompt: '关于 NULL 的过滤，下列哪个正确？',
    options: [
      'WHERE email = NULL',
      'WHERE email != NULL',
      'WHERE email IS NULL',
      'WHERE email == NULL',
    ],
    correctIndex: 2,
    difficulty: 0.4,
    explain: 'NULL 不能用 = 比较，必须用 IS NULL / IS NOT NULL。',
  },
  {
    id: 'where-3',
    skillId: 'where',
    prompt: '匹配 name 以 "李" 开头的记录，正确的是？',
    options: [
      "WHERE name LIKE '李%'",
      "WHERE name LIKE '%李'",
      "WHERE name = '李*'",
      "WHERE name CONTAINS '李'",
    ],
    correctIndex: 0,
    difficulty: 0.35,
    explain: "% 是通配符；'李%' 表示以「李」开头。",
  },
  // ORDER BY
  {
    id: 'orderby-1',
    skillId: 'orderby',
    prompt: '按 score 降序排列，正确的是？',
    options: [
      'ORDER BY score DESC',
      'ORDER score DESC BY',
      'SORT BY score DESC',
      'ORDER BY score DOWN',
    ],
    correctIndex: 0,
    difficulty: 0.25,
    explain: 'ORDER BY 列 DESC 表示降序，ASC（默认）为升序。',
  },
  {
    id: 'orderby-2',
    skillId: 'orderby',
    prompt: '先按 dept 升序、再按 salary 降序，正确写法是？',
    options: [
      'ORDER BY dept ASC AND salary DESC',
      'ORDER BY dept, salary DESC',
      'ORDER BY dept ASC, salary DESC',
      'ORDER BY dept DESC, salary ASC',
    ],
    correctIndex: 2,
    difficulty: 0.4,
    explain: '多列排序用逗号分隔，各自可带 ASC/DESC。',
  },
  // 聚合
  {
    id: 'aggregate-1',
    skillId: 'aggregate',
    prompt: '统计 orders 表的行数，正确的是？',
    options: [
      'SELECT COUNT(*) FROM orders;',
      'SELECT ROWS(orders);',
      'SELECT SUM(*) FROM orders;',
      'SELECT TOTAL() FROM orders;',
    ],
    correctIndex: 0,
    difficulty: 0.3,
    explain: 'COUNT(*) 统计行数；SUM 用于数值求和。',
  },
  {
    id: 'aggregate-2',
    skillId: 'aggregate',
    prompt: 'COUNT(col) 与 COUNT(*) 的关键区别是？',
    options: [
      '完全相同',
      'COUNT(col) 忽略该列为 NULL 的行',
      'COUNT(*) 只统计第一列',
      'COUNT(col) 更快但结果一样',
    ],
    correctIndex: 1,
    difficulty: 0.55,
    explain: 'COUNT(col) 不计 col 为 NULL 的行；COUNT(*) 计所有行。',
  },
  // GROUP BY
  {
    id: 'groupby-1',
    skillId: 'groupby',
    prompt: '按 dept 统计各部门人数，正确的是？',
    options: [
      'SELECT dept, COUNT(*) FROM emp GROUP BY dept;',
      'SELECT dept, COUNT(*) FROM emp;',
      'SELECT dept, COUNT(*) FROM emp WHERE dept;',
      'GROUP dept SELECT COUNT(*) FROM emp;',
    ],
    correctIndex: 0,
    difficulty: 0.5,
    explain: '非聚合列必须出现在 GROUP BY 中。',
  },
  {
    id: 'groupby-2',
    skillId: 'groupby',
    prompt: '只保留人数 > 5 的部门，应使用？',
    options: [
      'WHERE COUNT(*) > 5',
      'HAVING COUNT(*) > 5',
      'FILTER COUNT(*) > 5',
      'WHERE dept > 5',
    ],
    correctIndex: 1,
    difficulty: 0.6,
    explain: '对分组后的聚合结果过滤用 HAVING，不能用 WHERE。',
  },
  // JOIN
  {
    id: 'join-1',
    skillId: 'join',
    prompt: '取每个订单及其对应用户名（只要匹配上的），用？',
    options: [
      'orders o INNER JOIN users u ON o.uid = u.id',
      'orders o, users u',
      'orders o FULL JOIN users u',
      'orders o CROSS JOIN users u',
    ],
    correctIndex: 0,
    difficulty: 0.5,
    explain: 'INNER JOIN + ON 连接键，只返回两边匹配的行。',
  },
  {
    id: 'join-2',
    skillId: 'join',
    prompt: '要保留所有用户，即使他没有订单，应使用？',
    options: [
      'INNER JOIN',
      'users LEFT JOIN orders',
      'orders LEFT JOIN users',
      'RIGHT JOIN orders',
    ],
    correctIndex: 1,
    difficulty: 0.6,
    explain: 'LEFT JOIN 保留左表（users）全部行，右表无匹配则为 NULL。',
  },
  // 子查询
  {
    id: 'subquery-1',
    skillId: 'subquery',
    prompt: '查询工资高于全公司平均的员工，正确的是？',
    options: [
      'WHERE salary > AVG(salary)',
      'WHERE salary > (SELECT AVG(salary) FROM emp)',
      'WHERE salary > ALL salary',
      'HAVING salary > AVG(salary)',
    ],
    correctIndex: 1,
    difficulty: 0.65,
    explain: '聚合不能直接放进 WHERE，需用标量子查询计算平均值。',
  },
  {
    id: 'subquery-2',
    skillId: 'subquery',
    prompt: '找出「有过订单」的用户，最贴切的是？',
    options: [
      'WHERE EXISTS (SELECT 1 FROM orders o WHERE o.uid = u.id)',
      'WHERE orders IS NOT NULL',
      'WHERE COUNT(orders) > 0',
      'WHERE u.id IN orders',
    ],
    correctIndex: 0,
    difficulty: 0.7,
    explain: 'EXISTS + 相关子查询判断是否存在匹配行，语义清晰高效。',
  },
  // 窗口函数
  {
    id: 'window-1',
    skillId: 'window',
    prompt: '给每个部门内按工资排名，用？',
    options: [
      'RANK() OVER (PARTITION BY dept ORDER BY salary DESC)',
      'RANK() GROUP BY dept',
      'ORDER BY salary RANK dept',
      'COUNT(*) OVER dept',
    ],
    correctIndex: 0,
    difficulty: 0.75,
    explain: 'PARTITION BY 分区 + ORDER BY 排序，RANK() 给分区内排名。',
  },
  {
    id: 'window-2',
    skillId: 'window',
    prompt: '窗口函数与 GROUP BY 的关键区别是？',
    options: [
      '窗口函数会把多行折叠成一行',
      '窗口函数保留每一行、同时附带聚合/排名结果',
      '两者完全等价',
      '窗口函数不能排序',
    ],
    correctIndex: 1,
    difficulty: 0.8,
    explain: 'GROUP BY 折叠行；窗口函数保留原始行并附加计算列。',
  },
];

export const QUESTIONS_BY_SKILL: Record<string, Question[]> = QUESTIONS.reduce(
  (acc, q) => {
    (acc[q.skillId] ||= []).push(q);
    return acc;
  },
  {} as Record<string, Question[]>,
);
