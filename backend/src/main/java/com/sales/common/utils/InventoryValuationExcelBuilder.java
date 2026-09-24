package com.sales.common.utils;
import com.sales.modules.inventory.dto.response.InventoryValuationItemResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationReportResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationSummaryResponse;
import com.sales.modules.inventory.dto.response.MissingCostProductResponse;
import com.sales.modules.product.dto.response.ProductGroupValuationResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class InventoryValuationExcelBuilder {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public static byte[] buildExcelWorkbook(BusinessHousehold household, InventoryValuationReportResponse report, String actorFullName) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            DataFormat dataFormat = workbook.createDataFormat();

            // Font & Styles
            Font fontBold = workbook.createFont();
            fontBold.setBold(true);

            Font fontTitle = workbook.createFont();
            fontTitle.setBold(true);
            fontTitle.setFontHeightInPoints((short) 16);
            fontTitle.setColor(IndexedColors.DARK_BLUE.getIndex());

            Font fontSection = workbook.createFont();
            fontSection.setBold(true);
            fontSection.setFontHeightInPoints((short) 12);
            fontSection.setColor(IndexedColors.DARK_BLUE.getIndex());

            // Title Style
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(fontTitle);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            // Subtitle / Meta Style
            CellStyle metaStyle = workbook.createCellStyle();
            metaStyle.setFont(fontBold);

            // Table Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(fontBold);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Text Cell Style
            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setBorderTop(BorderStyle.THIN);
            textStyle.setBorderBottom(BorderStyle.THIN);
            textStyle.setBorderLeft(BorderStyle.THIN);
            textStyle.setBorderRight(BorderStyle.THIN);
            textStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Text Center Cell Style
            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.cloneStyleFrom(textStyle);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Number Cell Style (Integer/Qty)
            CellStyle qtyStyle = workbook.createCellStyle();
            qtyStyle.cloneStyleFrom(textStyle);
            qtyStyle.setDataFormat(dataFormat.getFormat("#,##0.000"));
            qtyStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Currency Cell Style
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(textStyle);
            currencyStyle.setDataFormat(dataFormat.getFormat("#,##0"));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Percent Cell Style
            CellStyle percentStyle = workbook.createCellStyle();
            percentStyle.cloneStyleFrom(textStyle);
            percentStyle.setDataFormat(dataFormat.getFormat("0.00%"));
            percentStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Summary / Total Styles (Độc lập từng style, tránh bug đột biến shared mutable state trong POI)
            CellStyle totalCurrencyStyle = workbook.createCellStyle();
            totalCurrencyStyle.cloneStyleFrom(currencyStyle);
            totalCurrencyStyle.setFont(fontBold);
            totalCurrencyStyle.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
            totalCurrencyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle totalQtyStyle = workbook.createCellStyle();
            totalQtyStyle.cloneStyleFrom(qtyStyle);
            totalQtyStyle.setFont(fontBold);
            totalQtyStyle.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
            totalQtyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle totalPercentStyle = workbook.createCellStyle();
            totalPercentStyle.cloneStyleFrom(percentStyle);
            totalPercentStyle.setFont(fontBold);
            totalPercentStyle.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
            totalPercentStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle totalText = workbook.createCellStyle();
            totalText.cloneStyleFrom(textStyle);
            totalText.setFont(fontBold);
            totalText.setAlignment(HorizontalAlignment.CENTER);
            totalText.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
            totalText.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Warning Header & Data Style
            CellStyle warningHeaderStyle = workbook.createCellStyle();
            warningHeaderStyle.cloneStyleFrom(headerStyle);
            warningHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());

            CellStyle warningTextStyle = workbook.createCellStyle();
            warningTextStyle.cloneStyleFrom(textStyle);
            warningTextStyle.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            warningTextStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ==========================================
            // SHEET 1: BÁO CÁO GIÁ TRỊ TỒN KHO
            // ==========================================
            Sheet sheet1 = workbook.createSheet("Giá Trị Tồn Kho");
            sheet1.setDisplayGridlines(true);

            int rowIdx = 0;

            // Header thông tin hộ kinh doanh
            Row r0 = sheet1.createRow(rowIdx++);
            String hhName = (household != null && household.getName() != null) ? household.getName().toUpperCase() : "";
            r0.createCell(0).setCellValue("HỘ KINH DOANH: " + sanitizeCellValue(hhName));
            r0.getCell(0).setCellStyle(metaStyle);

            Row r1 = sheet1.createRow(rowIdx++);
            String taxCode = (household != null && household.getTaxCode() != null) ? household.getTaxCode() : "N/A";
            r1.createCell(0).setCellValue("Mã số thuế: " + sanitizeCellValue(taxCode));

            Row r2 = sheet1.createRow(rowIdx++);
            String creatorName = (actorFullName != null) ? actorFullName : "Chủ hộ";
            r2.createCell(0).setCellValue("Thời điểm xuất: " + LocalDateTime.now().format(DATE_TIME_FORMATTER) + " | Người lập: " + sanitizeCellValue(creatorName));

            rowIdx++; // Dòng trống

            // Tiêu đề báo cáo
            Row titleRow = sheet1.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO GIÁ TRỊ TỒN KHO THEO GIÁ VỐN");
            titleCell.setCellStyle(titleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 10));

            // Ngày chốt báo cáo
            InventoryValuationSummaryResponse summary = report.getSummary();
            Row asOfRow = sheet1.createRow(rowIdx++);
            Cell asOfCell = asOfRow.createCell(0);
            String asOfText = (summary != null && summary.getAsOfDate() != null)
                    ? "Thời điểm chốt số liệu: " + summary.getAsOfDate().format(DATE_FORMATTER) + (Boolean.TRUE.equals(summary.getIsHistorical()) ? " (Kỳ kiểm kê quá khứ - Định giá theo giá vốn bình quân hiện hành)" : " (Thời gian thực)")
                    : "Thời điểm chốt: Ngày hiện tại";
            asOfCell.setCellValue(asOfText);
            CellStyle centerMeta = workbook.createCellStyle();
            centerMeta.setAlignment(HorizontalAlignment.CENTER);
            centerMeta.setFont(fontBold);
            asOfCell.setCellStyle(centerMeta);
            sheet1.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 10));

            rowIdx++; // Dòng trống

            // ==========================================
            // KHỐI TỔNG QUAN TOÀN KHO (KPI CARDS)
            // ==========================================
            Row sec1Row = sheet1.createRow(rowIdx++);
            Cell sec1Cell = sec1Row.createCell(0);
            sec1Cell.setCellValue("I. TỔNG QUAN TÀI CHÍNH KHO HÀNG");
            CellStyle secStyle = workbook.createCellStyle();
            secStyle.setFont(fontSection);
            sec1Cell.setCellStyle(secStyle);

            Row kpi1 = sheet1.createRow(rowIdx++);
            kpi1.createCell(0).setCellValue("Tổng số mặt hàng trong danh mục:");
            kpi1.createCell(2).setCellValue(summary != null && summary.getTotalProducts() != null ? summary.getTotalProducts() : 0);
            kpi1.createCell(4).setCellValue("Tổng giá trị tồn kho theo GIÁ VỐN:");
            Cell totalValCell = kpi1.createCell(6);
            totalValCell.setCellValue(summary != null && summary.getTotalInventoryValue() != null ? summary.getTotalInventoryValue().doubleValue() : 0.0);
            totalValCell.setCellStyle(currencyStyle);

            Row kpi2 = sheet1.createRow(rowIdx++);
            kpi2.createCell(0).setCellValue("Số mặt hàng đã có giá vốn:");
            kpi2.createCell(2).setCellValue(summary != null && summary.getValuedProductsCount() != null ? summary.getValuedProductsCount() : 0);
            kpi2.createCell(4).setCellValue("Tổng giá trị theo GIÁ BÁN LẺ:");
            Cell totalRetailCell = kpi2.createCell(6);
            totalRetailCell.setCellValue(summary != null && summary.getTotalRetailValue() != null ? summary.getTotalRetailValue().doubleValue() : 0.0);
            totalRetailCell.setCellStyle(currencyStyle);

            Row kpi3 = sheet1.createRow(rowIdx++);
            kpi3.createCell(0).setCellValue("Số mặt hàng CHƯA CÓ GIÁ VỐN:");
            kpi3.createCell(2).setCellValue(summary != null && summary.getMissingCostProductsCount() != null ? summary.getMissingCostProductsCount() : 0);
            kpi3.createCell(4).setCellValue("Lãi gộp tiềm năng (ước tính):");
            Cell profitCell = kpi3.createCell(6);
            profitCell.setCellValue(summary != null && summary.getPotentialGrossProfit() != null ? summary.getPotentialGrossProfit().doubleValue() : 0.0);
            profitCell.setCellStyle(currencyStyle);

            Row kpi4 = sheet1.createRow(rowIdx++);
            kpi4.createCell(0).setCellValue("Tổng số lượng tồn kho (hàng có vốn):");
            Cell stockQtyCell = kpi4.createCell(2);
            stockQtyCell.setCellValue(summary != null && summary.getTotalStockQuantity() != null ? summary.getTotalStockQuantity().doubleValue() : 0.0);
            stockQtyCell.setCellStyle(qtyStyle);
            kpi4.createCell(4).setCellValue("Số ngày tồn kho trung bình toàn kho:");
            kpi4.createCell(6).setCellValue((summary != null && summary.getAverageDaysInStock() != null ? summary.getAverageDaysInStock() : 0) + " ngày");

            rowIdx++; // Dòng trống

            // ==========================================
            // BẢNG 1: CƠ CẤU GIÁ TRỊ TỒN KHO THEO NHÓM HÀNG
            // ==========================================
            Row sec2Row = sheet1.createRow(rowIdx++);
            Cell sec2Cell = sec2Row.createCell(0);
            sec2Cell.setCellValue("II. CƠ CẤU GIÁ TRỊ TỒN KHO THEO NHÓM HÀNG");
            sec2Cell.setCellStyle(secStyle);

            Row groupHeader = sheet1.createRow(rowIdx++);
            String[] groupCols = {"STT", "Tên nhóm hàng", "Số mặt hàng", "Tổng số lượng tồn", "Giá trị tồn (Giá vốn)", "Giá trị tồn (Giá bán)", "Tỷ trọng vốn (%)", "Số ngày tồn TB"};
            for (int i = 0; i < groupCols.length; i++) {
                Cell cell = groupHeader.createCell(i);
                cell.setCellValue(groupCols[i]);
                cell.setCellStyle(headerStyle);
            }

            List<ProductGroupValuationResponse> groups = report.getGroupValuations();
            int grpStt = 1;
            BigDecimal sumGrpQty = BigDecimal.ZERO;
            BigDecimal sumGrpVal = BigDecimal.ZERO;
            BigDecimal sumGrpRetail = BigDecimal.ZERO;

            if (groups != null) {
                for (ProductGroupValuationResponse g : groups) {
                    Row grpRow = sheet1.createRow(rowIdx++);
                    grpRow.createCell(0).setCellValue(grpStt++);
                    grpRow.getCell(0).setCellStyle(centerStyle);

                    grpRow.createCell(1).setCellValue(sanitizeCellValue(g.getGroupName() != null ? g.getGroupName() : "Chưa phân nhóm"));
                    grpRow.getCell(1).setCellStyle(textStyle);

                    grpRow.createCell(2).setCellValue(g.getProductCount() != null ? g.getProductCount() : 0);
                    grpRow.getCell(2).setCellStyle(centerStyle);

                    Cell gQty = grpRow.createCell(3);
                    gQty.setCellValue(g.getTotalStockQuantity() != null ? g.getTotalStockQuantity().doubleValue() : 0.0);
                    gQty.setCellStyle(qtyStyle);

                    Cell gVal = grpRow.createCell(4);
                    gVal.setCellValue(g.getTotalInventoryValue() != null ? g.getTotalInventoryValue().doubleValue() : 0.0);
                    gVal.setCellStyle(currencyStyle);

                    Cell gRetail = grpRow.createCell(5);
                    gRetail.setCellValue(g.getTotalRetailValue() != null ? g.getTotalRetailValue().doubleValue() : 0.0);
                    gRetail.setCellStyle(currencyStyle);

                    Cell gPercent = grpRow.createCell(6);
                    double pct = g.getValuePercentage() != null ? g.getValuePercentage().doubleValue() / 100.0 : 0.0;
                    gPercent.setCellValue(pct);
                    gPercent.setCellStyle(percentStyle);

                    grpRow.createCell(7).setCellValue(g.getAverageDaysInStock() != null ? g.getAverageDaysInStock() + " ngày" : "-");
                    grpRow.getCell(7).setCellStyle(centerStyle);

                    if (g.getTotalStockQuantity() != null) sumGrpQty = sumGrpQty.add(g.getTotalStockQuantity());
                    if (g.getTotalInventoryValue() != null) sumGrpVal = sumGrpVal.add(g.getTotalInventoryValue());
                    if (g.getTotalRetailValue() != null) sumGrpRetail = sumGrpRetail.add(g.getTotalRetailValue());
                }
            }

            // Dòng tổng cộng nhóm hàng
            Row grpTotalRow = sheet1.createRow(rowIdx++);
            grpTotalRow.createCell(0).setCellValue("TỔNG");
            grpTotalRow.getCell(0).setCellStyle(totalText);
            for (int c = 1; c <= 2; c++) {
                Cell emptyCell = grpTotalRow.createCell(c);
                emptyCell.setCellStyle(totalText);
            }
            sheet1.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 2));

            Cell grpTotQty = grpTotalRow.createCell(3);
            grpTotQty.setCellValue(sumGrpQty.doubleValue());
            grpTotQty.setCellStyle(totalQtyStyle);

            Cell grpTotVal = grpTotalRow.createCell(4);
            grpTotVal.setCellValue(sumGrpVal.doubleValue());
            grpTotVal.setCellStyle(totalCurrencyStyle);

            Cell grpTotRetail = grpTotalRow.createCell(5);
            grpTotRetail.setCellValue(sumGrpRetail.doubleValue());
            grpTotRetail.setCellStyle(totalCurrencyStyle);

            Cell grpTotPct = grpTotalRow.createCell(6);
            grpTotPct.setCellValue(1.0);
            grpTotPct.setCellStyle(totalPercentStyle);

            grpTotalRow.createCell(7).setCellValue("");
            grpTotalRow.getCell(7).setCellStyle(totalText);

            rowIdx++; // Dòng trống

            // ==========================================
            // BẢNG 2: CHI TIẾT GIÁ TRỊ TỒN KHO THEO MẶT HÀNG
            // ==========================================
            Row sec3Row = sheet1.createRow(rowIdx++);
            Cell sec3Cell = sec3Row.createCell(0);
            sec3Cell.setCellValue("III. CHI TIẾT TỪNG MẶT HÀNG (SẮP XẾP THEO GIÁ TRỊ TỒN GIẢM DẦN)");
            sec3Cell.setCellStyle(secStyle);

            Row itemHeader = sheet1.createRow(rowIdx++);
            String[] itemCols = {"STT", "Mã SKU", "Tên mặt hàng", "ĐVT", "Nhóm hàng", "Số tồn kho", "Giá vốn bình quân", "Giá trị tồn (Giá vốn)", "Giá bán niêm yết", "Giá trị tồn (Giá bán)", "Số ngày tồn"};
            for (int i = 0; i < itemCols.length; i++) {
                Cell cell = itemHeader.createCell(i);
                cell.setCellValue(itemCols[i]);
                cell.setCellStyle(headerStyle);
            }

            List<InventoryValuationItemResponse> items = report.getItems();
            int itemStt = 1;
            BigDecimal sumItemQty = BigDecimal.ZERO;
            BigDecimal sumItemVal = BigDecimal.ZERO;
            BigDecimal sumItemRetail = BigDecimal.ZERO;

            if (items != null) {
                for (InventoryValuationItemResponse it : items) {
                    Row itRow = sheet1.createRow(rowIdx++);
                    itRow.createCell(0).setCellValue(itemStt++);
                    itRow.getCell(0).setCellStyle(centerStyle);

                    itRow.createCell(1).setCellValue(sanitizeCellValue(it.getSku() != null ? it.getSku() : ""));
                    itRow.getCell(1).setCellStyle(centerStyle);

                    itRow.createCell(2).setCellValue(sanitizeCellValue(it.getProductName() != null ? it.getProductName() : ""));
                    itRow.getCell(2).setCellStyle(textStyle);

                    itRow.createCell(3).setCellValue(sanitizeCellValue(it.getUnit() != null ? it.getUnit() : ""));
                    itRow.getCell(3).setCellStyle(centerStyle);

                    itRow.createCell(4).setCellValue(sanitizeCellValue(it.getGroupName() != null ? it.getGroupName() : "Chưa phân nhóm"));
                    itRow.getCell(4).setCellStyle(textStyle);

                    Cell itQty = itRow.createCell(5);
                    itQty.setCellValue(it.getStockQuantity() != null ? it.getStockQuantity().doubleValue() : 0.0);
                    itQty.setCellStyle(qtyStyle);

                    Cell itCost = itRow.createCell(6);
                    itCost.setCellValue(it.getCostPrice() != null ? it.getCostPrice().doubleValue() : 0.0);
                    itCost.setCellStyle(currencyStyle);

                    Cell itVal = itRow.createCell(7);
                    itVal.setCellValue(it.getInventoryValue() != null ? it.getInventoryValue().doubleValue() : 0.0);
                    itVal.setCellStyle(currencyStyle);

                    Cell itRetail = itRow.createCell(8);
                    itRetail.setCellValue(it.getRetailPrice() != null ? it.getRetailPrice().doubleValue() : 0.0);
                    itRetail.setCellStyle(currencyStyle);

                    Cell itRetailVal = itRow.createCell(9);
                    itRetailVal.setCellValue(it.getRetailValue() != null ? it.getRetailValue().doubleValue() : 0.0);
                    itRetailVal.setCellStyle(currencyStyle);

                    itRow.createCell(10).setCellValue(it.getDaysInStock() != null ? it.getDaysInStock() : 0);
                    itRow.getCell(10).setCellStyle(centerStyle);

                    if (it.getStockQuantity() != null) sumItemQty = sumItemQty.add(it.getStockQuantity());
                    if (it.getInventoryValue() != null) sumItemVal = sumItemVal.add(it.getInventoryValue());
                    if (it.getRetailValue() != null) sumItemRetail = sumItemRetail.add(it.getRetailValue());
                }
            }

            // Dòng tổng cộng chi tiết
            Row itemTotalRow = sheet1.createRow(rowIdx++);
            itemTotalRow.createCell(0).setCellValue("TỔNG CỘNG TOÀN KHO");
            itemTotalRow.getCell(0).setCellStyle(totalText);
            for (int c = 1; c <= 4; c++) {
                Cell emptyCell = itemTotalRow.createCell(c);
                emptyCell.setCellStyle(totalText);
            }
            sheet1.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

            Cell totQty = itemTotalRow.createCell(5);
            totQty.setCellValue(sumItemQty.doubleValue());
            totQty.setCellStyle(totalQtyStyle);

            itemTotalRow.createCell(6).setCellValue("-");
            itemTotalRow.getCell(6).setCellStyle(totalText);

            Cell totVal = itemTotalRow.createCell(7);
            totVal.setCellValue(sumItemVal.doubleValue());
            totVal.setCellStyle(totalCurrencyStyle);

            itemTotalRow.createCell(8).setCellValue("-");
            itemTotalRow.getCell(8).setCellStyle(totalText);

            Cell totRetail = itemTotalRow.createCell(9);
            totRetail.setCellValue(sumItemRetail.doubleValue());
            totRetail.setCellStyle(totalCurrencyStyle);

            itemTotalRow.createCell(10).setCellValue("");
            itemTotalRow.getCell(10).setCellStyle(totalText);

            // Auto-size các cột Sheet 1
            for (int i = 0; i < 11; i++) {
                sheet1.setColumnWidth(i, Math.max(15 * 256, sheet1.getColumnWidth(i)));
            }
            sheet1.setColumnWidth(2, 35 * 256); // Tên hàng rộng rãi

            // ==========================================
            // SHEET 2: CẢNH BÁO MẶT HÀNG THIẾU GIÁ VỐN (TC-02)
            // ==========================================
            List<MissingCostProductResponse> missingItems = report.getMissingCostItems();
            if (missingItems != null && !missingItems.isEmpty()) {
                Sheet sheet2 = workbook.createSheet("Cảnh Báo Thiếu Giá Vốn");
                sheet2.setDisplayGridlines(true);

                int rIdx2 = 0;

                Row warnTitleRow = sheet2.createRow(rIdx2++);
                Cell warnTitle = warnTitleRow.createCell(0);
                warnTitle.setCellValue("DANH SÁCH MẶT HÀNG CHƯA CÓ GIÁ VỐN (LOẠI TRỪ KHỎI ĐỊNH GIÁ)");
                warnTitle.setCellStyle(titleStyle);
                sheet2.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

                Row warnDescRow = sheet2.createRow(rIdx2++);
                Cell warnDesc = warnDescRow.createCell(0);
                warnDesc.setCellValue("Lưu ý: Các mặt hàng dưới đây chưa được thiết lập giá vốn từ phiếu nhập hàng hoặc chưa có phiếu nhập. Để tránh làm sai lệch số liệu định giá, hệ thống đã loại trừ các mặt hàng này khỏi Tổng giá trị tồn kho. Vui lòng tạo Phiếu nhập hàng để bổ sung giá vốn.");
                CellStyle descStyle = workbook.createCellStyle();
                descStyle.setFont(fontBold);
                descStyle.setWrapText(true);
                warnDesc.setCellStyle(descStyle);
                sheet2.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));

                rIdx2++; // Dòng trống

                Row warnHeader = sheet2.createRow(rIdx2++);
                String[] warnCols = {"STT", "Mã SKU", "Tên mặt hàng", "ĐVT", "Nhóm hàng", "Số tồn kho", "Giá bán niêm yết", "Ghi chú cảnh báo"};
                for (int i = 0; i < warnCols.length; i++) {
                    Cell cell = warnHeader.createCell(i);
                    cell.setCellValue(warnCols[i]);
                    cell.setCellStyle(warningHeaderStyle);
                }

                int warnStt = 1;
                for (MissingCostProductResponse m : missingItems) {
                    Row wRow = sheet2.createRow(rIdx2++);
                    wRow.createCell(0).setCellValue(warnStt++);
                    wRow.getCell(0).setCellStyle(centerStyle);

                    wRow.createCell(1).setCellValue(sanitizeCellValue(m.getSku() != null ? m.getSku() : ""));
                    wRow.getCell(1).setCellStyle(centerStyle);

                    wRow.createCell(2).setCellValue(sanitizeCellValue(m.getProductName() != null ? m.getProductName() : ""));
                    wRow.getCell(2).setCellStyle(textStyle);

                    wRow.createCell(3).setCellValue(sanitizeCellValue(m.getUnit() != null ? m.getUnit() : ""));
                    wRow.getCell(3).setCellStyle(centerStyle);

                    wRow.createCell(4).setCellValue(sanitizeCellValue(m.getGroupName() != null ? m.getGroupName() : "Chưa phân nhóm"));
                    wRow.getCell(4).setCellStyle(textStyle);

                    Cell wQty = wRow.createCell(5);
                    wQty.setCellValue(m.getStockQuantity() != null ? m.getStockQuantity().doubleValue() : 0.0);
                    wQty.setCellStyle(qtyStyle);

                    Cell wRetail = wRow.createCell(6);
                    wRetail.setCellValue(m.getRetailPrice() != null ? m.getRetailPrice().doubleValue() : 0.0);
                    wRetail.setCellStyle(currencyStyle);

                    Cell wMsg = wRow.createCell(7);
                    wMsg.setCellValue(sanitizeCellValue(m.getWarningMessage() != null ? m.getWarningMessage() : "Chưa có giá vốn từ phiếu nhập"));
                    wMsg.setCellStyle(warningTextStyle);
                }

                for (int i = 0; i < 8; i++) {
                    sheet2.setColumnWidth(i, Math.max(16 * 256, sheet2.getColumnWidth(i)));
                }
                sheet2.setColumnWidth(2, 35 * 256);
                sheet2.setColumnWidth(7, 35 * 256);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Ngăn ngừa tấn công Excel Formula Injection bằng cách thêm dấu nháy đơn (')
     * nếu chuỗi bắt đầu bằng các ký tự công thức: =, +, -, @
     */
    private static String sanitizeCellValue(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (!trimmed.isEmpty()) {
            char firstChar = trimmed.charAt(0);
            if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@') {
                return "'" + value;
            }
        }
        return value;
    }
}
