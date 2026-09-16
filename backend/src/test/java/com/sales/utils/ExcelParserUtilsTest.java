package com.sales.utils;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ExcelParserUtilsTest {

    @Test
    @DisplayName("Tạo file Excel mẫu thành công và kiểm tra tiêu đề các cột")
    void generateProductImportTemplate_Success() throws Exception {
        byte[] templateBytes = ExcelParserUtils.generateProductImportTemplate();

        assertNotNull(templateBytes);
        assertTrue(templateBytes.length > 0);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(templateBytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            assertNotNull(sheet);

            Row headerRow = sheet.getRow(0);
            assertNotNull(headerRow);

            assertEquals("Mã SKU", headerRow.getCell(0).getStringCellValue());
            assertEquals("Tên hàng hóa", headerRow.getCell(1).getStringCellValue());
            assertEquals("Đơn vị tính", headerRow.getCell(2).getStringCellValue());
            assertEquals("Giá bán", headerRow.getCell(3).getStringCellValue());
            assertEquals("% Thuế suất", headerRow.getCell(4).getStringCellValue());
        }
    }

    @Test
    @DisplayName("Kiểm tra đọc giá trị ô Excel dạng String và Numeric")
    void cellParsingHelpers() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet();
            Row row = sheet.createRow(0);

            Cell cellStr = row.createCell(0);
            cellStr.setCellValue("  Sản phẩm A  ");

            Cell cellNum = row.createCell(1);
            cellNum.setCellValue(150000.50);

            assertEquals("Sản phẩm A", ExcelParserUtils.getCellValueAsString(cellStr));
            assertEquals(new BigDecimal("150000.5"), ExcelParserUtils.getCellValueAsBigDecimal(cellNum));
        }
    }

    @Test
    @DisplayName("Đọc số có dấu phẩy tiếng Việt '150000,5' -> Chuyển thành BigDecimal 150000.5")
    void getCellValueAsBigDecimal_VietnameseComma_Success() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet();
            Row row = sheet.createRow(0);
            Cell cellComma = row.createCell(0);
            cellComma.setCellValue("150000,5");

            assertEquals(new BigDecimal("150000.5"), ExcelParserUtils.getCellValueAsBigDecimal(cellComma));
        }
    }

    @Test
    @DisplayName("Đọc số dạng chuỗi có 1 dấu chấm phân cách hàng nghìn '50.000' -> Chuyển thành BigDecimal 50000")
    void getCellValueAsBigDecimal_SingleDotThousandsSeparator_Success() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet();
            Row row = sheet.createRow(0);
            Cell cell50k = row.createCell(0);
            cell50k.setCellValue("50.000");

            Cell cell100k = row.createCell(1);
            cell100k.setCellValue("100.000");

            Cell cellMillion = row.createCell(2);
            cellMillion.setCellValue("1.500.000");

            assertEquals(new BigDecimal("50000"), ExcelParserUtils.getCellValueAsBigDecimal(cell50k));
            assertEquals(new BigDecimal("100000"), ExcelParserUtils.getCellValueAsBigDecimal(cell100k));
            assertEquals(new BigDecimal("1500000"), ExcelParserUtils.getCellValueAsBigDecimal(cellMillion));
        }
    }

    @Test
    @DisplayName("Chuỗi rác không đúng định dạng số -> Ném NumberFormatException")
    void getCellValueAsBigDecimal_GarbageString_ThrowsNumberFormatException() throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet();
            Row row = sheet.createRow(0);
            Cell cellGarbage = row.createCell(0);
            cellGarbage.setCellValue("chuỗi rác");

            assertThrows(NumberFormatException.class, () -> ExcelParserUtils.getCellValueAsBigDecimal(cellGarbage));
        }
    }
}
