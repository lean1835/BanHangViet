import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
  ITaxSalesRegisterItemResponse,
} from "../types/ITaxDeclaration";

/**
 * Xuất Mẫu tờ khai 01/CNKD và Bảng kê đính kèm sang tệp PDF chuẩn in A4
 */
export const exportTaxDeclarationToPdf = async (
  elementId: string,
  periodName: string,
  year: number
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Không tìm thấy khung nội dung tờ khai thuế để xuất PDF.");
  }

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

  const safePeriod = periodName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `ToKhaiThue_01_CNKD_${safePeriod}_${year}.pdf`;
  pdf.save(fileName);

  return true;
};

/**
 * Xuất dữ liệu tờ khai thuế dưới định dạng XML mô phỏng Cổng dịch vụ eTax
 */
export const exportTaxDeclarationToXml = (
  period: ITaxDeclarationPeriodResponse,
  revenueSummary?: ITaxRevenueSummaryResponse,
  registerItems: ITaxSalesRegisterItemResponse[] = [],
  householdData?: {
    name: string;
    taxCode: string;
    representativeName?: string;
    address: string;
    phoneNumber: string;
  }
): boolean => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<HDonDienTu xmlns="http://kekhaithue.gdt.gov.vn/tkhaithue/2026">
  <ThongTinChung>
    <PhienBan>2.0.1</PhienBan>
    <LoaiToKhai>01/CNKD</LoaiToKhai>
    <TenToKhai>Tờ khai thuế đối với hộ kinh doanh, cá nhân kinh doanh</TenToKhai>
    <KyTinhThue>${period.periodName}</KyTinhThue>
    <NamTinhThue>${period.year}</NamTinhThue>
    <TrangThaiKy>${period.status}</TrangThaiKy>
    <NgayLap>${new Date().toISOString()}</NgayLap>
  </ThongTinChung>
  <NguoiNopThue>
    <TenNNT><![CDATA[${householdData?.name || "Hộ kinh doanh Bán Hàng Việt"}]]></TenNNT>
    <MST>${householdData?.taxCode || ""}</MST>
    <NguoiDaiDien><![CDATA[${householdData?.representativeName || ""}]]></NguoiDaiDien>
    <DiaChi><![CDATA[${householdData?.address || ""}]]></DiaChi>
    <DienThoai>${householdData?.phoneNumber || ""}</DienThoai>
    <CoQuanThueQuanLy>CHI CỤC THUẾ KHU VỰC QUẬN HẢI CHÂU</CoQuanThueQuanLy>
  </NguoiNopThue>
  <NghiaVuThue>
    <TongDoanhThu>${period.totalRevenue}</TongDoanhThu>
    <TongThuePhaiNop>${period.totalTaxAmount}</TongThuePhaiNop>
    <ChiTietNhomThue>
      ${(revenueSummary?.taxRateSummaries || [])
        .map(
          (g) => `
      <Nhom>
        <TenNhom><![CDATA[${g.taxRateName}]]></TenNhom>
        <ThueSuat>${g.taxRatePercentage}</ThueSuat>
        <DoanhThu>${g.revenueAmount}</DoanhThu>
        <TongThue>${g.taxAmount}</TongThue>
      </Nhom>`
        )
        .join("")}
    </ChiTietNhomThue>
  </NghiaVuThue>
  <PhuLucBangKe>
    <TongSoHoaDon>${registerItems.length}</TongSoHoaDon>
    <DanhSachHoaDon>
      ${registerItems
        .map(
          (inv) => `
      <HoaDon>
        <KyHieu>${inv.invoiceSymbol}</KyHieu>
        <SoHoaDon>${inv.invoiceNumber}</SoHoaDon>
        <NgayLap>${inv.issueDate}</NgayLap>
        <NguoiMua><![CDATA[${inv.buyerName || "Khách lẻ"}]]></NguoiMua>
        <MSTNguoiMua>${inv.buyerTaxCode || ""}</MSTNguoiMua>
        <DoanhThuChuaThue>${inv.revenueAmount}</DoanhThuChuaThue>
        <ThueSuat>${inv.taxRatePercentage}</ThueSuat>
        <TienThue>${inv.taxAmount}</TienThue>
        <LoaiHoaDon>${inv.invoiceType}</LoaiHoaDon>
      </HoaDon>`
        )
        .join("")}
    </DanhSachHoaDon>
  </PhuLucBangKe>
</HDonDienTu>`;

  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safePeriod = period.periodName.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `eTax_ToKhai_${safePeriod}_${period.year}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
};
