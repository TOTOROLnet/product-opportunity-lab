// 展示层格式化。所有 rate 在引擎内保持原始 0..1，只在此处 ×100 取整，避免二次取整误差。

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** 百分点差：0.08 -> "+8pp"，-0.01 -> "-1pp"。 */
export function pp(x: number): string {
  const v = Math.round(x * 100);
  const sign = v > 0 ? '+' : '';
  return `${sign}${v}pp`;
}

export function fmtP(p: number): string {
  return `p=${p.toFixed(3)}`;
}
