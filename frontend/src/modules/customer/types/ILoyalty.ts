import {
  POINT_TRANSACTION_TYPES,
  type TPointTransactionType,
} from "@/constants/loyalty";

export { POINT_TRANSACTION_TYPES, type TPointTransactionType };

export interface ILoyaltyProgramConfig {
  id: string;
  householdId: string;
  isEnabled: boolean;
  spendAmountPerPoint: number;
  pointValue: number;
  minPointsToRedeem: number;
  maxRedeemRatePerOrder: number;
  pointExpiryDays: number;
  updatedAt?: string;
}

export interface ILoyaltyProgramConfigRequest {
  isEnabled: boolean;
  spendAmountPerPoint: number;
  pointValue: number;
  minPointsToRedeem: number;
  maxRedeemRatePerOrder: number;
  pointExpiryDays: number;
}

export interface ICustomerLoyaltySummary {
  customerId: string;
  customerName: string;
  phoneNumber?: string;
  availablePoints: number;
  monetaryEquivalent: number;
  isEligibleToRedeem: boolean;
  minPointsToRedeem: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsDeductedOnReturn: number;
  nearestExpiringDate?: string | null;
  pointsExpiringSoon: number;
}

export interface IPointTransaction {
  id: string;
  customerId: string;
  customerName?: string;
  orderId?: string | null;
  orderNumber?: string | null;
  returnTicketId?: string | null;
  returnTicketNumber?: string | null;
  type: TPointTransactionType | string;
  pointsChange: number;
  balanceAfter: number;
  monetaryEquivalent?: number | null;
  description?: string | null;
  expiryDate?: string | null;
  createdByUserId?: string | null;
  createdByUsername?: string | null;
  createdAt: string;
}

export interface IApplyLoyaltyPointsRequest {
  pointsToRedeem: number;
}

export interface IAdjustPointsRequest {
  pointsChange: number;
  reason: string;
}

export interface IPointTransactionQueryParams {
  page?: number;
  size?: number;
  type?: string;
}

export interface IPointTransactionPageResponse {
  content: IPointTransaction[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
