package com.sales.common.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

@Slf4j
public class ExcelParserUtils {

    private ExcelParserUtils() {
        // Utility class
    }

    public static byte[] generateProductImportTemplate() throws Exception {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                Sheet sheet = workbook.createSheet("Danh_Muc_Hang_Hoa");

                // Header Style
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                Row headerRow = sheet.createRow(0);
                String[] headers = {
                        "Mã SKU", "Tên hàng hóa", "Đơn vị tính", "Giá bán", "% Thuế suất", "Tên nhóm hàng", "Tồn ban đầu"
                };

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 20 * 256);
                }

                // Sample Row
                Row sampleRow = sheet.createRow(1);
                sampleRow.createCell(0).setCellValue("SP001");
                sampleRow.createCell(1).setCellValue("Cà phê đen túi 500g");
                sampleRow.createCell(2).setCellValue("Gói");
                sampleRow.createCell(3).setCellValue(85000);
                sampleRow.createCell(4).setCellValue(8);
                sampleRow.createCell(5).setCellValue("Đồ uống");
                sampleRow.createCell(6).setCellValue(100);

                workbook.write(out);
                return out.toByteArray();
            } finally {
                workbook.dispose();
            }
        }
    }

    public static String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        switch (type) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                // Check if numeric is integer
                double numValue = cell.getNumericCellValue();
                if (numValue == (long) numValue) {
                    return String.valueOf((long) numValue);
                }
                return String.valueOf(numValue);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    public static BigDecimal getCellValueAsBigDecimal(Cell cell) {
        if (cell == null) {
            return null;
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        if (type == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        } else if (type == CellType.STRING) {
            String val = cell.getStringCellValue();
            if (val == null) return null;
            val = val.trim();
            if (val.isEmpty()) return null;

            // Dọn dẹp khoảng trắng, ký hiệu tiền tệ
            val = val.replaceAll("[₫đĐvVnNdD\\s]", "");
            if (val.isEmpty()) return null;

            // Xử lý dấu phân cách hàng nghìn / thập phân
            if (val.contains(".") && val.contains(",")) {
                int lastDot = val.lastIndexOf('.');
                int lastComma = val.lastIndexOf(',');
                if (lastDot > lastComma) {
                    // Định dạng 1,234.56
                    val = val.replace(",", "");
                } else {
                    // Định dạng 1.234,56
                    val = val.replace(".", "").replace(",", ".");
                }
            } else if (val.contains(".")) {
                long dotCount = val.chars().filter(ch -> ch == '.').count();
                int lastDot = val.lastIndexOf('.');
                if (dotCount > 1 || (dotCount == 1 && val.substring(lastDot + 1).length() == 3)) {
                    // 100.000 hoặc 100.000.000 (dấu chấm phân cách hàng nghìn)
                    val = val.replace(".", "");
                }
            } else if (val.contains(",")) {
                long commaCount = val.chars().filter(ch -> ch == ',').count();
                if (commaCount > 1) {
                    // 100,000,000
                    val = val.replace(",", "");
                } else {
                    // 100,5
                    val = val.replace(",", ".");
                }
            }
            return new BigDecimal(val);
        }
        return null;
    }

    public static byte[] generateCustomerImportTemplate() throws Exception {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Danh_Muc_Khach_Hang");

                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                Row headerRow = sheet.createRow(0);
                String[] headers = {
                        "Tên khách hàng (*)", "Số điện thoại (*)", "Mã số thuế", "Email", "Địa chỉ",
                        "Hạn mức nợ (VNĐ)", "Số dư nợ đầu kỳ (VNĐ)", "Kênh nhận HĐ (QR/EMAIL/ZALO)"
                };

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 22 * 256);
                }

                Row sampleRow = sheet.createRow(1);
                sampleRow.createCell(0).setCellValue("Nguyễn Văn An");
                sampleRow.createCell(1).setCellValue("0912345678");
                sampleRow.createCell(2).setCellValue("0312345678");
                sampleRow.createCell(3).setCellValue("an.nguyen@example.com");
                sampleRow.createCell(4).setCellValue("123 Lê Lợi, Q.1, TP.HCM");
                sampleRow.createCell(5).setCellValue(5000000);
                sampleRow.createCell(6).setCellValue(1500000);
                sampleRow.createCell(7).setCellValue("QR");

                workbook.write(out);
                return out.toByteArray();
            } finally {
                workbook.dispose();
            }
        }
    }

    public static byte[] generateSupplierImportTemplate() throws Exception {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Danh_Muc_Nha_Cung_Cap");

                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                Row headerRow = sheet.createRow(0);
                String[] headers = {
                        "Tên nhà cung cấp (*)", "Số điện thoại (*)", "Mã số thuế", "Email", "Địa chỉ",
                        "Số dư nợ đầu kỳ (VNĐ)", "Ghi chú"
                };

                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 22 * 256);
                }

                Row sampleRow = sheet.createRow(1);
                sampleRow.createCell(0).setCellValue("Công ty TNHH Phân Phối Việt");
                sampleRow.createCell(1).setCellValue("0987654321");
                sampleRow.createCell(2).setCellValue("0102030405");
                sampleRow.createCell(3).setCellValue("sales@phanphoiviet.vn");
                sampleRow.createCell(4).setCellValue("456 Nguyễn Trãi, Thanh Xuân, Hà Nội");
                sampleRow.createCell(5).setCellValue(12000000);
                sampleRow.createCell(6).setCellValue("Cung cấp đồ uống và tạp hóa");

                workbook.write(out);
                return out.toByteArray();
            } finally {
                workbook.dispose();
            }
        }
    }

    public static byte[] generateImportErrorWorkbook(String[] headers, java.util.List<java.util.List<String>> errorRows) throws Exception {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Dong_Loi");

                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 24 * 256);
                }

                int rIndex = 1;
                for (java.util.List<String> rowData : errorRows) {
                    Row r = sheet.createRow(rIndex++);
                    for (int cIndex = 0; cIndex < rowData.size(); cIndex++) {
                        r.createCell(cIndex).setCellValue(rowData.get(cIndex));
                    }
                }

                workbook.write(out);
                return out.toByteArray();
            } finally {
                workbook.dispose();
            }
        }
    }
}
