import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../modules/auth/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem("token");
  let user: User | null = null;
  
  if (token) {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        user = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Failed to parse initial user from localStorage", e);
    }
  }

  return {
    user,
    token,
    isAuthenticated: !!token,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
