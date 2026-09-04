import { APP_LOCALE, NUMBER_FORMAT } from "@/constants/format";

/**
 * Formats a number as Vietnamese Dong currency string.
 * @param val Number to format (accepts null/undefined).
 * @returns Formatted string e.g. "1.500.000 đ".
 */
export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return NUMBER_FORMAT.ZERO_CURRENCY;
  const rounded = Math.round(val);
  return rounded.toLocaleString(APP_LOCALE, { maximumFractionDigits: 0 }) + NUMBER_FORMAT.CURRENCY_SUFFIX;
};

/**
 * Formats a number using vi-VN locale without currency symbol.
 * Useful for displaying stock quantities.
 * @param value Number to format.
 * @returns Formatted number string e.g. "1.500".
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "0";
  const rounded = Math.round(value);
  return new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 0 }).format(rounded);
};

/**
 * Formats a currency number in a compact readable format.
 * Useful for small grid cells and mobile views.
 * Examples: 50.000.000 -> "50 tr", 1.500.000 -> "1.5 tr", 250.000 -> "250k", 5.000 -> "5k".
 * @param val Number to format.
 * @returns Compact formatted string e.g. "1.5 tr", "250k".
 */
export const formatCompactCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined || val === 0) return "0";
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";

  if (absVal >= 1_000_000_000) {
    const formatted = (absVal / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${formatted} tỷ`;
  }
  if (absVal >= 1_000_000) {
    const formatted = (absVal / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${formatted} tr`;
  }
  if (absVal >= 1_000) {
    const formatted = Math.round(absVal / 1_000);
    return `${sign}${formatted}k`;
  }
  return `${sign}${Math.round(absVal)}`;
};

