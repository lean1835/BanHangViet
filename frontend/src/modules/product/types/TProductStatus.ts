import type { PRODUCT_STATUS } from "@/constants/product";

export type TProductStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
