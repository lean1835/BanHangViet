import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "@/constants/app";
import type { IUser } from "@/modules/auth/types/IAuth";
import { isTokenExpired } from "@/utils/jwt";

interface IAuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getInitialState = (): IAuthState => {
  let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  let user: IUser | null = null;
  
  if (token && isTokenExpired(token)) {
    token = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } else if (token) {
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
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, action.payload);
    },
    updateUser: (state, action: PayloadAction<Partial<IUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateToken, updateUser } = authSlice.actions;
export default authSlice.reducer;
