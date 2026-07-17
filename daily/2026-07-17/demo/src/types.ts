// 常青 Evergreen — 类型定义
// 说明：真实产品里"论断抽取 / 来源语义变化判定 / 补丁生成"由 LLM 完成；
// 本 Demo 把这些关系预编码为确定性数据 + 值比较引擎，价值（鲜度分 before/after）是实测而非造假。

export type SourceKind = 'policy' | 'pricing' | 'api' | 'finance' | 'ops';

export interface SourceVersion {
  /** 会被套进论断模板的值 */
  value: string;
  /** 来源面板里展示的短标签，如 "7 天" */
  label: string;
  /** 该版本生效日期（mock） */
  date: string;
  /** 变更说明 */
  note?: string;
}

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  /** 从旧到新排序；index 0 是文档最初依据的基线版本 */
  versions: SourceVersion[];
}

export interface Claim {
  id: string;
  /** SOP 中的小节标题 */
  section: string;
  /** 句子模板，使用 {value} 占位符 */
  template: string;
  /** 绑定的来源 id */
  sourceId: string;
  /** 是否计入鲜度分（承重论断） */
  loadBearing: boolean;
  /**
   * 当绑定来源以"非简单替换"的方式变化（口径变模糊等），
   * agent 不自动改写，而是标记为需人判断。
   */
  manualOnly?: boolean;
  /** manualOnly 时供人选择的改写选项（诚实：由人拍板，不是 agent 替人决定） */
  manualOptions?: string[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  sourceId: string;
  /** 该事件把来源推进到的版本 index */
  toVersionIndex: number;
  headline: string;
}

export type ClaimStatus = 'fresh' | 'stale' | 'manual';

export interface ClaimComputed {
  claim: Claim;
  source: Source;
  assertedVersionIndex: number;
  currentVersionIndex: number;
  assertedValue: string;
  currentValue: string;
  /** 文档里当前写着的句子 */
  assertedText: string;
  /** 若采纳补丁后应写成的句子 */
  currentText: string;
  status: ClaimStatus;
}

export interface FreshnessResult {
  computed: ClaimComputed[];
  loadBearingTotal: number;
  loadBearingFresh: number;
  /** 0..100 */
  score: number;
  stale: ClaimComputed[];
  manual: ClaimComputed[];
}
