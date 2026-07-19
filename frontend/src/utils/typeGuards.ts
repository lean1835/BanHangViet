/**
 * Runtime type guard: checks if a value is a non-null object (plain record).
 * Use this instead of duplicating the check across modules.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
