import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  IUserDisplaySettingResponse,
  TButtonSizeLevel,
  TFontSizeLevel,
} from "@/modules/settings/types/IDisplaySetting";

export interface IDisplaySettingsState {
  simpleModeEnabled: boolean;
  fontSizeLevel: TFontSizeLevel;
  fontSizeLevelName: string;
  fontScalePercentage: number;
  buttonSizeLevel: TButtonSizeLevel;
  buttonSizeLevelName: string;
  buttonScalePercentage: number;
  minTouchHeight: string;
  showTextLabels: boolean;
  requireConfirmationDialog: boolean;
  highContrastEnabled: boolean;
  simplifiedPosLayout: boolean;
  isLoaded: boolean;
}

const STORAGE_KEY_DISPLAY = "app_display_settings_cached_v2";

const DEFAULT_DISPLAY_SETTINGS: IDisplaySettingsState = {
  simpleModeEnabled: false,
  fontSizeLevel: "STANDARD",
  fontSizeLevelName: "Tiêu chuẩn",
  fontScalePercentage: 100,
  buttonSizeLevel: "STANDARD",
  buttonSizeLevelName: "Tiêu chuẩn",
  buttonScalePercentage: 100,
  minTouchHeight: "40px",
  showTextLabels: true,
  requireConfirmationDialog: true,
  highContrastEnabled: false,
  simplifiedPosLayout: true,
  isLoaded: false,
};

export const applyDisplaySettingsToDom = (settings: IDisplaySettingsState) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isSimple = Boolean(settings.simpleModeEnabled);
  const fontLevel = settings.fontSizeLevel || "STANDARD";
  const buttonLevel = settings.buttonSizeLevel || "STANDARD";
  const isHighContrast = Boolean(settings.highContrastEnabled);

  // 1. High contrast setting
  if (isHighContrast) {
    root.setAttribute("data-high-contrast", "true");
  } else {
    root.removeAttribute("data-high-contrast");
  }

  // 2. Simple Mode flag
  if (isSimple) {
    root.setAttribute("data-simple-mode", "true");
  } else {
    root.removeAttribute("data-simple-mode");
  }

  // 3. Font scaling calculation
  root.setAttribute("data-font-size", fontLevel);
  root.setAttribute("data-button-size", buttonLevel);

  let rootFontSize = "";
  let fontScale = "1.0";
  let baseFontSize = "14px";
  let minTouchHeight = "";

  if (isSimple) {
    if (fontLevel === "EXTRA_LARGE") {
      rootFontSize = "21px";
      fontScale = "1.4";
      baseFontSize = "21px";
    } else {
      rootFontSize = "18px";
      fontScale = "1.25";
      baseFontSize = "18px";
    }

    if (buttonLevel === "EXTRA_LARGE") {
      minTouchHeight = "64px";
    } else {
      minTouchHeight = "52px";
    }
  } else {
    // Standard mode with custom font size adjustments
    if (fontLevel === "EXTRA_LARGE") {
      rootFontSize = "18px";
      fontScale = "1.3";
      baseFontSize = "18px";
    } else if (fontLevel === "LARGE") {
      rootFontSize = "16px";
      fontScale = "1.15";
      baseFontSize = "16px";
    } else {
      rootFontSize = "";
      fontScale = "1.0";
      baseFontSize = "14px";
      root.removeAttribute("data-font-size");
    }

    if (buttonLevel === "EXTRA_LARGE") {
      minTouchHeight = "52px";
    } else if (buttonLevel === "LARGE") {
      minTouchHeight = "44px";
    } else {
      minTouchHeight = "";
      root.removeAttribute("data-button-size");
    }
  }

  if (rootFontSize) {
    root.style.fontSize = rootFontSize;
  } else {
    root.style.fontSize = "";
  }

  if (fontScale !== "1.0") {
    root.style.setProperty("--app-font-scale", fontScale);
    root.style.setProperty("--app-base-font-size", baseFontSize);
  } else {
    root.style.removeProperty("--app-font-scale");
    root.style.removeProperty("--app-base-font-size");
  }

  if (minTouchHeight) {
    root.style.setProperty("--app-min-touch-height", minTouchHeight);
  } else {
    root.style.removeProperty("--app-min-touch-height");
  }
};

const getInitialState = (): IDisplaySettingsState => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_DISPLAY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const state = { ...DEFAULT_DISPLAY_SETTINGS, ...parsed, isLoaded: false };
        applyDisplaySettingsToDom(state);
        return state;
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_DISPLAY_SETTINGS;
};

export const displaySettingsSlice = createSlice({
  name: "displaySettings",
  initialState: getInitialState(),
  reducers: {
    setDisplaySettings: (
      state,
      action: PayloadAction<Partial<IUserDisplaySettingResponse>>
    ) => {
      const payload = action.payload;
      if (payload.simpleModeEnabled !== undefined) {
        state.simpleModeEnabled = payload.simpleModeEnabled;
      }
      if (payload.fontSizeLevel !== undefined) {
        state.fontSizeLevel = payload.fontSizeLevel;
      }
      if (payload.fontSizeLevelName !== undefined) {
        state.fontSizeLevelName = payload.fontSizeLevelName;
      }
      if (payload.fontScalePercentage !== undefined) {
        state.fontScalePercentage = payload.fontScalePercentage;
      }
      if (payload.buttonSizeLevel !== undefined) {
        state.buttonSizeLevel = payload.buttonSizeLevel;
      }
      if (payload.buttonSizeLevelName !== undefined) {
        state.buttonSizeLevelName = payload.buttonSizeLevelName;
      }
      if (payload.buttonScalePercentage !== undefined) {
        state.buttonScalePercentage = payload.buttonScalePercentage;
      }
      if (payload.minTouchHeight !== undefined) {
        state.minTouchHeight = payload.minTouchHeight;
      }
      if (payload.showTextLabels !== undefined) {
        state.showTextLabels = payload.showTextLabels;
      }
      if (payload.requireConfirmationDialog !== undefined) {
        state.requireConfirmationDialog = payload.requireConfirmationDialog;
      }
      if (payload.highContrastEnabled !== undefined) {
        state.highContrastEnabled = payload.highContrastEnabled;
      }
      if (payload.simplifiedPosLayout !== undefined) {
        state.simplifiedPosLayout = payload.simplifiedPosLayout;
      }
      state.isLoaded = true;

      applyDisplaySettingsToDom(state);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_DISPLAY, JSON.stringify(state));
        } catch {
          // ignore
        }
      }
    },

    resetDisplaySettings: (state) => {
      Object.assign(state, DEFAULT_DISPLAY_SETTINGS);
      applyDisplaySettingsToDom(DEFAULT_DISPLAY_SETTINGS);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_DISPLAY);
      }
    },
  },
});

export const { setDisplaySettings, resetDisplaySettings } =
  displaySettingsSlice.actions;

export default displaySettingsSlice.reducer;
