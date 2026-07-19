import { APP_LOCALE, NUMBER_FORMAT } from "@/constants/format";

/**
 * Formats a number as Vietnamese Dong currency string.
 * @param val Number to format (accepts null/undefined).
 * @returns Formatted string e.g. "1.500.000 đ".
 */
export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return NUMBER_FORMAT.ZERO_CURRENCY;
  return val.toLocaleString(APP_LOCALE) + NUMBER_FORMAT.CURRENCY_SUFFIX;
};

/**
 * Formats a number using vi-VN locale without currency symbol.
 * Useful for displaying stock quantities.
 * @param value Number to format.
 * @returns Formatted number string e.g. "1.500".
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat(APP_LOCALE).format(value);
};
