package com.viet.sales.utils;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ExcelParserUtils {

    private ExcelParserUtils() {
        // Utility class
    }

    public static byte[] generateProductImportTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

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
                    "Mã SKU", "Tên hàng hóa", "Đơn vị tính", "Giá nhập", "Giá bán", "% Thuế suất", "Tên nhóm hàng", "Tồn ban đầu"
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
            sampleRow.createCell(3).setCellValue(50000);
            sampleRow.createCell(4).setCellValue(85000);
            sampleRow.createCell(5).setCellValue(8);
            sampleRow.createCell(6).setCellValue("Đồ uống");
            sampleRow.createCell(7).setCellValue(100);

            workbook.write(out);
            return out.toByteArray();
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
            return BigDecimal.ZERO;
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        if (type == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        } else if (type == CellType.STRING) {
            String val = cell.getStringCellValue().trim();
            if (val.isEmpty()) return BigDecimal.ZERO;
            try {
                return new BigDecimal(val);
            } catch (Exception e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }
}
