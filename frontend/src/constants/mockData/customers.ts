import { CUSTOMER_FORM_DEFAULTS } from "../customer";

export const MOCK_CUSTOMERS = [
  {
    id: "c1",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    email: "anv@gmail.com",
    creditLimit: 5_000_000,
    debt: CUSTOMER_FORM_DEFAULTS.INITIAL_DEBT,
  },
  {
    id: "c2",
    name: "Trần Thị B",
    phone: "0901234567",
    email: "btt@gmail.com",
    creditLimit: 3_000_000,
    debt: 500_000,
  },
  {
    id: "c3",
    name: "Lê Hoàng Nam",
    phone: "0912345678",
    email: "namlh@gmail.com",
    creditLimit: 10_000_000,
    debt: 1_200_000,
  },
] as const;
