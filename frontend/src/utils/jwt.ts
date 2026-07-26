/**
 * Utility function to check if a JWT token is expired.
 * Returns true if token is missing, malformed, or has passed its expiration time (`exp`).
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payloadBase64 = parts[1];
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload) as { exp?: number };
    if (typeof payload.exp !== "number") {
      return false;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTimeMs = payload.exp * 1000;
    return Date.now() >= expirationTimeMs;
  } catch {
    return true;
  }
};
