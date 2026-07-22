// 全部类型均服务于「成交前核验」这一核心体验。
// 真实产品中，这些字段由 AI 解析任意商户结账页得出；本 Demo 用确定性 mock 数据代理。

export type Severity = 'low' | 'medium' | 'high';

export type Decision = 'pending' | 'approved' | 'modified' | 'rejected';

export type Recommendation = 'approve' | 'modify' | 'reject';

export type Category = 'hotel' | 'subscription' | 'flight';

/** 意图对齐：你交代的约束 vs agent 真正要成交的内容，逐条比对。 */
export interface IntentCheck {
  label: string; // 约束维度，如「免费取消」
  required: string; // 你要的
  actual: string; // agent 真要买的
  ok: boolean; // 是否满足
}

/** 真实总价的一条费用拆解。hidden=true 表示首屏标价未展示、结算前才追加。 */
export interface CostLine {
  label: string;
  amount: number;
  hidden: boolean;
}

/** 一条被识别出的 dark pattern / 陷阱。 */
export interface Trap {
  type: string; // 陷阱类别短名
  title: string; // 一句话标题
  detail: string; // 展开说明
  severity: Severity;
}

/** 可逆性：万一买错了，能不能退、好不好退。 */
export interface Reversibility {
  score: number; // 0–100
  refundWindow: string; // 退款窗口
  refundDifficulty: string; // 退款难度
  cancelPath: string; // 取消路径
  summary: string; // 一句话「买错了怎么办」
}

/** 商户可信信号（mock）。 */
export interface MerchantTrust {
  score: number; // 0–100
  note: string;
}

/** 一笔 agent 提交的「待成交订单」。 */
export interface Order {
  id: string;
  category: Category;
  merchant: string;
  title: string;
  agentNote: string; // agent 为什么选这个
  listedPrice: number; // 首屏标价（商户想让你看到的）
  costLines: CostLine[]; // 真实费用拆解，求和 = 真实总价
  intentChecks: IntentCheck[];
  traps: Trap[];
  reversibility: Reversibility;
  merchantTrust: MerchantTrust;
  recommendation: Recommendation;
  modifyInstruction: string; // 「让 agent 改」时发回给 agent 的指令
}

/** 委托给 agent 的任务。 */
export interface Task {
  title: string;
  delegatedTo: string;
  constraints: string[];
  currency: string;
}

export interface Scenario {
  task: Task;
  orders: Order[];
}
