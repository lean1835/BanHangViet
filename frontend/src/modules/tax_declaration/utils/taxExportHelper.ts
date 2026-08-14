import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import type {
  ITaxDeclarationSummary,
  ITaxAnnexInvoice,
} from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

/**
 * Xuất Mẫu tờ khai 01/CNKD và Bảng kê đính kèm sang tệp PDF chuẩn in A4
 */
export const exportTaxDeclarationToPdf = async (
  elementId: string,
  summary: ITaxDeclarationSummary
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Không tìm thấy khung nội dung tờ khai thuế để xuất PDF.");
  }

  // Chụp ảnh canvas của element Mẫu tờ khai với tỷ lệ scale 2x để nét
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  const safePeriod = summary.periodCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `ToKhaiThue_01_CNKD_${safePeriod}_${summary.year}.pdf`;
  pdf.save(fileName);

  return true;
};

/**
 * Xuất Tờ khai và Bảng kê hóa đơn bán ra sang tệp Excel (.xlsx) gồm 2 Sheet
 */
export const exportTaxDeclarationToExcel = (
  summary: ITaxDeclarationSummary,
  annexInvoices: ITaxAnnexInvoice[]
): boolean => {
  const workbook = XLSX.utils.book_new();

  // ----------------------------------------------------
  // SHEET 1: TỜ KHAI 01/CNKD
  // ----------------------------------------------------
  const declarationRows: Array<Array<string | number>> = [
    ["CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
    ["Độc lập - Tự do - Hạnh phúc"],
    [""],
    ["TỜ KHAI THUẾ ĐỐI VỚI HỘ KINH DOANH, CÁ NHÂN KINH DOANH"],
    [`Mẫu số 01/CNKD - Mô phỏng hệ thống Bán Hàng Việt (${summary.year})`],
    [`Kỳ tính thuế: ${summary.periodLabel} | Trạng thái: ${summary.status === "LOCKED" ? "Đã chốt sổ" : "Đang mở"}`],
    [""],
    ["[01] Tên người nộp thuế / Hộ kinh doanh:", summary.householdName],
    ["[02] Mã số thuế:", summary.taxCode],
    ["[03] Người đại diện hộ kinh doanh:", summary.representativeName || "Chưa cập nhật"],
    ["[04] Địa chỉ kinh doanh:", summary.address],
    ["[05] Điện thoại liên hệ:", summary.phoneNumber],
    [""],
    [
      "STT",
      "Nhóm ngành nghề / Mức thuế suất",
      "Doanh thu tính thuế (VND)",
      "Thuế suất GTGT (%)",
      "Tiền thuế GTGT (VND)",
      "Thuế suất TNCN (%)",
      "Tiền thuế TNCN (VND)",
      "Tổng thuế phải nộp (VND)",
    ],
  ];

  summary.taxGroups.forEach((group, idx) => {
    declarationRows.push([
      idx + 1,
      group.categoryLabel,
      group.revenueBeforeTax,
      `${group.vatRatePercent}%`,
      group.vatAmount,
      `${group.pitRatePercent}%`,
      group.pitAmount,
      group.totalTaxAmount,
    ]);
  });

  // Dòng tổng cộng
  declarationRows.push([
    "",
    "TỔNG CỘNG NGHĨA VỤ THUẾ TRONG KỲ",
    summary.totalRevenue,
    "-",
    summary.totalVatAmount,
    "-",
    summary.totalPitAmount,
    summary.totalPayableTaxAmount,
  ]);

  declarationRows.push([""]);
  declarationRows.push([
    "Tổng số tiền thuế phải nộp bằng số:",
    `${formatCurrency(summary.totalPayableTaxAmount)}`,
  ]);
  declarationRows.push([
    "Cam đoan số liệu khai báo trung thực, khớp với hóa đơn điện tử phát hành.",
  ]);

  const declarationSheet = XLSX.utils.aoa_to_sheet(declarationRows);
  XLSX.utils.book_append_sheet(workbook, declarationSheet, "To_Khai_01_CNKD");

  // ----------------------------------------------------
  // SHEET 2: PHỤ LỤC BẢNG KÊ HÓA ĐƠN BÁN RA (01-2/BK-HĐKD)
  // ----------------------------------------------------
  const annexRows: Array<Array<string | number>> = [
    ["BẢNG KÊ HOÁ ĐƠN, CHỨNG TỪ HÀNG HÓA DỊCH VỤ BÁN RA"],
    [`Phụ lục 01-2/BK-HĐKD đính kèm tờ khai ${summary.periodLabel}`],
    [`Hộ kinh doanh: ${summary.householdName} | MST: ${summary.taxCode}`],
    [""],
    [
      "STT",
      "Ký hiệu mẫu số & Ký hiệu HĐ",
      "Số hóa đơn",
      "Ngày lập hóa đơn",
      "Tên người mua hàng",
      "Mã số thuế người mua",
      "Doanh thu chưa thuế (VND)",
      "Thuế suất (%)",
      "Tiền thuế (VND)",
      "Tổng thanh toán (VND)",
      "Mã Cơ quan Thuế",
      "Ghi chú",
    ],
  ];

  annexInvoices.forEach((inv, idx) => {
    annexRows.push([
      idx + 1,
      inv.invoiceSeries,
      inv.invoiceNumber,
      inv.issuedDate,
      inv.buyerName,
      inv.buyerTaxCode || "-",
      inv.preTaxAmount,
      `${inv.taxRatePercentage}%`,
      inv.taxAmount,
      inv.finalAmount,
      inv.taxAuthorityCode || "ĐÃ CẤP MÃ",
      inv.isAdjustment ? "Hóa đơn điều chỉnh giảm (NCL-11)" : "Hóa đơn gốc",
    ]);
  });

  const annexSheet = XLSX.utils.aoa_to_sheet(annexRows);
  XLSX.utils.book_append_sheet(workbook, annexSheet, "Bang_Ke_01_2_BK");

  const safePeriod = summary.periodCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `ToKhai_BangKe_Thue_${safePeriod}_${summary.year}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return true;
};

/**
 * Xuất dữ liệu tờ khai thuế dưới định dạng XML mô phỏng Cổng dịch vụ eTax
 */
export const exportTaxDeclarationToXml = (
  summary: ITaxDeclarationSummary,
  annexInvoices: ITaxAnnexInvoice[]
): boolean => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<HDonDienTu xmlns="http://kekhaithue.gdt.gov.vn/tkhaithue/2026">
  <ThongTinChung>
    <PhienBan>2.0.1</PhienBan>
    <LoaiToKhai>01/CNKD</LoaiToKhai>
    <TenToKhai>Tờ khai thuế đối với hộ kinh doanh, cá nhân kinh doanh</TenToKhai>
    <KyTinhThue>${summary.periodCode}</KyTinhThue>
    <NamTinhThue>${summary.year}</NamTinhThue>
    <TrangThaiKy>${summary.status}</TrangThaiKy>
    <NgayLap>${new Date().toISOString()}</NgayLap>
  </ThongTinChung>
  <NguoiNopThue>
    <TenNNT><![CDATA[${summary.householdName}]]></TenNNT>
    <MST>${summary.taxCode}</MST>
    <NguoiDaiDien><![CDATA[${summary.representativeName || ""}]]></NguoiDaiDien>
    <DiaChi><![CDATA[${summary.address}]]></DiaChi>
    <DienThoai>${summary.phoneNumber}</DienThoai>
    <CoQuanThueQuanLy><![CDATA[${summary.taxAuthorityName}]]></CoQuanThueQuanLy>
  </NguoiNopThue>
  <NghiaVuThue>
    <TongDoanhThu>${summary.totalRevenue}</TongDoanhThu>
    <TongThueGTGT>${summary.totalVatAmount}</TongThueGTGT>
    <TongThueTNCN>${summary.totalPitAmount}</TongThueTNCN>
    <TongThuePhaiNop>${summary.totalPayableTaxAmount}</TongThuePhaiNop>
    <ChiTietNhomThue>
      ${summary.taxGroups
        .map(
          (g) => `
      <Nhom>
        <TenNhom><![CDATA[${g.categoryLabel}]]></TenNhom>
        <ThueSuat>${g.taxRatePercentage}</ThueSuat>
        <DoanhThu>${g.revenueBeforeTax}</DoanhThu>
        <ThueGTGT>${g.vatAmount}</ThueGTGT>
        <ThueTNCN>${g.pitAmount}</ThueTNCN>
        <TongThue>${g.totalTaxAmount}</TongThue>
      </Nhom>`
        )
        .join("")}
    </ChiTietNhomThue>
  </NghiaVuThue>
  <PhuLucBangKe>
    <TongSoHoaDon>${annexInvoices.length}</TongSoHoaDon>
    <DanhSachHoaDon>
      ${annexInvoices
        .map(
          (inv) => `
      <HoaDon>
        <KyHieu>${inv.invoiceSeries}</KyHieu>
        <SoHoaDon>${inv.invoiceNumber}</SoHoaDon>
        <NgayLap>${inv.issuedDate}</NgayLap>
        <NguoiMua><![CDATA[${inv.buyerName}]]></NguoiMua>
        <MSTNguoiMua>${inv.buyerTaxCode || ""}</MSTNguoiMua>
        <DoanhThuChuaThue>${inv.preTaxAmount}</DoanhThuChuaThue>
        <ThueSuat>${inv.taxRatePercentage}</ThueSuat>
        <TienThue>${inv.taxAmount}</TienThue>
        <TongTien>${inv.finalAmount}</TongTien>
        <MaCQT>${inv.taxAuthorityCode || ""}</MaCQT>
        <DieuChinhGiam>${inv.isAdjustment ? "1" : "0"}</DieuChinhGiam>
      </HoaDon>`
        )
        .join("")}
    </DanhSachHoaDon>
  </PhuLucBangKe>
</HDonDienTu>`;

  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safePeriod = summary.periodCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `eTax_ToKhai_${safePeriod}_${summary.year}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
};
