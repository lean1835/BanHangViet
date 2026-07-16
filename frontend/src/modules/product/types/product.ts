export interface IProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  stockQuantity: number;
  status: "ACTIVE" | "INACTIVE";
  groupId: string | null;
  groupName: string | null;
  taxRateId: string;
  taxRateName: string;
  taxRatePercentage: number;
  createdAt: string;
  updatedAt: string;
}

// Danh mục Nhóm hàng hóa tĩnh khớp với seed data của DB
export const PRODUCT_GROUPS = [
  { id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99", name: "Thực phẩm & Đồ uống" },
  { id: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380baa", name: "Hóa mỹ phẩm" },
];

// Danh mục Thuế suất tĩnh khớp với seed data của DB
export const TAX_RATES = [
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
    name: "Thuế doanh thu phân phối hàng hóa (1%)",
    percentage: 1.0,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77",
    name: "Thuế doanh thu sản xuất/gia công (3%)",
    percentage: 3.0,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66",
    name: "Thuế doanh thu dịch vụ (5%)",
    percentage: 5.0,
  },
];

export interface IProductGroup {
  id: string;
  name: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}

