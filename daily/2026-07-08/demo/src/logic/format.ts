export function formatMoney(currency: string, amount: number): string {
  return `${currency}${Math.round(amount).toLocaleString('en-US')}`
}
