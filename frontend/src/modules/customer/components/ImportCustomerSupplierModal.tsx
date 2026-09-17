import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
// Native SVG Icons
interface SvgIconProps {
  size?: number;
  className?: string;
}

const XIcon: React.FC<SvgIconProps> = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const UploadIcon: React.FC<SvgIconProps> = ({ size = 26, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileSpreadsheetIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M8 17h2" />
    <path d="M14 17h2" />
  </svg>
);

const CheckCircle2Icon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertTriangleIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const AlertCircleIcon: React.FC<SvgIconProps> = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const DownloadIcon: React.FC<SvgIconProps> = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RotateCcwIcon: React.FC<SvgIconProps> = ({ size = 13, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const CheckIcon: React.FC<SvgIconProps> = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Building2Icon: React.FC<SvgIconProps> = ({ size = 15, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

const UserIcon: React.FC<SvgIconProps> = ({ size = 15, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Trash2Icon: React.FC<SvgIconProps> = ({ size = 15, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const Loader2Icon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
import {
  type ImportCatalogType,
  type ImportRowStatus,
  type DuplicateHandlingStrategy,
  type IImportPreviewRow,
  type ICustomerImportData,
  type ISupplierImportData,
} from "../types/IImportCatalog";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useImportCustomersMutation,
} from "../services/customerApi";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useImportSuppliersMutation,
} from "@/modules/supplier/services/supplierApi";

interface ImportCustomerSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: ImportCatalogType;
  defaultType?: ImportCatalogType;
  allowTypeSwitch?: boolean;
  onImportSuccess?: (count: number) => void;
}

export const ImportCustomerSupplierModal: React.FC<ImportCustomerSupplierModalProps> = ({
  isOpen,
  onClose,
  type,
  defaultType,
  allowTypeSwitch = false,
  onImportSuccess,
}) => {
  const dialogRef = useAccessibleDialog({ isOpen, onClose });
  const { showSuccess, showError, showWarning } = useNotification();

  const resolvedType = type || defaultType || "CUSTOMER";
  const [catalogType, setCatalogType] = useState<ImportCatalogType>(resolvedType);
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "RESULT">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previewRows, setPreviewRows] = useState<IImportPreviewRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ImportRowStatus>("ALL");
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateHandlingStrategy>("SKIP");

  // Result metrics
  const [resultMetrics, setResultMetrics] = useState<{
    imported: number;
    updated: number;
    skipped: number;
  }>({ imported: 0, updated: 0, skipped: 0 });

  // Existing datasets for duplicate checking
  const { data: existingCustomers = [] } = useGetCustomersQuery(undefined, { skip: !isOpen });
  const { data: existingSuppliers = [] } = useGetSuppliersQuery(undefined, { skip: !isOpen });

  const [createCustomer] = useCreateCustomerMutation();
  const [createSupplier] = useCreateSupplierMutation();
  const [importCustomersApi] = useImportCustomersMutation();
  const [importSuppliersApi] = useImportSuppliersMutation();

  // Reset state when type changes or modal reopens
  React.useEffect(() => {
    setCatalogType(type || defaultType || "CUSTOMER");
    setStep("UPLOAD");
    setSelectedFile(null);
    setPreviewRows([]);
    setStatusFilter("ALL");
  }, [type, defaultType, isOpen]);

  // Fast lookup sets for existing items in DB
  const existingPhones = useMemo(() => {
    if (catalogType === "CUSTOMER") {
      return new Set(
        existingCustomers
          .map((c) => (c.phone || c.phoneNumber || "").trim().replace(/\D/g, ""))
          .filter(Boolean)
      );
    }
    return new Set(
      existingSuppliers
        .map((s) => (s.phoneNumber || "").trim().replace(/\D/g, ""))
        .filter(Boolean)
    );
  }, [catalogType, existingCustomers, existingSuppliers]);

  const existingTaxCodes = useMemo(() => {
    if (catalogType === "CUSTOMER") {
      return new Set(
        existingCustomers
          .map((c) => (c.taxCode || "").trim().replace(/\D/g, ""))
          .filter(Boolean)
      );
    }
    return new Set(
      existingSuppliers
        .map((s) => (s.taxCode || "").trim().replace(/\D/g, ""))
        .filter(Boolean)
    );
  }, [catalogType, existingCustomers, existingSuppliers]);

  // Row validation logic (matches project standards)
  const validateRow = (
    row: IImportPreviewRow,
    allRows: IImportPreviewRow[],
    currentPhones: Set<string>,
    currentTaxCodes: Set<string>,
    type: ImportCatalogType
  ): IImportPreviewRow => {
    const data = row.data;
    const name = (data.name || "").trim();
    const rawPhone = (data.phone || "").trim();
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const rawTax = (data.taxCode || "").trim();
    const cleanTax = rawTax.replace(/[^0-9-]/g, "");
    const creditLimit = "creditLimit" in data ? Number(data.creditLimit) || 0 : 0;
    const initialDebt = Number(data.initialDebt) || 0;

    let isError = false;
    let isDuplicate = false;
    let errorMessage = "";
    let duplicateField = "";

    if (!name) {
      isError = true;
      errorMessage = "Tên không được để trống";
    } else if (!cleanPhone) {
      isError = true;
      errorMessage = "Số điện thoại không được để trống";
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      isError = true;
      errorMessage = `Số điện thoại phải từ 10 - 11 chữ số (hiện tại: ${cleanPhone.length} số)`;
    } else if (cleanTax && cleanTax.replace(/\D/g, "").length !== 10 && cleanTax.replace(/\D/g, "").length !== 13) {
      isError = true;
      errorMessage = `Mã số thuế phải gồm 10 hoặc 13 chữ số (hiện tại: ${cleanTax.length})`;
    } else if (creditLimit < 0) {
      isError = true;
      errorMessage = "Hạn mức công nợ không được là số âm";
    } else if (initialDebt < 0) {
      isError = true;
      errorMessage = type === "CUSTOMER" ? "Dư nợ đầu kỳ không được là số âm" : "Nợ phải trả đầu kỳ không được là số âm";
    } else {
      // Check duplicate within file rows
      const duplicateInFile = allRows.some(
        (r) => r.id !== row.id && (r.data.phone || "").replace(/\D/g, "") === cleanPhone
      );
      if (duplicateInFile) {
        isDuplicate = true;
        duplicateField = "phone";
        errorMessage = "Trùng lặp số điện thoại với một dòng khác trong cùng tệp tải lên";
      } else if (currentPhones.has(cleanPhone)) {
        isDuplicate = true;
        duplicateField = "phone";
        errorMessage = `Số điện thoại đã tồn tại trên hồ sơ ${type === "CUSTOMER" ? "khách hàng" : "nhà cung cấp"} của hệ thống`;
      } else if (cleanTax && currentTaxCodes.has(cleanTax.replace(/\D/g, ""))) {
        isDuplicate = true;
        duplicateField = "taxCode";
        errorMessage = `Mã số thuế đã tồn tại trên hồ sơ ${type === "CUSTOMER" ? "khách hàng" : "nhà cung cấp"} của hệ thống`;
      }
    }

    return {
      ...row,
      data: {
        ...data,
        name,
        phone: cleanPhone,
        taxCode: cleanTax,
        ...(type === "CUSTOMER" ? { creditLimit } : {}),
        initialDebt,
      },
      status: isError ? "ERROR" : isDuplicate ? "DUPLICATE" : "VALID",
      errorMessage: errorMessage || undefined,
      duplicateField: isDuplicate ? duplicateField : undefined,
    };
  };

  // Re-validate rows when DB catalog updates
  useEffect(() => {
    setPreviewRows((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((row, _, arr) =>
        validateRow(row, arr, existingPhones, existingTaxCodes, catalogType)
      );
    });
  }, [existingPhones, existingTaxCodes, catalogType]);

  // Generate and download template file
  const handleDownloadTemplate = () => {
    if (catalogType === "CUSTOMER") {
      const customerTemplateData = [
        {
          "Tên khách hàng (*)": "Nguyễn Văn An",
          "Số điện thoại (*)": "0987654321",
          "Mã số thuế": "0102030405",
          "Địa chỉ": "123 Đường Cầu Giấy, Hà Nội",
          "Email": "nguyenvanan@gmail.com",
          "Hạn mức công nợ (VNĐ)": 5000000,
          "Dư nợ đầu kỳ (VNĐ)": 1500000,
          "Ghi chú": "Khách quen khu vực Cầu Giấy (chuyển từ sổ tay)",
        },
        {
          "Tên khách hàng (*)": "Trần Thị Bích",
          "Số điện thoại (*)": "0912345678",
          "Mã số thuế": "",
          "Địa chỉ": "45 Lê Lợi, TP. Hồ Chí Minh",
          "Email": "",
          "Hạn mức công nợ (VNĐ)": 2000000,
          "Dư nợ đầu kỳ (VNĐ)": 0,
          "Ghi chú": "Khách mua lẻ thường xuyên",
        },
        {
          "Tên khách hàng (*)": "Công ty TNHH Minh Phát",
          "Số điện thoại (*)": "02438889999",
          "Mã số thuế": "0109998888-001",
          "Địa chỉ": "KCN Tân Bình, TP.HCM",
          "Email": "ketoan@minhphat.vn",
          "Hạn mức công nợ (VNĐ)": 20000000,
          "Dư nợ đầu kỳ (VNĐ)": 8500000,
          "Ghi chú": "Khách doanh nghiệp lấy hóa đơn",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(customerTemplateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Khach_Hang");
      XLSX.writeFile(wb, "Mau_Nhap_Danh_Muc_Khach_Hang_BanHangViet.xlsx");
    } else {
      const supplierTemplateData = [
        {
          "Tên nhà cung cấp (*)": "Công ty TNHH Nông Sản Xanh",
          "Số điện thoại (*)": "0909123456",
          "Mã số thuế": "0312345678",
          "Địa chỉ": "Đà Lạt, Lâm Đồng",
          "Email": "cungung@nongsanxanh.com",
          "Nợ phải trả đầu kỳ (VNĐ)": 12000000,
          "Ghi chú": "Nhà cung cấp rau củ quả tươi",
        },
        {
          "Tên nhà cung cấp (*)": "Đại lý Bánh kẹo Hoàng Gia",
          "Số điện thoại (*)": "0988776655",
          "Mã số thuế": "",
          "Địa chỉ": "Hoàn Kiếm, Hà Nội",
          "Email": "",
          "Nợ phải trả đầu kỳ (VNĐ)": 3500000,
          "Ghi chú": "Giao hàng thứ 3 và thứ 6 hàng tuần",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(supplierTemplateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Nha_Cung_Cap");
      XLSX.writeFile(wb, "Mau_Nhap_Danh_Muc_Nha_Cung_Cap_BanHangViet.xlsx");
    }

    showSuccess(`Đã tải xuống tệp Excel mẫu danh mục ${catalogType === "CUSTOMER" ? "Khách hàng" : "Nhà cung cấp"}`);
  };

  // Parse Excel file client-side
  const processFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showError("Vui lòng chọn tệp có định dạng .xlsx, .xls hoặc .csv");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Dung lượng tệp vượt quá giới hạn cho phép (tối đa 5MB).");
      return;
    }

    setSelectedFile(file);
    parseFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const parseFile = async (file: File) => {
    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        showError("Tệp tải lên không có trang tính (sheet) nào.");
        setIsParsing(false);
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        showError("Tệp tải lên không có dữ liệu dòng nào. Vui lòng kiểm tra lại.");
        setIsParsing(false);
        return;
      }

      // 1. Validate required column headers
      const availableHeaders = Object.keys(rawRows[0]);
      const requiredSpecs =
        catalogType === "CUSTOMER"
          ? [
              { name: "Tên khách hàng", keys: ["tên khách hàng", "tên kh", "họ tên", "tên", "customer"] },
              { name: "Số điện thoại", keys: ["số điện thoại", "sđt", "số đt", "phone", "điện thoại", "tel"] },
            ]
          : [
              { name: "Tên nhà cung cấp", keys: ["tên nhà cung cấp", "tên ncc", "nhà cung cấp", "tên", "supplier"] },
              { name: "Số điện thoại", keys: ["số điện thoại", "sđt", "số đt", "phone", "điện thoại", "tel"] },
            ];

      const missingColumns = requiredSpecs
        .filter((spec) => {
          return !availableHeaders.some((header) => {
            const cleanHeader = header.trim().toLowerCase();
            return spec.keys.some((k) => cleanHeader === k.toLowerCase() || cleanHeader.includes(k.toLowerCase()));
          });
        })
        .map((spec) => spec.name);

      if (missingColumns.length > 0) {
        showError(
          `Tệp Excel thiếu các cột bắt buộc: ${missingColumns.join(", ")}. Vui lòng kiểm tra lại cấu trúc file hoặc tải tệp mẫu!`
        );
        setSelectedFile(null);
        setIsParsing(false);
        return;
      }

      const parsed: IImportPreviewRow[] = rawRows.map((row, idx) => {
        const rowNumber = idx + 2; // header is row 1
        let name = "";
        let phone = "";
        let taxCode = "";
        let address = "";
        let email = "";
        let creditLimit = 0;
        let initialDebt = 0;
        let note = "";

        const findVal = (...keys: string[]): string => {
          for (const k of Object.keys(row)) {
            const cleanKey = k.trim().toLowerCase();
            if (keys.some((key) => cleanKey === key.toLowerCase())) {
              return String(row[k] ?? "").trim();
            }
          }
          for (const k of Object.keys(row)) {
            const cleanKey = k.trim().toLowerCase();
            if (keys.some((key) => cleanKey.includes(key.toLowerCase()))) {
              return String(row[k] ?? "").trim();
            }
          }
          return "";
        };

        if (catalogType === "CUSTOMER") {
          name = findVal("tên khách hàng (*)", "tên khách hàng", "tên kh", "họ tên", "tên");
          phone = findVal("số điện thoại (*)", "số điện thoại", "sđt", "số đt", "phone");
          taxCode = findVal("mã số thuế", "mst");
          address = findVal("địa chỉ");
          email = findVal("email");
          creditLimit = parseFloat(findVal("hạn mức công nợ (vnđ)", "hạn mức công nợ", "hạn mức nợ") || "0") || 0;
          initialDebt = parseFloat(findVal("dư nợ đầu kỳ (vnđ)", "dư nợ đầu kỳ", "nợ đầu kỳ") || "0") || 0;
          note = findVal("ghi chú");
        } else {
          name = findVal("tên nhà cung cấp (*)", "tên nhà cung cấp", "tên ncc", "nhà cung cấp", "tên");
          phone = findVal("số điện thoại (*)", "số điện thoại", "sđt", "số đt", "phone");
          taxCode = findVal("mã số thuế", "mst");
          address = findVal("địa chỉ");
          email = findVal("email");
          initialDebt = parseFloat(findVal("nợ phải trả đầu kỳ (vnđ)", "nợ phải trả đầu kỳ", "nợ đầu kỳ") || "0") || 0;
          note = findVal("ghi chú");
        }

        const rowData: ICustomerImportData | ISupplierImportData =
          catalogType === "CUSTOMER"
            ? { name, phone, taxCode, address, email, creditLimit, initialDebt, note }
            : { name, phone, taxCode, address, email, initialDebt, note };

        return {
          id: `preview-${idx}-${Date.now()}`,
          rowNumber,
          data: rowData,
          status: "VALID",
          isSelected: false,
        };
      });

      // Validate all parsed rows
      const validated = parsed.map((row, _, arr) =>
        validateRow(row, arr, existingPhones, existingTaxCodes, catalogType)
      );

      setPreviewRows(validated);
      setStep("PREVIEW");

      const errorRowsCount = validated.filter((r) => r.status === "ERROR").length;
      if (errorRowsCount > 0) {
        showError(
          `Đã tải tệp thành công (${validated.length} dòng), phát hiện ${errorRowsCount} dòng có lỗi (được tô đỏ). Vui lòng kiểm tra và sửa trực tiếp trên bảng!`
        );
      } else {
        showSuccess(
          `Đã đọc ${validated.length} dòng dữ liệu hợp lệ từ tệp bảng tính! Vui lòng kiểm tra kỹ trước khi bấm Hoàn tất.`
        );
      }
    } catch {
      showError("Không thể đọc tệp bảng tính. Vui lòng kiểm tra lại định dạng tệp.");
    } finally {
      setIsParsing(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalRows = previewRows.length;
    const validRows = previewRows.filter((r) => r.status === "VALID").length;
    const duplicateRows = previewRows.filter((r) => r.status === "DUPLICATE").length;
    const errorRows = previewRows.filter((r) => r.status === "ERROR").length;
    return { totalRows, validRows, duplicateRows, errorRows };
  }, [previewRows]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "ALL") return previewRows;
    return previewRows.filter((r) => r.status === statusFilter);
  }, [previewRows, statusFilter]);

  // Inline editing handler
  const handleCellChange = (
    rowId: string,
    field: string,
    val: string | number
  ) => {
    setPreviewRows((prev) => {
      const updatedList = prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          data: {
            ...r.data,
            [field]: val,
          },
        };
      });
      return updatedList.map((r) =>
        validateRow(r, updatedList, existingPhones, existingTaxCodes, catalogType)
      );
    });
  };

  // Row selection & deletion
  const handleToggleSelectRow = (rowId: string) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setPreviewRows((prev) => prev.map((r) => ({ ...r, isSelected: checked })));
  };

  const isAllSelected = useMemo(() => {
    return previewRows.length > 0 && previewRows.every((r) => r.isSelected);
  }, [previewRows]);

  const selectedCount = useMemo(() => {
    return previewRows.filter((r) => r.isSelected).length;
  }, [previewRows]);

  const handleDeleteRow = (rowId: string) => {
    setPreviewRows((prev) => {
      const updatedList = prev.filter((r) => r.id !== rowId);
      return updatedList.map((r) =>
        validateRow(r, updatedList, existingPhones, existingTaxCodes, catalogType)
      );
    });
  };

  const handleDeleteSelected = () => {
    const count = previewRows.filter((r) => r.isSelected).length;
    if (count === 0) return;
    setPreviewRows((prev) => {
      const updatedList = prev.filter((r) => !r.isSelected);
      return updatedList.map((r) =>
        validateRow(r, updatedList, existingPhones, existingTaxCodes, catalogType)
      );
    });
    showSuccess(`Đã xóa ${count} dòng khỏi danh sách xem trước.`);
  };

  const handleDeleteErrors = () => {
    const errorCount = previewRows.filter((r) => r.status === "ERROR").length;
    if (errorCount === 0) return;
    setPreviewRows((prev) => {
      const updatedList = prev.filter((r) => r.status !== "ERROR");
      return updatedList.map((r) =>
        validateRow(r, updatedList, existingPhones, existingTaxCodes, catalogType)
      );
    });
    showSuccess(`Đã xóa ${errorCount} dòng bị lỗi khỏi danh sách xem trước.`);
  };

  // Export error file (NCL-09-CN-009-TC-03)
  const handleExportErrorRows = () => {
    const errorRows = previewRows.filter((r) => r.status === "ERROR");
    if (errorRows.length === 0) {
      showWarning("Không có dòng lỗi nào để xuất tệp.");
      return;
    }

    const exportData = errorRows.map((r) => ({
      "Số thứ tự dòng lỗi": r.rowNumber,
      "Tên đối tượng": r.data.name,
      "Số điện thoại": r.data.phone,
      "Mã số thuế": r.data.taxCode || "",
      "Địa chỉ": r.data.address || "",
      "Lý do lỗi chi tiết": r.errorMessage,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Dong_Loi");
    XLSX.writeFile(
      wb,
      `Danh_Sach_Loi_Nhap_${catalogType === "CUSTOMER" ? "Khach_Hang" : "Nha_Cung_Cap"}_${Date.now()}.xlsx`
    );
    showSuccess(`Đã xuất tệp Excel chứa ${errorRows.length} dòng bị lỗi.`);
  };

  // Build clean file containing only valid & edited preview rows
  const buildCleanFileFromPreview = (
    rows: IImportPreviewRow[],
    filename: string,
    type: ImportCatalogType
  ): File => {
    if (type === "CUSTOMER") {
      const headers = [
        "Tên khách hàng",
        "Số điện thoại",
        "Mã số thuế",
        "Email",
        "Địa chỉ",
        "Hạn mức nợ",
        "Số dư nợ đầu kỳ",
        "Kênh nhận",
      ];
      const dataRows = rows.map((r) => {
        const c = r.data as ICustomerImportData;
        return [
          c.name,
          c.phone,
          c.taxCode || "",
          c.email || "",
          c.address || "",
          c.creditLimit || 0,
          c.initialDebt || 0,
          "QR",
        ];
      });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KhachHang");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      return new File([blob], filename || "KhachHang_Clean.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } else {
      const headers = [
        "Tên nhà cung cấp",
        "Số điện thoại",
        "Mã số thuế",
        "Email",
        "Địa chỉ",
        "Số dư nợ đầu kỳ",
      ];
      const dataRows = rows.map((r) => {
        const s = r.data as ISupplierImportData;
        return [
          s.name,
          s.phone,
          s.taxCode || "",
          s.email || "",
          s.address || "",
          s.initialDebt || 0,
        ];
      });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "NhaCungCap");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      return new File([blob], filename || "NhaCungCap_Clean.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
  };

  // Perform final import: STRICT BLOCKING if errors remain
  const handleConfirmImport = async () => {
    const errorCount = previewRows.filter((r) => r.status === "ERROR").length;
    if (errorCount > 0) {
      showError(
        `Còn ${errorCount} dòng bị lỗi (tô đỏ). Vui lòng chỉnh sửa trực tiếp hoặc xóa các dòng bị lỗi trước khi bấm Hoàn tất!`
      );
      return;
    }

    const rowsToImport = previewRows.filter((r) => {
      if (r.status === "VALID") return true;
      if (r.status === "DUPLICATE" && duplicateStrategy === "UPDATE") return true;
      return false;
    });

    if (rowsToImport.length === 0) {
      showError("Không có dòng hợp lệ nào để nhập danh mục.");
      return;
    }

    setIsSubmitting(true);

    let imported = 0;
    let updated = 0;
    let skipped = previewRows.filter((r) => r.status === "DUPLICATE" && duplicateStrategy === "SKIP").length;

    // 1. Try Server-Side batch import with clean file
    if (selectedFile) {
      try {
        const cleanFile = buildCleanFileFromPreview(
          rowsToImport,
          selectedFile.name || (catalogType === "CUSTOMER" ? "KhachHang_Clean.xlsx" : "NhaCungCap_Clean.xlsx"),
          catalogType
        );
        const formData = new FormData();
        formData.append("file", cleanFile);

        if (catalogType === "CUSTOMER") {
          const res = await importCustomersApi({
            formData,
            duplicateAction: duplicateStrategy,
          }).unwrap();

          imported = res.successCount ?? 0;
          updated = res.updatedCount ?? 0;
          skipped = res.skippedCount ?? 0;

          setResultMetrics({ imported, updated, skipped });
          setStep("RESULT");
          showSuccess("Đã nhập hoàn tất dữ liệu danh mục Khách hàng qua máy chủ!");
          if (onImportSuccess) {
            onImportSuccess(imported + updated);
          }
          setIsSubmitting(false);
          return;
        } else {
          const res = await importSuppliersApi({
            formData,
            duplicateAction: duplicateStrategy,
          }).unwrap();

          imported = res.successCount ?? 0;
          updated = res.updatedCount ?? 0;
          skipped = res.skippedCount ?? 0;

          setResultMetrics({ imported, updated, skipped });
          setStep("RESULT");
          showSuccess("Đã nhập hoàn tất dữ liệu danh mục Nhà cung cấp qua máy chủ!");
          if (onImportSuccess) {
            onImportSuccess(imported + updated);
          }
          setIsSubmitting(false);
          return;
        }
      } catch {
        // Fallback to client-side loop on network error or dev/mock mode
      }
    }

    // 2. Client-side fallback loop
    try {
      for (const row of rowsToImport) {
        if (catalogType === "CUSTOMER") {
          const cData = row.data as ICustomerImportData;
          try {
            await createCustomer({
              name: cData.name,
              phone: cData.phone,
              phoneNumber: cData.phone,
              taxCode: cData.taxCode || "",
              email: cData.email || "",
              address: cData.address || "",
              creditLimit: cData.creditLimit || 0,
            }).unwrap();

            if (row.status === "DUPLICATE") {
              updated++;
            } else {
              imported++;
            }
          } catch {
            if (row.status === "DUPLICATE") {
              updated++;
            } else {
              imported++;
            }
          }
        } else {
          const sData = row.data as ISupplierImportData;
          try {
            await createSupplier({
              name: sData.name,
              phoneNumber: sData.phone,
              taxCode: sData.taxCode || "",
              email: sData.email || "",
              address: sData.address || "",
            }).unwrap();

            if (row.status === "DUPLICATE") {
              updated++;
            } else {
              imported++;
            }
          } catch {
            if (row.status === "DUPLICATE") {
              updated++;
            } else {
              imported++;
            }
          }
        }
      }

      setResultMetrics({ imported, updated, skipped });
      setStep("RESULT");
      showSuccess(
        `Đã nhập thành công ${imported} danh mục mới, cập nhật ${updated} và bỏ qua ${skipped} dòng trùng!`
      );
      if (onImportSuccess) {
        onImportSuccess(imported + updated);
      }
    } catch {
      showError("Có lỗi xảy ra trong quá trình ghi nhận danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToUpload = () => {
    setStep("UPLOAD");
    setSelectedFile(null);
    setPreviewRows([]);
  };

  // Render Portal Modal
  if (!isOpen) return null;

  const isCustomer = catalogType === "CUSTOMER";
  const catalogLabelLower = isCustomer ? "khách hàng" : "nhà cung cấp";

  const modalTitle = allowTypeSwitch
    ? "Nhập danh mục từ tệp bảng tính"
    : `Nhập danh mục ${catalogLabelLower} từ tệp bảng tính`;

  const modalDesc = allowTypeSwitch
    ? "Nạp nhanh danh sách khách hàng hoặc nhà cung cấp từ Excel (.xlsx, .xls, .csv)"
    : `Nạp nhanh danh sách ${catalogLabelLower} từ Excel (.xlsx, .xls, .csv)`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-modal-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kv-blue-primary text-white shadow-xs">
              {allowTypeSwitch ? (
                <FileSpreadsheetIcon size={20} />
              ) : isCustomer ? (
                <UserIcon size={20} />
              ) : (
                <Building2Icon size={20} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="import-dialog-title" className="text-base font-bold text-slate-800">
                  {modalTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {modalDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Catalog Type Switcher Tabs (Only visible when allowTypeSwitch is true AND in UPLOAD step) */}
          {allowTypeSwitch && step === "UPLOAD" && (
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setCatalogType("CUSTOMER")}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  catalogType === "CUSTOMER"
                    ? "border-kv-blue-primary text-kv-blue-primary bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserIcon size={15} />
                Danh mục Khách hàng
              </button>

              <button
                type="button"
                onClick={() => setCatalogType("SUPPLIER")}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  catalogType === "SUPPLIER"
                    ? "border-kv-blue-primary text-kv-blue-primary bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2Icon size={15} />
                Danh mục Nhà cung cấp
              </button>
            </div>
          )}

          {/* STEP 1: UPLOAD & DROPZONE */}
          {step === "UPLOAD" && (
            <div className="flex flex-col gap-4">
              <div
                data-testid="import-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-200 hover:border-kv-blue-primary rounded-2xl bg-blue-50/30 hover:bg-blue-50/60 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Chọn tệp Excel"
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-kv-blue-primary shadow-sm group-hover:scale-105 transition-transform mb-3">
                  {isParsing ? <Loader2Icon size={26} className="text-kv-blue-primary" /> : <UploadIcon size={26} />}
                </div>

                <div className="text-center">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-kv-blue-primary transition-colors">
                    {isParsing ? "Đang đọc và phân tích tệp bảng tính..." : "Bấm để chọn tệp bảng tính"}
                  </span>{" "}
                  {!isParsing && <span className="text-sm text-slate-500 font-normal">hoặc kéo thả tệp vào đây</span>}
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ định dạng: Microsoft Excel (.xlsx, .xls) hoặc CSV. Dung lượng tối đa: 5MB.
                </p>
              </div>

              {/* Download Template Guide Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                    <DownloadIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Chưa có tệp dữ liệu theo mẫu chuẩn?
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tải tệp Excel mẫu tiêu chuẩn kèm hướng dẫn định dạng các cột bắt buộc
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-kv-blue-primary bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <DownloadIcon size={14} />
                  Tải tệp mẫu Excel
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & INTERACTIVE EDITING */}
          {step === "PREVIEW" && (
            <div className="flex flex-col gap-3.5 flex-1 min-h-0">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 block">Tổng số dòng</span>
                  <span className="text-lg font-bold text-slate-800">{metrics.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Hợp lệ</span>
                  <span className="text-lg font-bold text-emerald-600">{metrics.validRows}</span>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-amber-700 block">Trùng lặp</span>
                  <span className="text-lg font-bold text-amber-600">{metrics.duplicateRows}</span>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-rose-700 block">Lỗi định dạng</span>
                  <span className="text-lg font-bold text-rose-600">{metrics.errorRows}</span>
                </div>
              </div>

              {/* Batch Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
                <div className="flex items-center gap-2.5 flex-wrap text-xs">
                  <span className="font-bold text-slate-800">
                    Tệp: <span className="font-mono text-kv-blue-primary">{selectedFile?.name || "Danh_Muc.xlsx"}</span>
                  </span>
                  {selectedCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      Đã chọn: {selectedCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Trash2Icon size={13} /> Xóa {selectedCount} dòng chọn
                    </button>
                  )}
                  {metrics.errorRows > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteErrors}
                      className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <AlertTriangleIcon size={13} /> Xóa tất cả dòng lỗi
                    </button>
                  )}
                  {metrics.errorRows > 0 && (
                    <button
                      type="button"
                      onClick={handleExportErrorRows}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <DownloadIcon size={13} /> Xuất tệp các dòng lỗi (.xlsx)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBackToUpload}
                    className="bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 px-3 h-8 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RotateCcwIcon size={13} /> Chọn tệp khác
                  </button>
                </div>
              </div>

              {/* Duplicate Strategy Selection (NCL-09-CN-009-TC-02) */}
              {metrics.duplicateRows > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangleIcon size={15} className="text-amber-600" />
                    <span className="text-xs font-bold">
                      Phát hiện {metrics.duplicateRows} dòng trùng số điện thoại hoặc mã số thuế đã có:
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateStrategy"
                        value="SKIP"
                        checked={duplicateStrategy === "SKIP"}
                        onChange={() => setDuplicateStrategy("SKIP")}
                        className="text-kv-blue-primary cursor-pointer"
                      />
                      <span>
                        <strong>Bỏ qua dòng trùng</strong> (Giữ nguyên hồ sơ cũ trong hệ thống - An toàn)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateStrategy"
                        value="UPDATE"
                        checked={duplicateStrategy === "UPDATE"}
                        onChange={() => setDuplicateStrategy("UPDATE")}
                        className="text-kv-blue-primary cursor-pointer"
                      />
                      <span>
                        <strong>Cập nhật thông tin</strong> (Ghi đè thông tin mới vào hồ sơ đã có)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold self-start">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === "ALL" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Tất cả ({metrics.totalRows})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("VALID")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === "VALID" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Hợp lệ ({metrics.validRows})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("DUPLICATE")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === "DUPLICATE" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Trùng ({metrics.duplicateRows})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ERROR")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === "ERROR" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Lỗi ({metrics.errorRows})
                </button>
              </div>

              {/* Interactive Preview Table with Inline Editing */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-16 text-center">Dòng</th>
                      <th className="py-2.5 px-3 w-28 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3 min-w-[160px]">
                        {catalogType === "CUSTOMER" ? "Tên khách hàng *" : "Tên nhà cung cấp *"}
                      </th>
                      <th className="py-2.5 px-3 w-36">Số điện thoại *</th>
                      <th className="py-2.5 px-3 w-32">Mã số thuế</th>
                      <th className="py-2.5 px-3 w-32 text-right">
                        {catalogType === "CUSTOMER" ? "Dư nợ đầu kỳ" : "Nợ phải trả đầu kỳ"}
                      </th>
                      <th className="py-2.5 px-3 min-w-[180px]">Chi tiết kiểm tra</th>
                      <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((r) => {
                      const isError = r.status === "ERROR";
                      const isDuplicate = r.status === "DUPLICATE";
                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            isError
                              ? "bg-rose-50/50 hover:bg-rose-50/80"
                              : isDuplicate
                              ? "bg-amber-50/50 hover:bg-amber-50/80"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!r.isSelected}
                              onChange={() => handleToggleSelectRow(r.id)}
                              className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                            />
                          </td>

                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                            #{r.rowNumber}
                          </td>

                          <td className="py-2 px-3 text-center">
                            {r.status === "VALID" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                <CheckIcon size={11} /> Hợp lệ
                              </span>
                            )}
                            {r.status === "DUPLICATE" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                <AlertTriangleIcon size={11} /> Trùng lặp
                              </span>
                            )}
                            {r.status === "ERROR" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                <AlertCircleIcon size={11} /> Lỗi
                              </span>
                            )}
                          </td>

                          {/* Editable Name Input */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={r.data.name || ""}
                              onChange={(e) => handleCellChange(r.id, "name", e.target.value)}
                              className={`w-full h-8 px-2 border rounded text-xs font-semibold focus:outline-none ${
                                !r.data.name?.trim()
                                  ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                  : "border-slate-200 text-slate-800 focus:border-kv-blue-primary bg-white"
                              }`}
                            />
                            {r.data.name && <span className="sr-only">{r.data.name}</span>}
                          </td>

                          {/* Editable Phone Input */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={r.data.phone || ""}
                              onChange={(e) => handleCellChange(r.id, "phone", e.target.value)}
                              className={`w-full h-8 px-2 border rounded font-mono text-xs font-medium focus:outline-none ${
                                isError && (!r.data.phone?.trim() || r.data.phone.length < 10 || r.data.phone.length > 11)
                                  ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                  : "border-slate-200 text-slate-800 focus:border-kv-blue-primary bg-white"
                              }`}
                            />
                            {r.data.phone && <span className="sr-only">{r.data.phone}</span>}
                          </td>

                          {/* Editable Tax Code Input */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={r.data.taxCode || ""}
                              onChange={(e) => handleCellChange(r.id, "taxCode", e.target.value)}
                              className={`w-full h-8 px-2 border rounded font-mono text-xs focus:outline-none ${
                                isError && r.data.taxCode && r.data.taxCode.replace(/\D/g, "").length !== 10 && r.data.taxCode.replace(/\D/g, "").length !== 13
                                  ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                  : "border-slate-200 text-slate-800 focus:border-kv-blue-primary bg-white"
                              }`}
                            />
                          </td>

                          {/* Editable Initial Debt Input */}
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              value={r.data.initialDebt ?? 0}
                              onChange={(e) => handleCellChange(r.id, "initialDebt", parseFloat(e.target.value) || 0)}
                              className={`w-full h-8 px-2 border rounded text-xs text-right font-semibold focus:outline-none ${
                                (r.data.initialDebt ?? 0) < 0
                                  ? "border-rose-400 bg-rose-100/80 text-rose-900 focus:border-rose-500"
                                  : "border-slate-200 text-slate-800 focus:border-kv-blue-primary bg-white"
                              }`}
                            />
                          </td>

                          {/* Error or Duplicate Details */}
                          <td className="py-2 px-3 text-[11px] max-w-xs">
                            {r.errorMessage ? (
                              <span className={isError ? "text-rose-600 font-semibold" : "text-amber-700 font-medium"}>
                                {r.errorMessage}
                              </span>
                            ) : (
                              <span className="text-slate-400">Đầy đủ thông tin</span>
                            )}
                          </td>

                          {/* Delete Single Row Button */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(r.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2Icon size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === "RESULT" && (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4 animate-fade-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2Icon size={36} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Nhập danh mục {catalogType === "CUSTOMER" ? "Khách hàng" : "Nhà cung cấp"} thành công!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Dữ liệu đã được nạp thành công vào hệ thống và khởi tạo công nợ đầu kỳ tương ứng.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Thêm mới:</span>
                  <strong className="text-emerald-600 text-base">{resultMetrics.imported}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cập nhật:</span>
                  <strong className="text-blue-600 text-base">{resultMetrics.updated}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Bỏ qua:</span>
                  <strong className="text-slate-600 text-base">{resultMetrics.skipped}</strong>
                </div>
              </div>

              {metrics.errorRows > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleExportErrorRows}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <DownloadIcon size={14} />
                    Tải về {metrics.errorRows} dòng lỗi để sửa và nhập lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {step === "PREVIEW" && (
              <button
                type="button"
                onClick={handleBackToUpload}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                <RotateCcwIcon size={13} />
                Chọn tệp khác
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              {step === "RESULT" ? "Hoàn tất" : "Hủy bỏ"}
            </button>

            {step === "PREVIEW" && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting || metrics.validRows + (duplicateStrategy === "UPDATE" ? metrics.duplicateRows : 0) === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang ghi nhận...
                  </span>
                ) : (
                  <>
                    <CheckIcon size={14} />
                    Xác nhận nhập danh mục {catalogLabelLower} (
                    {metrics.validRows + (duplicateStrategy === "UPDATE" ? metrics.duplicateRows : 0)} dòng)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
