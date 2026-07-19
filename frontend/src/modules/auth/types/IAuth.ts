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
  roleId: string;
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
