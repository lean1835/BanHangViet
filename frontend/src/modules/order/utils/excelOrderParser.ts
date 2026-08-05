import * as XLSX from "xlsx";
import type { IOrderImportRow } from "../types/IOrderImport";
import type { IProduct } from "@/modules/product/types/IProduct";
import { ORDER_PAYMENT_METHOD } from "@/constants/order";

export const PAYMENT_METHOD_OPTIONS = [
  { value: ORDER_PAYMENT_METHOD.CASH, label: "Tiền mặt" },
  { value: ORDER_PAYMENT_METHOD.BANK_TRANSFER, label: "Chuyển khoản" },
  { value: ORDER_PAYMENT_METHOD.DEBT, label: "Ghi nợ" },
];

export const COLUMN_NAME_MAP: Record<string, string> = {
  orderNumber: "Mã đơn hàng",
  customerName: "Tên khách hàng",
  productSku: "Mã SKU",
  productName: "Tên sản phẩm",
  quantity: "Số lượng",
  unitPrice: "Đơn giá",
  discountAmount: "Chiết khấu",
  paymentMethod: "Hình thức thanh toán",
};

export const normalizePaymentMethod = (input: string): string => {
  if (!input) return ORDER_PAYMENT_METHOD.CASH;
  const val = input.toString().trim();
  const lower = val.toLowerCase();

  if (lower === "tiền mặt" || lower === "cash" || lower === "tien mat") {
    return ORDER_PAYMENT_METHOD.CASH;
  }
  if (
    lower === "chuyển khoản" ||
    lower === "bank" ||
    lower === "ck" ||
    lower === "bank_transfer" ||
    lower === "chuyen khoan"
  ) {
    return ORDER_PAYMENT_METHOD.BANK_TRANSFER;
  }
  if (lower === "ghi nợ" || lower === "nợ" || lower === "debt" || lower === "ghi no") {
    return ORDER_PAYMENT_METHOD.DEBT;
  }

  // Return original input so validation triggers if method is unrecognized
  return val;
};

