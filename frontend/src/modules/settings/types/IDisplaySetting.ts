export type TFontSizeLevel = "STANDARD" | "LARGE" | "EXTRA_LARGE";
export type TButtonSizeLevel = "STANDARD" | "LARGE" | "EXTRA_LARGE";

export interface IUserDisplaySettingResponse {
  id?: string | null;
  userId?: string | null;
  username?: string | null;
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
  updatedAt?: string | null;
}

export interface IUpdateUserDisplaySettingRequest {
  simpleModeEnabled: boolean;
  fontSizeLevel: TFontSizeLevel;
  buttonSizeLevel: TButtonSizeLevel;
  showTextLabels: boolean;
  requireConfirmationDialog: boolean;
  highContrastEnabled: boolean;
  simplifiedPosLayout: boolean;
}

export interface IToggleSimpleModeRequest {
  enabled: boolean;
}

export interface IPosActionItem {
  code: string;
  label: string;
  icon: string;
  shortcut: string;
  isPrimary: boolean;
  isDestructive: boolean;
  description: string;
}

export interface IPosSimplifiedLayoutResponse {
  isSimpleMode: boolean;
  primaryActions: IPosActionItem[];
  moreActions: IPosActionItem[];
  fontScaleStyle: string;
  buttonMinHeightStyle: string;
}

export type TActionType = "CANCEL_ORDER" | "CANCEL_INVOICE";
export type TActionSeverity = "INFO" | "WARNING" | "DANGER";

export interface IActionConsequenceResponse {
  actionType: TActionType;
  actionName: string;
  targetId: string;
  targetCode: string;
  targetSummary: string;
  isIrreversible: boolean;
  severity: TActionSeverity;
  warningTitle: string;
  consequences: string[];
  confirmPrompt: string;
  confirmButtonText: string;
  cancelButtonText: string;
}
