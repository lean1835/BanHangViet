import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";
import { logout } from "@/stores/authSlice";
import { baseApi } from "@/stores/baseApi";
import { isTokenExpired } from "@/utils/jwt";
import { AUTH_EXPIRATION_CONFIG } from "@/constants/auth";

/**
 * Hook that monitors auth token expiration in real time.
 * Automatically dispatches logout when token is found to be expired.
 */
export const useAuthExpiration = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkExpiration = () => {
      if (isTokenExpired(token)) {
        dispatch(baseApi.util.resetApiState());
        dispatch(logout());
      }
    };

    // Immediate check on mount/token change
    checkExpiration();

    // Check on window focus or visibility change (user returning to tab)
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === "visible") {
        checkExpiration();
      }
    };

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    // Periodic check every 15 seconds
    const timer = setInterval(
      checkExpiration,
      AUTH_EXPIRATION_CONFIG.CHECK_INTERVAL_MS,
    );

    return () => {
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      clearInterval(timer);
    };
  }, [dispatch, isAuthenticated, token]);
};
