export type Env = 'prod' | 'staging' | 'none';

export type Verdict = 'unique' | 'ambiguous' | 'dangerous' | 'blindspot';

export interface Tool {
  id: string;
  server: string;
  name: string;
  description: string;
  capability: string;
  tags: string[];
  /** 误选会造成不可逆 / 生产 / 公开外泄类真实损害 */
  harmful: boolean;
  destructive: boolean;
  reversible: boolean;
  env: Env;
  /** 一次误选会发生什么（用于「翻车预演」展示） */
  effect?: string;
  /** 正名后加的显式确认闸：意图需含其一关键词，否则该工具不参与检索 */
  guard?: string[];
}

export interface Intent {
  id: string;
  text: string;
  family: string;
  keywords: string[];
  correctToolId: string;
  /** 人话背景：这个意图到底想干嘛 */
  note: string;
}

export interface FixOp {
  toolId: string;
  removeTags?: string[];
  addTags?: string[];
  rename?: string;
  guard?: string[];
}

export interface Fix {
  id: string;
  title: string;
  kind: 'sharpen' | 'tighten' | 'guard' | 'namespace' | 'mixed';
  targetIntentId?: string;
  before: string;
  after: string;
  ops: FixOp[];
  /** 命名空间只解决「名撞车」，语义等价仍需人工指定首选（对号台仍显示多义） */
  persistAmbiguous?: boolean;
}
