export interface ICustomer {
  id: string;
  householdId?: string;
  name: string;
  phone: string;
  phoneNumber?: string;
  taxCode?: string;
  email: string;
  address?: string;
  creditLimit: number;
  debt: number;
  currentDebt?: number;
  discountRate?: number;
  discountType?: "PERCENTAGE" | "CASH";
  totalSpent?: number;
  isVip?: boolean;
  loyaltyPoints?: number;
  reminderDaysBefore?: number;
  reminderDaysAfter?: number;
  defaultDeliveryChannel?: string;
  dueDate?: string;
  debtCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

