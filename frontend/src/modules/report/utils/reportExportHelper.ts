/**
 * Tiện ích tải tệp Blob nhị phân (Excel .xlsx, CSV, v.v.) trực tiếp trên trình duyệt
 */
export const downloadBlobFile = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

/**
 * Tạo tên tệp Excel chuẩn kèm mốc thời gian (timestamp)
 * Ví dụ: report_gross_profit_20260916_143000.xlsx
 */
export const generateReportFileName = (reportType: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  return `report_${reportType.toLowerCase()}_${timestamp}.xlsx`;
};
