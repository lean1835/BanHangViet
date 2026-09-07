export interface IUserProfileResponse {
  id: string;
  username: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  roleCode: string;
  roleName: string;
  householdId?: string | null;
  householdName?: string | null;
  pointOfSaleId?: string | null;
  pointOfSaleName?: string | null;
  posCode?: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
  passwordChangedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpdateProfileRequest {
  fullName: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IChangePasswordResponse {
  token: string;
}

export interface IUpdatePhoneSendOtpRequest {
  newPhoneNumber: string;
}

export interface IUpdatePhoneSendOtpResponse {
  phoneNumber: string;
  expiresInSeconds: number;
  message: string;
}

export interface IUpdatePhoneVerifyOtpRequest {
  newPhoneNumber: string;
  otpCode: string;
}
