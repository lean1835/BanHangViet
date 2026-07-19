import { SHIFT_STATUS } from "@/constants/shift";

type TShiftStatus = (typeof SHIFT_STATUS)[keyof typeof SHIFT_STATUS];

export interface IApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface IShiftResponse {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  householdId: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCashExpected: number | null;
  closingCashActual: number | null;
  differenceAmount: number | null;
  differenceReason: string | null;
  status: TShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IOpenShiftRequest {
  openingCash: number;
  userId?: string;
}

export interface ICloseShiftRequest {
  closingCashActual: number;
  differenceReason?: string;
}