export const validateOrderImportRow = (
  row: IOrderImportRow,
  products: IProduct[] = [],
  productSkuMap?: Map<string, IProduct>,
  isCatalogLoaded: boolean = true
): IOrderImportRow => {
  const errors: Record<string, string> = {};

  // 0. Validate Order Number
  const orderNum = (row.orderNumber || "").toString().trim();
  if (!orderNum) {
    errors.orderNumber = "Mã đơn hàng không được để trống";
  }

  // 1. Validate SKU
  const sku = (row.productSku || "").toString().trim();
  if (!sku) {
    errors.productSku = "Mã SKU không được để trống";
  } else {
    const matchedProduct = productSkuMap
      ? productSkuMap.get(sku.toLowerCase())
      : products.find((p) => p.sku?.toLowerCase() === sku.toLowerCase());
    if (!matchedProduct && isCatalogLoaded) {
      errors.productSku = `Mã SKU '${sku}' không tồn tại trong hệ thống`;
    }
  }

  // 2. Validate Product Name
  const pName = (row.productName || "").toString().trim();
  if (!pName) {
    errors.productName = "Tên sản phẩm không được để trống";
  }

  // 3. Validate Quantity
  const qtyNum = typeof row.quantity === "number" ? row.quantity : Number(row.quantity);
  if (row.quantity === "" || row.quantity === null || row.quantity === undefined) {
    errors.quantity = "Số lượng không được để trống";
  } else if (isNaN(qtyNum) || qtyNum <= 0) {
    errors.quantity = "Số lượng phải là số lớn hơn 0";
  }

  // 4. Validate Unit Price
  const priceNum = typeof row.unitPrice === "number" ? row.unitPrice : Number(row.unitPrice);
  if (row.unitPrice === "" || row.unitPrice === null || row.unitPrice === undefined) {
    errors.unitPrice = "Đơn giá không được để trống";
  } else if (isNaN(priceNum) || priceNum < 0) {
    errors.unitPrice = "Đơn giá phải là số không âm";
  }

  // 5. Validate Discount
  const discNum =
    typeof row.discountAmount === "number" ? row.discountAmount : Number(row.discountAmount);
  if (row.discountAmount !== "" && row.discountAmount !== null && row.discountAmount !== undefined) {
    if (isNaN(discNum) || discNum < 0) {
      errors.discountAmount = "Chiết khấu phải là số không âm";
    }
  }

  // 6. Payment method normalization check
  const method = normalizePaymentMethod(row.paymentMethod);
  const validMethods = [
    ORDER_PAYMENT_METHOD.CASH,
    ORDER_PAYMENT_METHOD.BANK_TRANSFER,
    ORDER_PAYMENT_METHOD.DEBT,
  ];
  if (!validMethods.includes(method as (typeof validMethods)[number])) {
    errors.paymentMethod = "Hình thức thanh toán không hợp lệ (Tiền mặt, Chuyển khoản, Ghi nợ)";
  }

  return {
    ...row,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

export const parseOrderExcelFile = (
  file: File,
  products: IProduct[] = [],
  isCatalogLoaded: boolean = true
): Promise<IOrderImportRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          reject(new Error("Không thể đọc dữ liệu tệp Excel"));
          return;
        }

        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error("Tệp Excel không chứa sheet dữ liệu nào"));
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = (XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        }) || []) as Record<string, unknown>[];

        if (rawRows.length === 0) {
          resolve([]);
          return;
        }

        // Build product SKU map once for O(1) lookup
        const productSkuMap = new Map<string, IProduct>();
        products.forEach((p) => {
          if (p.sku) {
            productSkuMap.set(p.sku.toLowerCase(), p);
          }
        });

        const parsedRows: IOrderImportRow[] = rawRows.map(
          (rawRow: Record<string, unknown>, index: number) => {
            // Precise & prioritized key matching to prevent false substring matches (e.g. "Mã sản phẩm" matching "sản phẩm")
            const findValueExact = (
              exactKeys: string[],
              fallbackSubstrings: string[] = []
            ): string => {
              // Pass 1: Exact match (case-insensitive)
              for (const key of Object.keys(rawRow)) {
                const cleanKey = key.trim().toLowerCase();
                if (exactKeys.some((k) => cleanKey === k.toLowerCase())) {
                  return String(rawRow[key] ?? "").trim();
                }
              }
              // Pass 2: Fallback substring match
              for (const key of Object.keys(rawRow)) {
                const cleanKey = key.trim().toLowerCase();
                if (fallbackSubstrings.some((sub) => cleanKey.includes(sub.toLowerCase()))) {
                  return String(rawRow[key] ?? "").trim();
                }
              }
              return "";
            };

            const orderNumber = findValueExact(
              ["Mã đơn hàng", "Mã đơn", "Order Code"],
              ["mã đơn", "order code"]
            );
            const customerName = findValueExact(
              ["Tên khách hàng", "Khách hàng", "Customer"],
              ["khách hàng", "customer"]
            );
            const productSku = findValueExact(
              ["Mã SKU", "SKU", "Mã SP", "Mã sản phẩm", "Mã hàng"],
              ["sku", "mã sp", "mã hàng"]
            );
            let productName = findValueExact(
              ["Tên sản phẩm", "Tên hàng", "Tên SP", "Sản phẩm", "Product"],
              ["tên sản phẩm", "tên hàng", "tên sp"]
            );
            const quantityVal = findValueExact(
              ["Số lượng", "SL", "Quantity"],
              ["số lượng", "sl", "qty"]
            );
            const priceVal = findValueExact(
              ["Đơn giá", "Giá bán", "Giá", "Price"],
              ["đơn giá", "giá bán", "price"]
            );
            const discountVal = findValueExact(
              ["Chiết khấu", "Giảm giá", "Discount"],
              ["chiết khấu", "giảm giá", "discount"]
            );
            const paymentVal = findValueExact(
              ["Hình thức thanh toán", "Thanh toán", "Payment Method"],
              ["thanh toán", "payment"]
            );

            // Auto-lookup product details if productSku matches using O(1) Map
            const matchedProduct = productSku
              ? productSkuMap.get(productSku.toLowerCase())
              : undefined;

            if (!productName && matchedProduct) {
              productName = matchedProduct.name;
            }

            const quantity = quantityVal !== "" ? Number(quantityVal) : 1;
            const unitPrice =
              priceVal !== ""
                ? Number(priceVal)
                : matchedProduct?.price ?? 0;
            const discountAmount = discountVal !== "" ? Number(discountVal) : 0;
            const paymentMethod = normalizePaymentMethod(paymentVal);

            const draftRow: IOrderImportRow = {
              id: `import-row-${index + 1}-${Date.now()}`,
              rowNumber: index + 2, // Row 1 is header
              orderNumber: orderNumber || `DH-IMP-${index + 1}`,
              customerName: customerName || "Khách lẻ",
              productSku,
              productName,
              quantity,
              unitPrice,
              discountAmount,
              paymentMethod,
              errors: {},
              isValid: true,
              isSelected: false,
            };

            return validateOrderImportRow(draftRow, products, productSkuMap, isCatalogLoaded);
          }
        );

        resolve(parsedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Lỗi hệ thống khi đọc tệp Excel."));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const downloadOrderImportTemplate = () => {
  const headers = [
    "Mã đơn hàng",
    "Tên khách hàng",
    "Mã SKU",
    "Tên sản phẩm",
    "Số lượng",
    "Đơn giá",
    "Chiết khấu",
    "Hình thức thanh toán",
  ];

  const sampleData = [
    ["DH001", "Khách lẻ", "SP001", "Cà phê đen túi 500g", 2, 85000, 0, "Tiền mặt"],
    ["DH002", "Anh Minh", "SP002", "Trà sữa thái xanh", 5, 35000, 5000, "Chuyển khoản"],
    ["DH003", "Chị Hồng", "SP003", "Nước ép cam tươi", 1, 40000, 0, "Ghi nợ"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Import_Don_Hang");

  XLSX.writeFile(workbook, "Mau_Import_Don_Hang.xlsx");
};
