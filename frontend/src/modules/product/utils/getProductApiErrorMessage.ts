const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getProductApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!isRecord(error)) return fallbackMessage;

  const { data } = error;
  if (isRecord(data) && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return typeof error.error === "string" && error.error.trim()
    ? error.error
    : fallbackMessage;
};
