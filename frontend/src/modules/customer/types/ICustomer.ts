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
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
