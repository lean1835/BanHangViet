export interface ICustomer {
  id: string;
  householdId?: string;
  name: string;
  phone: string;
  phoneNumber?: string;
  email: string;
  address?: string;
  creditLimit: number;
  debt: number;
  currentDebt?: number;
  discountRate?: number;
  discountType?: "PERCENTAGE" | "CASH";
  totalSpent?: number;
  isVip?: boolean;
  reminderDaysBefore?: number;
  reminderDaysAfter?: number;
  dueDate?: string;
  debtCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

