/** Currency → locale map and formatter, ported from sink-inventory's utils/formatMoney. */
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  NGN: 'en-NG', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', CHF: 'de-CH', CAD: 'en-CA', AUD: 'en-AU', NZD: 'en-NZ', CNY: 'zh-CN',
  INR: 'en-IN', RUB: 'ru-RU', BRL: 'pt-BR', ZAR: 'en-ZA', MXN: 'es-MX', SGD: 'en-SG', HKD: 'zh-HK', SEK: 'sv-SE', KES: 'sw-KE', GHS: 'en-GH',
}

/** Pure formatter, safe anywhere: formatMoney(1260, 'NGN') → "₦1,260.00". */
export const formatMoney = (amount: number, currency = 'NGN') => {
  const safeCurrency = currency?.toUpperCase() || 'NGN'
  return new Intl.NumberFormat(CURRENCY_LOCALE_MAP[safeCurrency] ?? 'en-US', { style: 'currency', currency: safeCurrency }).format(amount ?? 0)
}
