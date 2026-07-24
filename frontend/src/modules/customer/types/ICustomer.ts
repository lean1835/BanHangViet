export interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  creditLimit: number;
  debt: number;
  dueDate?: string;
  createdAt?: string;
}
