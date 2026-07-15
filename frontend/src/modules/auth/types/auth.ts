export interface Household {
  id: string;
  name: string;
  taxCode: string;
  phoneNumber: string;
  address: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  household: Household | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  householdName: string;
  taxCode: string;
  householdPhone: string;
  householdAddress: string;
  fullName: string;
  username: string;
  password?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}
