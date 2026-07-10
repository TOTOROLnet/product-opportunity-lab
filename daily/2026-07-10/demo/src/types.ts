// Pane（明窗）核心数据模型
// 所有 grounding / provenance 均为 mock（预先标注），真实产品里由生成式 UI 框架
// 暴露元数据 + 启发式/模型判定得出。Demo 中用来演示"可信层如何拆穿或背书生成的界面"。

// 一个被模型生成的界面元素的可信度分级
export type Grounding =
  | 'verified' // 已核实：有明确来源 + 抓取时间
  | 'guessed' // 模型推测：模型自己编/估的，未核实
  | 'placeholder'; // 占位：模型生成的展示元素，未绑定任何真实数据/能力

// 元素在生成界面里的呈现类型
export type ElementKind =
  | 'metric' // 醒目的头条数字/结论（最容易"说谎"的地方）
  | 'row' // 对比表/明细里的一行（左标签 + 右取值）
  | 'note' // 一句说明文字
  | 'action'; // 一个动作按钮

export interface Provenance {
  source: string; // 来源，例如 "示例航司数据集 (mock)" 或 "模型推测"
  fetchedAt?: string; // 抓取时间；guessed/placeholder 通常没有
  reason: string; // 为什么被判为该等级（Pane 面板里展示）
}

// 动作按钮的绑定信息
export interface ActionBinding {
  realBinding: boolean; // 是否真的绑定了一个可执行能力
  plainEffect: string; // 明文预检：点下去实际会发生什么
  risk: 'safe' | 'money' | 'none'; // safe=只读/无害；money=真花钱；none=占位不产生效果
}

export interface GenElement {
  id: string;
  kind: ElementKind;
  label: string; // 左侧标签 / 按钮文案
  value?: string; // 右侧取值（metric/row 用）
  highlight?: boolean; // 是否为推荐/重点行（生成式 UI 常见的"高亮推荐"）
  grounding: Grounding;
  provenance: Provenance;
  action?: ActionBinding; // 仅 kind==='action' 有
}

export interface Scenario {
  id: string;
  tab: string; // 场景切换器上的短标签
  title: string; // 生成卡片的标题
  userPrompt: string; // 消费者的原始请求
  assistantIntro: string; // 助手一句话（生成界面前的引导语）
  elements: GenElement[]; // 生成界面里的全部可信度相关元素
  paneVerdict: 'caught' | 'endorsed'; // Pane 对本界面的总体结论：拆穿了问题 / 全部背书
  verdictNote: string; // Pane 结论的一句话说明
}
