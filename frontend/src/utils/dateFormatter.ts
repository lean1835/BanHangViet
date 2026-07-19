import {
  ACTIVITY_TIMESTAMP_FORMAT,
  APP_LOCALE,
  DATE_FORMAT,
  DATE_TIME_FORMAT_OPTIONS,
} from "@/constants/format";

/**
 * Formats an ISO date/datetime string to full Vietnamese locale format.
 * Includes date and time with seconds.
 * @param isoString ISO string to format.
 * @returns Formatted string e.g. "19/07/2026, 18:30:00" or "--" if empty.
 */
export const formatDate = (isoString: string | null | undefined): string => {
  if (!isoString) return DATE_FORMAT.EMPTY_FULL;
  try {
    const date = new Date(isoString);
    return date.toLocaleString(APP_LOCALE, DATE_TIME_FORMAT_OPTIONS);
  } catch {
    return isoString;
  }
};

export const formatActivityTimestamp = (date: Date): string =>
  date
    .toISOString()
    .replace(
      ACTIVITY_TIMESTAMP_FORMAT.ISO_DATE_SEPARATOR,
      ACTIVITY_TIMESTAMP_FORMAT.DISPLAY_DATE_SEPARATOR,
    )
    .substring(0, ACTIVITY_TIMESTAMP_FORMAT.LENGTH);

/**
 * Formats an ISO date/datetime string to a short Vietnamese format without seconds.
 * @param isoString ISO string to format.
 * @returns Formatted string e.g. "19/07/2026 18:30" or "---" if empty.
 */
export const formatDateShort = (isoString: string | null | undefined): string => {
  if (!isoString) return DATE_FORMAT.EMPTY_SHORT;
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(
      DATE_FORMAT.PAD_LENGTH,
      DATE_FORMAT.PAD_CHARACTER,
    );
    const month = String(d.getMonth() + DATE_FORMAT.MONTH_INDEX_OFFSET).padStart(
      DATE_FORMAT.PAD_LENGTH,
      DATE_FORMAT.PAD_CHARACTER,
    );
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(
      DATE_FORMAT.PAD_LENGTH,
      DATE_FORMAT.PAD_CHARACTER,
    );
    const minutes = String(d.getMinutes()).padStart(
      DATE_FORMAT.PAD_LENGTH,
      DATE_FORMAT.PAD_CHARACTER,
    );
    return `${day}${DATE_FORMAT.DATE_SEPARATOR}${month}${DATE_FORMAT.DATE_SEPARATOR}${year}${DATE_FORMAT.DATE_TIME_SEPARATOR}${hours}:${minutes}`;
  } catch {
    return isoString ?? DATE_FORMAT.EMPTY_SHORT;
  }
};
