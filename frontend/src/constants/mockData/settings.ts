import { TAX_RATE_STATUS } from "../settings";

export const MOCK_TAX_RATES = [
  {
    code: "VAT-08",
    description: "Ngành bán buôn, bán lẻ hàng hóa thông thường",
    vatRateLabel: "1.0%",
    personalIncomeTaxRateLabel: "0.5%",
    status: TAX_RATE_STATUS.DEFAULT,
    statusLabel: "Mặc định",
  },
  {
    code: "VAT-05",
    description: "Ngành dịch vụ, ăn uống, thi công xây dựng",
    vatRateLabel: "2.0%",
    personalIncomeTaxRateLabel: "1.0%",
    status: TAX_RATE_STATUS.ACTIVE,
    statusLabel: "Hoạt động",
  },
] as const;
