import { CUSTOMER_FORM_DEFAULTS } from "../customer";
import type { ICustomer } from "@/modules/customer/types/ICustomer";

export const MOCK_CUSTOMERS: ICustomer[] = [
  {
    id: "c1",
    name: "Nguyễn Văn A",
    phone: "0987654321",
    email: "anv@gmail.com",
    address: "123 Lê Lợi, Q.1, TP.HCM",
    creditLimit: 5_000_000,
    debt: CUSTOMER_FORM_DEFAULTS.INITIAL_DEBT,
  },
  {
    id: "c2",
    name: "Trần Thị B",
    phone: "0979081780",
    email: "btt@gmail.com",
    address: "456 Nguyễn Thị Minh Khai, Q.3, TP.HCM",
    creditLimit: 3_000_000,
    debt: 500_000,
  },
  {
    id: "c3",
    name: "Công ty TNHH Việt Nhật",
    phone: "0283899999",
    email: "contact@vietnhat.vn",
    address: "789 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM",
    creditLimit: 10_000_000,
    debt: 1_200_000,
  },
  {
    id: "c4",
    name: "Phạm Quốc Cường",
    phone: "0933445566",
    email: "cuongpq@yahoo.com",
    address: "12 Nguyễn Trãi, Q.5, TP.HCM",
    creditLimit: 2_000_000,
    debt: 2_500_000,
  },
];
