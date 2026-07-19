export const APP_BRAND = {
  PREFIX: "Bán Hàng",
  SUFFIX: "Việt",
  FULL_NAME: "Bán Hàng Việt",
  DEMO_LABEL: "Demo Trải nghiệm Nghiệp vụ",
  SYSTEM_DESCRIPTION: "Hệ thống Bán hàng & Hóa đơn điện tử",
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "token",
  AUTH_USER: "user",
} as const;

export const APP_FALLBACKS = {
  HOUSEHOLD_NAME: "Chủ hộ Tạp Hóa Việt",
  USERNAME: "chuho_viet",
  BRANCH_NAME: "Chi nhánh chính",
} as const;

export const CONNECTION_STATUS = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
} as const;

export const APP_MESSAGES = {
  LOADING: "Đang tải...",
  ROLE_LABEL: "Vai trò:",
  GREETING_PREFIX: "Xin chào,",
  LOGOUT: "Đăng xuất",
  EXIT_DEMO: "✕ Thoát Demo",
  NETWORK_TOGGLE_TITLE: "Nhấp để chuyển trạng thái mạng",
  OFFLINE_CONFLICT_LABEL: "Mô phỏng xung đột offline",
} as const;
export const DEMO_WORKSPACE_DEFAULTS = {
  IS_ONLINE: true,
  SIMULATE_CONFLICT: false,
} as const;

export const ACTIVITY_LOG_CONFIG = {
  ID_PREFIX: "l",
  START_INDEX: 1,
} as const;

export const getNextActivityLogId = (logCount: number): string =>
  `${ACTIVITY_LOG_CONFIG.ID_PREFIX}${
    logCount + ACTIVITY_LOG_CONFIG.START_INDEX
  }`;

export const APP_ELEMENT_IDS = {
  CONFLICT_TOGGLE: "conflict-toggle",
} as const;

export const APP_ERRORS = {
  DEMO_PROVIDER_REQUIRED:
    "useDashboardDemo must be used inside DashboardDemoProvider",
} as const;

export const APP_SYMBOLS = {
  DIVIDER: "|",
  CHEVRON_RIGHT: "›",
} as const;

export const APP_TIMING = {
  DEFAULT_DEBOUNCE_MS: 300,
} as const;
