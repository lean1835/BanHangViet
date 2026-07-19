export const APP_LANGUAGE = "vi";
export const APP_LOCALE = "vi-VN";

export const NUMBER_FORMAT = {
  CURRENCY_SUFFIX: " đ",
  ZERO_CURRENCY: "0 đ",
} as const;

export const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

export const DATE_FORMAT = {
  EMPTY_FULL: "--",
  EMPTY_SHORT: "---",
  PAD_LENGTH: 2,
  PAD_CHARACTER: "0",
  MONTH_INDEX_OFFSET: 1,
  DATE_SEPARATOR: "/",
  DATE_TIME_SEPARATOR: " ",
} as const;

export const ACTIVITY_TIMESTAMP_FORMAT = {
  ISO_DATE_SEPARATOR: "T",
  DISPLAY_DATE_SEPARATOR: " ",
  LENGTH: 19,
} as const;
