const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (!isRecord(error) || !isRecord(error.data)) {
    return fallbackMessage;
  }

  const message = error.data.message;
  return typeof message === "string" && message ? message : fallbackMessage;
};
