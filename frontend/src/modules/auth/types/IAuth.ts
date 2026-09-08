export interface IHousehold {
  id: string;
  name: string;
  taxCode: string;
  phoneNumber: string;
  address: string;
}

export interface IUser {
  id: string;
  username: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  roleId: string;
  pointOfSaleId?: string | null;
  pointOfSaleName?: string | null;
  posCode?: string | null;
  household: IHousehold | null;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

export interface IRegisterRequest {
  householdName: string;
  taxCode: string;
  householdPhone: string;
  householdAddress: string;
  fullName: string;
  username: string;
  password: string;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IForgotPasswordRequest {
  phoneNumber?: string;
  email?: string;
}

export interface IForgotPasswordResponse {
  phoneNumber?: string;
  email?: string;
  expiresInSeconds: number;
  message: string;
}

export interface IVerifyOtpRequest {
  phoneNumber?: string;
  email?: string;
  otpCode: string;
}

export interface IVerifyOtpResponse {
  valid: boolean;
  message: string;
}

export interface IResetPasswordRequest {
  phoneNumber?: string;
  email?: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IResetPasswordResponse {
  message: string;
}
