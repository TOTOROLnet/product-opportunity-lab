export const usd = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;
export const pct = (frac: number): string => `${Math.round(frac * 100)}%`;
export const pct1 = (frac: number): string => `${(frac * 100).toFixed(1)}%`;
export const num = (n: number): string => Math.round(n).toLocaleString('en-US');
export const ms = (n: number): string => `${Math.round(n)}ms`;
