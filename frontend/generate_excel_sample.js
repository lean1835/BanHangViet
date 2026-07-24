/* global console */
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

// 1. Define Headers & Detailed Descriptions
const headers = [
  "Mã SKU/Mã vạch (*)",
  "Tên mặt hàng (*)",
  "Đơn vị tính (*)",
  "Giá bán VNĐ (*)",
  "Giá vốn VNĐ",
  "Tồn kho ban đầu (*)",
  "Nhóm hàng hóa",
  "Mã thuế suất (*)",
  "Trạng thái (*)",
];

// 2. Realistic Sample Data Rows
const sampleRows = [
  [
    "8934567890123",
    "Sữa tươi tiệt trùng TH True Milk 1L",
    "Hộp",
    36000,
    30000,
    50,
    "Thực phẩm & Đồ uống",
    "VAT8",
    "Đang bán",
  ],
  [
    "8934567890124",
    "Bánh quy bơ Pháp Lu hộp 200g",
    "Hộp",
    52000,
    42000,
    30,
    "Thực phẩm & Đồ uống",
    "VAT8",
    "Đang bán",
  ],
  [
    "8934567890125",
    "Kẹo cao su Doublemint tép 5 lá",
    "Thanh",
    7000,
    5000,
    100,
    "Thực phẩm & Đồ uống",
    "VAT10",
    "Đang bán",
  ],
  [
    "8934567890126",
    "Nước giải khát Coca-Cola lon 330ml",
    "Lon",
    10000,
    8000,
    120,
    "Thực phẩm & Đồ uống",
    "VAT10",
    "Đang bán",
  ],
  [
    "5342858923987",
    "Dầu gội Clear Bạc Hà 180ml",
    "Chai",
    55000,
    45000,
    25,
    "Hóa mỹ phẩm",
    "VAT10",
    "Đang bán",
  ],
  [
    "2134123412341",
    "Nước mắm Nam Ngư Chinsu 500ml",
    "Chai",
    38000,
    30000,
    40,
    "Tiêu dùng & Gia vị",
    "VAT8",
    "Đang bán",
  ],
  [
    "8934567890127",
    "Bánh snack Khoai tây Poca 54g",
    "Gói",
    12000,
    9500,
    80,
    "Thực phẩm & Đồ uống",
    "VAT8",
    "Đang bán",
  ],
];

// 3. Instruction Rows
const instructionSheetData = [
  ["HƯỚNG DẪN NHẬP NẠP DANH MỤC HÀNG HÓA TỪ FILE EXCEL (NCL-09-CN-005)"],
  [""],
  ["Tên Cột", "Yêu cầu", "Kiểu dữ liệu", "Mô tả & Quy tắc kiểm tra (Validation)"],
  ["Mã SKU/Mã vạch (*)", "Bắt buộc", "Chuỗi / Số", "Mã hàng duy nhất. Không được trùng lặp với sản phẩm hiện có (TC-03)"],
  ["Tên mặt hàng (*)", "Bắt buộc", "Chuỗi", "Tên đầy đủ của sản phẩm kinh doanh"],
  ["Đơn vị tính (*)", "Bắt buộc", "Chuỗi", "Hộp, Chai, Lon, Gói, Cái, Kg, Thỏi, v.v."],
  ["Giá bán VNĐ (*)", "Bắt buộc", "Số nguyên", "Đơn giá bán lẻ (Giá trị phải lớn hơn 0) (TC-02)"],
  ["Giá vốn VNĐ", "Không bắt buộc", "Số nguyên", "Đơn giá mua/nhập kho để tính lợi nhuận"],
  ["Tồn kho ban đầu (*)", "Bắt buộc", "Số nguyên", "Số lượng hàng hóa hiện có trong kho (>= 0)"],
  ["Nhóm hàng hóa", "Không bắt buộc", "Chuỗi", "Tên nhóm danh mục (ví dụ: Thực phẩm & Đồ uống, Hóa mỹ phẩm,...)"],
  ["Mã thuế suất (*)", "Bắt buộc", "Chuỗi", "Mã thuế suất đang hiệu lực: VAT0 (0%), VAT5 (5%), VAT8 (8%), VAT10 (10%) (QTN-17)"],
  ["Trạng thái (*)", "Bắt buộc", "Chuỗi", "Trạng thái áp dụng: 'Đang bán' hoặc 'Ngừng bán'"],
];

// Create Workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Danh mục hàng hóa mẫu
const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

// Set column widths
dataSheet["!cols"] = [
  { wch: 18 }, // SKU
  { wch: 38 }, // Name
  { wch: 12 }, // Unit
  { wch: 14 }, // Price
  { wch: 14 }, // Cost Price
  { wch: 18 }, // Stock
  { wch: 24 }, // Group
  { wch: 16 }, // Tax Rate
  { wch: 14 }, // Status
];

XLSX.utils.book_append_sheet(wb, dataSheet, "Danh_Muc_Hang_Hoa");

// Sheet 2: Hướng dẫn chi tiết
const instructionSheet = XLSX.utils.aoa_to_sheet(instructionSheetData);
instructionSheet["!cols"] = [
  { wch: 25 },
  { wch: 15 },
  { wch: 15 },
  { wch: 60 },
];
XLSX.utils.book_append_sheet(wb, instructionSheet, "Huong_Dan_Quy_Tac");

// Output Paths
const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const xlsxPath = path.join(publicDir, "Mau_Nhap_Danh_Muc_Hang_Hoa.xlsx");
XLSX.writeFile(wb, xlsxPath);

console.log(`Successfully created sample Excel file at: ${xlsxPath}`);
