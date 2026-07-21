import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "@/constants/app";
import type { IUser } from "@/modules/auth/types/IAuth";

interface IAuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getInitialState = (): IAuthState => {
  let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  let user: IUser | null = null;
  
  if (token) {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (savedUser) {
        user = JSON.parse(savedUser);
      }
    } catch {
      token = null;
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
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
      action: PayloadAction<{ token: string; user: IUser }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, action.payload.token);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
