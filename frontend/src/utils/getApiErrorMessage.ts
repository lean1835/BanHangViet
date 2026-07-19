import { isRecord } from "./typeGuards";

/**
 * Extracts a human-readable error message from an RTK Query error object.
 *
 * Checks (in order):
 *   1. `error.data.message` — standard API error body
 *   2. `error.error`        — network / fetch-level error string
 *   3. `fallbackMessage`    — caller-provided default
 *
 * @param error           The caught error (typically from RTK Query `.unwrap()`).
 * @param fallbackMessage Message returned when no meaningful error text is found.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!isRecord(error)) return fallbackMessage;

  // Case 1: API returned a JSON body with a `message` field
  const { data } = error;
  if (isRecord(data) && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  // Case 2: Network / fetch-level error string
  if (typeof error.error === "string" && error.error.trim()) {
    return error.error;
  }

  return fallbackMessage;
};
