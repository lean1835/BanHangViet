package com.sales.service.classes;

import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.ReportExportService;
import com.sales.service.interfaces.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportServiceImpl implements ReportExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final ReportService reportService;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;

    @Override
    public byte[] exportReportToExcel(String currentUsername, String reportType, LocalDate fromDate, LocalDate toDate, String filter1, String filter2) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        String normType = reportType != null ? reportType.trim().toUpperCase() : "DAILY";

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Chuẩn bị CellStyles
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle metadataLabelStyle = createBoldStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataTextStyle = createTextStyle(workbook);
            CellStyle dataCenterStyle = createCenterStyle(workbook);
            CellStyle dataCurrencyStyle = createCurrencyStyle(workbook);
            CellStyle dataPercentStyle = createPercentStyle(workbook);
            CellStyle totalRowStyle = createTotalRowStyle(workbook);
            CellStyle totalCurrencyStyle = createTotalCurrencyStyle(workbook);
            CellStyle alertHeaderStyle = createAlertHeaderStyle(workbook);

            // Export theo từng loại
            String reportTitle;
            boolean hasData;

            switch (normType) {
                case "GROSS_PROFIT":
                    reportTitle = "BÁO CÁO LÃI GỘP THEO NGÀY VÀ MẶT HÀNG";
                    hasData = exportGrossProfit(workbook, currentUsername, fromDate, toDate, filter1, filter2,
                            headerStyle, dataTextStyle, dataCenterStyle, dataCurrencyStyle, dataPercentStyle,
                            totalRowStyle, totalCurrencyStyle, alertHeaderStyle);
                    break;

                case "PAYMENT_METHOD":
                    reportTitle = "BÁO CÁO DOANH THU THEO HÌNH THỨC THANH TOÁN";
                    hasData = exportPaymentMethod(workbook, currentUsername, fromDate, toDate, filter1, filter2,
                            headerStyle, dataTextStyle, dataCenterStyle, dataCurrencyStyle, dataPercentStyle,
                            totalRowStyle, totalCurrencyStyle);
                    break;

                case "PRODUCT_GROUP":
                    reportTitle = "BÁO CÁO DOANH THU THEO NHÓM HÀNG";
                    hasData = exportProductGroup(workbook, currentUsername, fromDate, toDate,
                            headerStyle, dataTextStyle, dataCenterStyle, dataCurrencyStyle, dataPercentStyle,
                            totalRowStyle, totalCurrencyStyle);
                    break;

                case "EMPLOYEE_SHIFT":
                    reportTitle = "BÁO CÁO DOANH THU THEO CA VÀ NHÂN VIÊN";
                    hasData = exportEmployeeShift(workbook, currentUsername, fromDate, toDate, filter1,
                            headerStyle, dataTextStyle, dataCenterStyle, dataCurrencyStyle,
                            totalRowStyle, totalCurrencyStyle);
                    break;

                case "PRODUCTS":
                    reportTitle = "BÁO CÁO DOANH THU THEO SẢN PHẨM";
                    hasData = exportProductRevenue(workbook, currentUsername, fromDate, toDate,
                            headerStyle, dataTextStyle, dataCenterStyle, dataCurrencyStyle,
                            totalRowStyle, totalCurrencyStyle);
                    break;

                case "DAILY":
                    reportTitle = "BÁO CÁO DOANH THU THEO NGÀY";
                    hasData = exportDailyRevenue(workbook, currentUsername, fromDate, toDate,
                            headerStyle, dataTextStyle, dataCenterStyle, dataCurrencyStyle,
                            totalRowStyle, totalCurrencyStyle);
                    break;

                default:
                    throw new AppException(ErrorCode.INVALID_INPUT);
            }

            if (!hasData) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }

            // Tạo Sheet 1: Metadata (Đặt làm sheet đầu tiên)
            Sheet metaSheet = workbook.createSheet("Thong_Tin_Bao_Cao");
            workbook.setSheetOrder("Thong_Tin_Bao_Cao", 0);
            createMetadataSheet(metaSheet, household, currentUser, reportTitle, fromDate, toDate, titleStyle, metadataLabelStyle);

            workbook.write(out);

            // QTN-25: Ghi nhật ký kiểm toán xuất báo cáo
            recordAuditLog(household, currentUser, normType, fromDate, toDate);

            return out.toByteArray();
        } catch (AppException ae) {
            throw ae;
        } catch (IOException e) {
            log.error("Lỗi khi xuất file Excel báo cáo {}: {}", normType, e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo file Excel báo cáo: " + e.getMessage(), e);
        }
    }

    private void createMetadataSheet(Sheet sheet, BusinessHousehold household, User currentUser,
                                     String reportTitle, LocalDate fromDate, LocalDate toDate,
                                     CellStyle titleStyle, CellStyle labelStyle) {
        Row titleRow = sheet.createRow(1);
        Cell titleCell = titleRow.createCell(1);
        titleCell.setCellValue(reportTitle);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 1, 4));

        String[][] metaInfo = {
                {"Hộ kinh doanh:", household.getName()},
                {"Mã số thuế:", household.getTaxCode() != null ? household.getTaxCode() : "N/A"},
                {"Số điện thoại:", household.getPhoneNumber() != null ? household.getPhoneNumber() : "N/A"},
                {"Địa chỉ:", household.getAddress() != null ? household.getAddress() : "N/A"},
                {"Kỳ báo cáo:", (fromDate != null ? fromDate.format(DATE_FORMATTER) : "Tất cả") +
                        " - " + (toDate != null ? toDate.format(DATE_FORMATTER) : "Hiện tại")},
                {"Người xuất báo cáo:", currentUser.getFullName() + " (" + currentUser.getUsername() + ")"},
                {"Thời gian xuất:", LocalDateTime.now().format(DATE_TIME_FORMATTER)}
        };

        int rIdx = 3;
        for (String[] entry : metaInfo) {
            Row row = sheet.createRow(rIdx++);
            Cell cLabel = row.createCell(1);
            cLabel.setCellValue(entry[0]);
            cLabel.setCellStyle(labelStyle);

            Cell cVal = row.createCell(2);
            cVal.setCellValue(entry[1]);
        }

        sheet.setColumnWidth(1, 22 * 256);
        sheet.setColumnWidth(2, 40 * 256);
    }

    private boolean exportGrossProfit(Workbook workbook, String username, LocalDate fromDate, LocalDate toDate, String productId, String posId,
                                      CellStyle headerStyle, CellStyle textStyle, CellStyle centerStyle,
                                      CellStyle currStyle, CellStyle pctStyle, CellStyle totalStyle,
                                      CellStyle totalCurrStyle, CellStyle alertHeaderStyle) {
        GrossProfitReportResponse report = reportService.getGrossProfitReport(username, fromDate, toDate, productId, posId);
        if (report == null || (report.getItemReports().isEmpty() && report.getDailyReports().isEmpty() && report.getMissingCostPriceItems().isEmpty())) {
            return false;
        }

        Sheet sheet = workbook.createSheet("Du_Lieu_Lai_Gop");
        int rIdx = 0;

        // 1. Khối tổng hợp (Summary)
        Row sumHeaderRow = sheet.createRow(rIdx++);
        Cell sumHCell = sumHeaderRow.createCell(0);
        sumHCell.setCellValue("1. TỔNG HỢP HIỆU QUẢ KINH DOANH");
        sumHCell.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 4));

        String[] sumHeaders = {"Chỉ tiêu", "Doanh thu thuần", "Tổng giá vốn (COGS)", "Lợi nhuận gộp", "Tỷ suất lãi gộp (%)"};
        Row shRow = sheet.createRow(rIdx++);
        for (int i = 0; i < sumHeaders.length; i++) {
            Cell c = shRow.createCell(i);
            c.setCellValue(sumHeaders[i]);
            c.setCellStyle(headerStyle);
        }

        Row sumValRow = sheet.createRow(rIdx++);
        Cell c0 = sumValRow.createCell(0);
        c0.setCellValue("Toàn kỳ");
        c0.setCellStyle(textStyle);

        Cell c1 = sumValRow.createCell(1);
        c1.setCellValue(report.getSummary().getTotalNetRevenue().doubleValue());
        c1.setCellStyle(currStyle);

        Cell c2 = sumValRow.createCell(2);
        c2.setCellValue(report.getSummary().getTotalCogs().doubleValue());
        c2.setCellStyle(currStyle);

        Cell c3 = sumValRow.createCell(3);
        c3.setCellValue(report.getSummary().getTotalGrossProfit().doubleValue());
        c3.setCellStyle(currStyle);

        Cell c4 = sumValRow.createCell(4);
        c4.setCellValue(report.getSummary().getGrossProfitMarginPercentage() != null ? report.getSummary().getGrossProfitMarginPercentage().doubleValue() / 100.0 : 0.0);
        c4.setCellStyle(pctStyle);

        rIdx++; // Dòng trống

        // 2. Chi tiết theo mặt hàng
        Row prodHeaderRow = sheet.createRow(rIdx++);
        Cell prodHCell = prodHeaderRow.createCell(0);
        prodHCell.setCellValue("2. CHI TIẾT LÃI GỘP THEO MẶT HÀNG");
        prodHCell.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 8));

        String[] prodHeaders = {"STT", "Mã SKU", "Tên mặt hàng", "Đơn vị", "Số lượng bán", "Doanh thu thuần", "Giá vốn (COGS)", "Lãi gộp", "Tỷ suất (%)"};
        Row phRow = sheet.createRow(rIdx++);
        for (int i = 0; i < prodHeaders.length; i++) {
            Cell c = phRow.createCell(i);
            c.setCellValue(prodHeaders[i]);
            c.setCellStyle(headerStyle);
        }

        int stt = 1;
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalCogs = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;

        for (GrossProfitReportResponse.ProductGrossProfitDto p : report.getItemReports()) {
            Row r = sheet.createRow(rIdx++);
            r.createCell(0).setCellValue(stt++);
            r.getCell(0).setCellStyle(centerStyle);

            Cell cCode = r.createCell(1);
            cCode.setCellValue(p.getProductSku() != null ? p.getProductSku() : "");
            cCode.setCellStyle(centerStyle);

            Cell cName = r.createCell(2);
            cName.setCellValue(p.getProductName() != null ? p.getProductName() : "");
            cName.setCellStyle(textStyle);

            Cell cUnit = r.createCell(3);
            cUnit.setCellValue(p.getUnit() != null ? p.getUnit() : "");
            cUnit.setCellStyle(centerStyle);

            Cell cQty = r.createCell(4);
            cQty.setCellValue(p.getQuantitySold() != null ? p.getQuantitySold().doubleValue() : 0.0);
            cQty.setCellStyle(centerStyle);

            Cell cR = r.createCell(5);
            cR.setCellValue(p.getNetRevenue() != null ? p.getNetRevenue().doubleValue() : 0.0);
            cR.setCellStyle(currStyle);

            Cell cC = r.createCell(6);
            cC.setCellValue(p.getCogs() != null ? p.getCogs().doubleValue() : 0.0);
            cC.setCellStyle(currStyle);

            Cell cP = r.createCell(7);
            cP.setCellValue(p.getGrossProfit() != null ? p.getGrossProfit().doubleValue() : 0.0);
            cP.setCellStyle(currStyle);

            Cell cM = r.createCell(8);
            cM.setCellValue(p.getGrossProfitMarginPercentage() != null ? p.getGrossProfitMarginPercentage().doubleValue() / 100.0 : 0.0);
            cM.setCellStyle(pctStyle);

            if (p.getQuantitySold() != null) totalQty = totalQty.add(p.getQuantitySold());
            if (p.getNetRevenue() != null) totalRev = totalRev.add(p.getNetRevenue());
            if (p.getCogs() != null) totalCogs = totalCogs.add(p.getCogs());
            if (p.getGrossProfit() != null) totalProfit = totalProfit.add(p.getGrossProfit());
        }

        // Dòng tổng cộng
        Row totRow = sheet.createRow(rIdx++);
        Cell totLabel = totRow.createCell(0);
        totLabel.setCellValue("TỔNG CỘNG");
        totLabel.setCellStyle(totalStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 3));

        for (int i = 1; i <= 3; i++) {
            Cell c = totRow.createCell(i);
            c.setCellStyle(totalStyle);
        }

        Cell totQty = totRow.createCell(4);
        totQty.setCellValue(totalQty.doubleValue());
        totQty.setCellStyle(totalStyle);

        Cell totRevCell = totRow.createCell(5);
        totRevCell.setCellValue(totalRev.doubleValue());
        totRevCell.setCellStyle(totalCurrStyle);

        Cell totCogsCell = totRow.createCell(6);
        totCogsCell.setCellValue(totalCogs.doubleValue());
        totCogsCell.setCellStyle(totalCurrStyle);

        Cell totProfitCell = totRow.createCell(7);
        totProfitCell.setCellValue(totalProfit.doubleValue());
        totProfitCell.setCellStyle(totalCurrStyle);

        Cell totPctCell = totRow.createCell(8);
        double overallPct = totalRev.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(totalRev, 4, java.math.RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        totPctCell.setCellValue(overallPct);
        totPctCell.setCellStyle(pctStyle);

        // 3. Cảnh báo mặt hàng thiếu giá vốn (nếu có)
        if (!report.getMissingCostPriceItems().isEmpty()) {
            rIdx += 2;
            Row warnHeaderRow = sheet.createRow(rIdx++);
            Cell warnHCell = warnHeaderRow.createCell(0);
            warnHCell.setCellValue("3. CẢNH BÁO: DANH SÁCH MẶT HÀNG CHƯA KHAI BÁO GIÁ VỐN (KHÔNG TÍNH VÀO TỔNG TỶ SUẤT)");
            warnHCell.setCellStyle(alertHeaderStyle);
            sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 5));

            String[] warnHeaders = {"STT", "Mã SKU", "Tên mặt hàng", "Đơn vị", "Số lượng bán", "Doanh thu ghi nhận"};
            Row whRow = sheet.createRow(rIdx++);
            for (int i = 0; i < warnHeaders.length; i++) {
                Cell c = whRow.createCell(i);
                c.setCellValue(warnHeaders[i]);
                c.setCellStyle(alertHeaderStyle);
            }

            int wStt = 1;
            for (GrossProfitReportResponse.MissingCostProductDto item : report.getMissingCostPriceItems()) {
                Row r = sheet.createRow(rIdx++);
                r.createCell(0).setCellValue(wStt++);
                r.getCell(0).setCellStyle(centerStyle);

                r.createCell(1).setCellValue(item.getProductSku() != null ? item.getProductSku() : "");
                r.getCell(1).setCellStyle(centerStyle);

                r.createCell(2).setCellValue(item.getProductName() != null ? item.getProductName() : "");
                r.getCell(2).setCellStyle(textStyle);

                r.createCell(3).setCellValue(item.getUnit() != null ? item.getUnit() : "");
                r.getCell(3).setCellStyle(centerStyle);

                r.createCell(4).setCellValue(item.getQuantitySold() != null ? item.getQuantitySold().doubleValue() : 0.0);
                r.getCell(4).setCellStyle(centerStyle);

                r.createCell(5).setCellValue(item.getNetRevenue() != null ? item.getNetRevenue().doubleValue() : 0.0);
                r.getCell(5).setCellStyle(currStyle);
            }
        }

        for (int i = 0; i <= 8; i++) {
            sheet.autoSizeColumn(i);
        }

        return true;
    }

    private boolean exportPaymentMethod(Workbook workbook, String username, LocalDate fromDate, LocalDate toDate,
                                        String userId, String shiftId,
                                        CellStyle headerStyle, CellStyle textStyle, CellStyle centerStyle,
                                        CellStyle currStyle, CellStyle pctStyle, CellStyle totalStyle,
                                        CellStyle totalCurrStyle) {
        PaymentMethodReportResponse report = reportService.getPaymentMethodReport(username, fromDate, toDate, userId, shiftId);
        boolean hasSalesData = report != null
                && report.getTotalRevenue() != null
                && report.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0;
        boolean hasDebtData = report != null
                && report.getDebtDetails() != null
                && report.getDebtDetails().getTotalDebtCreated() != null
                && report.getDebtDetails().getTotalDebtCreated().compareTo(BigDecimal.ZERO) > 0;
        boolean hasTransactions = report != null
                && report.getMethods() != null
                && report.getMethods().stream().anyMatch(m -> m.getTransactionCount() != null && m.getTransactionCount() > 0);

        if (!hasSalesData && !hasDebtData && !hasTransactions) {
            return false;
        }

        Sheet sheet = workbook.createSheet("Du_Lieu_Thanh_Toan");
        int rIdx = 0;

        Row titleRow = sheet.createRow(rIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("1. DOANH THU THEO HÌNH THỨC THANH TOÁN");
        titleCell.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 4));

        String[] headers = {"STT", "Hình thức thanh toán", "Số giao dịch", "Doanh thu (VNĐ)", "Tỷ trọng (%)"};
        Row hRow = sheet.createRow(rIdx++);
        for (int i = 0; i < headers.length; i++) {
            Cell c = hRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        int stt = 1;
        long totalTrans = 0;
        BigDecimal totalRev = BigDecimal.ZERO;

        for (PaymentMethodReportResponse.PaymentMethodStatDto item : report.getMethods()) {
            Row r = sheet.createRow(rIdx++);
            r.createCell(0).setCellValue(stt++);
            r.getCell(0).setCellStyle(centerStyle);

            String displayName = item.getMethodName() != null ? item.getMethodName() : (item.getMethod() != null ? item.getMethod() : "");
            r.createCell(1).setCellValue(displayName);
            r.getCell(1).setCellStyle(textStyle);

            r.createCell(2).setCellValue(item.getTransactionCount() != null ? item.getTransactionCount() : 0);
            r.getCell(2).setCellStyle(centerStyle);

            r.createCell(3).setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0.0);
            r.getCell(3).setCellStyle(currStyle);

            r.createCell(4).setCellValue(item.getPercentage() != null ? item.getPercentage().doubleValue() / 100.0 : 0.0);
            r.getCell(4).setCellStyle(pctStyle);

            if (item.getTransactionCount() != null) totalTrans += item.getTransactionCount();
            if (item.getTotalAmount() != null) totalRev = totalRev.add(item.getTotalAmount());
        }

        // Tổng cộng
        Row totRow = sheet.createRow(rIdx++);
        Cell totLabel = totRow.createCell(0);
        totLabel.setCellValue("TỔNG CỘNG");
        totLabel.setCellStyle(totalStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 1));
        totRow.createCell(1).setCellStyle(totalStyle);

        Cell totTrans = totRow.createCell(2);
        totTrans.setCellValue(totalTrans);
        totTrans.setCellStyle(totalStyle);

        Cell totAmount = totRow.createCell(3);
        totAmount.setCellValue(totalRev.doubleValue());
        totAmount.setCellStyle(totalCurrStyle);

        Cell totPct = totRow.createCell(4);
        totPct.setCellValue(1.0);
        totPct.setCellStyle(pctStyle);

        // Khối công nợ (Debt Summary)
        if (report.getDebtDetails() != null) {
            rIdx += 2;
            Row debtTitleRow = sheet.createRow(rIdx++);
            Cell debtTitleCell = debtTitleRow.createCell(0);
            debtTitleCell.setCellValue("2. THEO DÕI CÔNG NỢ KHÁCH HÀNG PHÁT SINH TRONG KỲ");
            debtTitleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 2));

            String[] debtHeaders = {"Chỉ tiêu", "Số tiền (VNĐ)", "Ghi chú"};
            Row dhRow = sheet.createRow(rIdx++);
            for (int i = 0; i < debtHeaders.length; i++) {
                Cell c = dhRow.createCell(i);
                c.setCellValue(debtHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            // Ghi nợ mới
            Row dr1 = sheet.createRow(rIdx++);
            dr1.createCell(0).setCellValue("Doanh số bán ghi nợ mới");
            dr1.getCell(0).setCellStyle(textStyle);
            dr1.createCell(1).setCellValue(report.getDebtDetails().getTotalDebtCreated().doubleValue());
            dr1.getCell(1).setCellStyle(currStyle);
            dr1.createCell(2).setCellValue("Khoản nợ khách mua hàng chưa thanh toán trong kỳ");
            dr1.getCell(2).setCellStyle(textStyle);

            // Thu nợ cũ
            Row dr2 = sheet.createRow(rIdx++);
            dr2.createCell(0).setCellValue("Tiền thu nợ khách hàng trong kỳ");
            dr2.getCell(0).setCellStyle(textStyle);
            dr2.createCell(1).setCellValue(report.getDebtDetails().getTotalDebtPaid().doubleValue());
            dr2.getCell(1).setCellStyle(currStyle);
            dr2.createCell(2).setCellValue("Dòng tiền thực thu hồi từ các khoản nợ cũ");
            dr2.getCell(2).setCellStyle(textStyle);
        }

        for (int i = 0; i <= 4; i++) {
            sheet.autoSizeColumn(i);
        }

        return true;
    }

    private boolean exportProductGroup(Workbook workbook, String username, LocalDate fromDate, LocalDate toDate,
                                       CellStyle headerStyle, CellStyle textStyle, CellStyle centerStyle,
                                       CellStyle currStyle, CellStyle pctStyle, CellStyle totalStyle,
                                       CellStyle totalCurrStyle) {
        ProductGroupReportResponse report = reportService.getProductGroupReport(username, fromDate, toDate);
        boolean hasGroups = report != null && report.getGroups() != null && !report.getGroups().isEmpty();
        boolean hasUnassigned = report != null && report.getUnassignedSummary() != null
                && ((report.getUnassignedSummary().getRevenue() != null && report.getUnassignedSummary().getRevenue().compareTo(BigDecimal.ZERO) > 0)
                    || (report.getUnassignedSummary().getTotalQuantitySold() != null && report.getUnassignedSummary().getTotalQuantitySold().compareTo(BigDecimal.ZERO) > 0));

        if (!hasGroups && !hasUnassigned) {
            return false;
        }

        Sheet sheet = workbook.createSheet("Du_Lieu_Nhom_Hang");
        int rIdx = 0;

        Row titleRow = sheet.createRow(rIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DOANH THU THEO NHÓM HÀNG");
        titleCell.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 6));

        String[] headers = {"STT", "Mã nhóm", "Tên nhóm hàng", "Số lượng bán", "Doanh thu kỳ này (VNĐ)", "Tỷ trọng (%)", "Doanh thu kỳ trước (VNĐ)", "Tăng trưởng (%)"};
        Row hRow = sheet.createRow(rIdx++);
        for (int i = 0; i < headers.length; i++) {
            Cell c = hRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        int stt = 1;
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalPrevRev = BigDecimal.ZERO;

        if (hasGroups) {
            for (ProductGroupReportResponse.ProductGroupRevenueDto item : report.getGroups()) {
                Row r = sheet.createRow(rIdx++);
                r.createCell(0).setCellValue(stt++);
                r.getCell(0).setCellStyle(centerStyle);

                r.createCell(1).setCellValue(item.getGroupId() != null ? item.getGroupId() : "N/A");
                r.getCell(1).setCellStyle(centerStyle);

                r.createCell(2).setCellValue(item.getGroupName() != null ? item.getGroupName() : "");
                r.getCell(2).setCellStyle(textStyle);

                r.createCell(3).setCellValue(item.getTotalQuantitySold() != null ? item.getTotalQuantitySold().doubleValue() : 0.0);
                r.getCell(3).setCellStyle(centerStyle);

                r.createCell(4).setCellValue(item.getRevenue() != null ? item.getRevenue().doubleValue() : 0.0);
                r.getCell(4).setCellStyle(currStyle);

                r.createCell(5).setCellValue(item.getPercentage() != null ? item.getPercentage().doubleValue() / 100.0 : 0.0);
                r.getCell(5).setCellStyle(pctStyle);

                r.createCell(6).setCellValue(item.getPreviousPeriodRevenue() != null ? item.getPreviousPeriodRevenue().doubleValue() : 0.0);
                r.getCell(6).setCellStyle(currStyle);

                r.createCell(7).setCellValue(item.getGrowthRatePercentage() != null ? item.getGrowthRatePercentage().doubleValue() / 100.0 : 0.0);
                r.getCell(7).setCellStyle(pctStyle);

                if (item.getTotalQuantitySold() != null) totalQty = totalQty.add(item.getTotalQuantitySold());
                if (item.getRevenue() != null) totalRev = totalRev.add(item.getRevenue());
                if (item.getPreviousPeriodRevenue() != null) totalPrevRev = totalPrevRev.add(item.getPreviousPeriodRevenue());
            }
        }

        if (hasUnassigned) {
            ProductGroupReportResponse.ProductGroupRevenueDto unassigned = report.getUnassignedSummary();
            Row r = sheet.createRow(rIdx++);
            r.createCell(0).setCellValue(stt++);
            r.getCell(0).setCellStyle(centerStyle);

            r.createCell(1).setCellValue("UNASSIGNED");
            r.getCell(1).setCellStyle(centerStyle);

            String name = unassigned.getGroupName() != null && !unassigned.getGroupName().isEmpty()
                    ? unassigned.getGroupName() : "Chưa phân nhóm";
            r.createCell(2).setCellValue(name);
            r.getCell(2).setCellStyle(textStyle);

            r.createCell(3).setCellValue(unassigned.getTotalQuantitySold() != null ? unassigned.getTotalQuantitySold().doubleValue() : 0.0);
            r.getCell(3).setCellStyle(centerStyle);

            r.createCell(4).setCellValue(unassigned.getRevenue() != null ? unassigned.getRevenue().doubleValue() : 0.0);
            r.getCell(4).setCellStyle(currStyle);

            r.createCell(5).setCellValue(unassigned.getPercentage() != null ? unassigned.getPercentage().doubleValue() / 100.0 : 0.0);
            r.getCell(5).setCellStyle(pctStyle);

            r.createCell(6).setCellValue(unassigned.getPreviousPeriodRevenue() != null ? unassigned.getPreviousPeriodRevenue().doubleValue() : 0.0);
            r.getCell(6).setCellStyle(currStyle);

            r.createCell(7).setCellValue(unassigned.getGrowthRatePercentage() != null ? unassigned.getGrowthRatePercentage().doubleValue() / 100.0 : 0.0);
            r.getCell(7).setCellStyle(pctStyle);

            if (unassigned.getTotalQuantitySold() != null) totalQty = totalQty.add(unassigned.getTotalQuantitySold());
            if (unassigned.getRevenue() != null) totalRev = totalRev.add(unassigned.getRevenue());
            if (unassigned.getPreviousPeriodRevenue() != null) totalPrevRev = totalPrevRev.add(unassigned.getPreviousPeriodRevenue());
        }

        // Tổng cộng
        Row totRow = sheet.createRow(rIdx++);
        Cell totLabel = totRow.createCell(0);
        totLabel.setCellValue("TỔNG CỘNG");
        totLabel.setCellStyle(totalStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 2));

        for (int i = 1; i <= 2; i++) {
            totRow.createCell(i).setCellStyle(totalStyle);
        }

        Cell totQty = totRow.createCell(3);
        totQty.setCellValue(totalQty.doubleValue());
        totQty.setCellStyle(totalStyle);

        Cell totRev = totRow.createCell(4);
        totRev.setCellValue(totalRev.doubleValue());
        totRev.setCellStyle(totalCurrStyle);

        Cell totPct = totRow.createCell(5);
        totPct.setCellValue(1.0);
        totPct.setCellStyle(pctStyle);

        Cell totPrevRev = totRow.createCell(6);
        totPrevRev.setCellValue(totalPrevRev.doubleValue());
        totPrevRev.setCellStyle(totalCurrStyle);

        Cell totGrowth = totRow.createCell(7);
        double overallGrowth = totalPrevRev.compareTo(BigDecimal.ZERO) > 0
                ? totalRev.subtract(totalPrevRev).divide(totalPrevRev, 4, java.math.RoundingMode.HALF_UP).doubleValue()
                : (totalRev.compareTo(BigDecimal.ZERO) > 0 ? 1.0 : 0.0);
        totGrowth.setCellValue(overallGrowth);
        totGrowth.setCellStyle(pctStyle);

        for (int i = 0; i <= 7; i++) {
            sheet.autoSizeColumn(i);
        }

        return true;
    }

    private boolean exportEmployeeShift(Workbook workbook, String username, LocalDate fromDate, LocalDate toDate, String userId,
                                        CellStyle headerStyle, CellStyle textStyle, CellStyle centerStyle,
                                        CellStyle currStyle, CellStyle totalStyle, CellStyle totalCurrStyle) {
        EmployeeShiftReportResponse report = reportService.getEmployeeShiftReport(username, fromDate, toDate, userId, null);
        if (report == null || report.getShifts().isEmpty()) {
            return false;
        }

        Sheet sheet = workbook.createSheet("Du_Lieu_Ca_Nhan_Vien");
        int rIdx = 0;

        // Bảng 1: Chi tiết ca
        Row titleRow = sheet.createRow(rIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("CHI TIẾT DOANH THU THEO CA LÀM VIỆC");
        titleCell.setCellStyle(headerStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 7));

        String[] headers = {"STT", "Mã ca", "Nhân viên", "Điểm bán", "Bắt đầu", "Kết thúc", "Doanh thu (VNĐ)", "Chênh lệch tiền mặt"};
        Row hRow = sheet.createRow(rIdx++);
        for (int i = 0; i < headers.length; i++) {
            Cell c = hRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        int stt = 1;
        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalDiff = BigDecimal.ZERO;

        for (ShiftRevenueReportItemResponse s : report.getShifts()) {
            Row r = sheet.createRow(rIdx++);
            r.createCell(0).setCellValue(stt++);
            r.getCell(0).setCellStyle(centerStyle);

            r.createCell(1).setCellValue(s.getShiftId() != null ? s.getShiftId() : "");
            r.getCell(1).setCellStyle(centerStyle);

            r.createCell(2).setCellValue(s.getEmployeeName() != null ? s.getEmployeeName() : "");
            r.getCell(2).setCellStyle(textStyle);

            r.createCell(3).setCellValue(s.getPointOfSaleName() != null ? s.getPointOfSaleName() : "");
            r.getCell(3).setCellStyle(textStyle);

            r.createCell(4).setCellValue(s.getOpenedAt() != null ? s.getOpenedAt().format(DATE_TIME_FORMATTER) : "");
            r.getCell(4).setCellStyle(centerStyle);

            r.createCell(5).setCellValue(s.getClosedAt() != null ? s.getClosedAt().format(DATE_TIME_FORMATTER) : "Đang mở");
            r.getCell(5).setCellStyle(centerStyle);

            r.createCell(6).setCellValue(s.getTotalRevenue() != null ? s.getTotalRevenue().doubleValue() : 0.0);
            r.getCell(6).setCellStyle(currStyle);

            r.createCell(7).setCellValue(s.getDifferenceAmount() != null ? s.getDifferenceAmount().doubleValue() : 0.0);
            r.getCell(7).setCellStyle(currStyle);

            if (s.getTotalRevenue() != null) totalRev = totalRev.add(s.getTotalRevenue());
            if (s.getDifferenceAmount() != null) totalDiff = totalDiff.add(s.getDifferenceAmount());
        }

        // Dòng tổng
        Row totRow = sheet.createRow(rIdx++);
        Cell totLabel = totRow.createCell(0);
        totLabel.setCellValue("TỔNG CỘNG");
        totLabel.setCellStyle(totalStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 5));

        for (int i = 1; i <= 5; i++) {
            totRow.createCell(i).setCellStyle(totalStyle);
        }

        Cell totR = totRow.createCell(6);
        totR.setCellValue(totalRev.doubleValue());
        totR.setCellStyle(totalCurrStyle);

        Cell totD = totRow.createCell(7);
        totD.setCellValue(totalDiff.doubleValue());
        totD.setCellStyle(totalCurrStyle);

        for (int i = 0; i <= 7; i++) {
            sheet.autoSizeColumn(i);
        }

        return true;
    }

    private boolean exportDailyRevenue(Workbook workbook, String username, LocalDate fromDate, LocalDate toDate,
                                       CellStyle headerStyle, CellStyle textStyle, CellStyle centerStyle,
                                       CellStyle currStyle, CellStyle totalStyle, CellStyle totalCurrStyle) {
        List<DailyRevenueProjection> list = reportService.getDailyRevenue(username, fromDate, toDate);
        if (list == null || list.isEmpty()) {
            return false;
        }

        Sheet sheet = workbook.createSheet("Du_Lieu_Theo_Ngay");
        int rIdx = 0;

        String[] headers = {"STT", "Ngày", "Số đơn hàng", "Doanh thu thuần (VNĐ)"};
        Row hRow = sheet.createRow(rIdx++);
        for (int i = 0; i < headers.length; i++) {
            Cell c = hRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        int stt = 1;
        long totalOrders = 0;
        BigDecimal totalRev = BigDecimal.ZERO;

        for (DailyRevenueProjection item : list) {
            Row r = sheet.createRow(rIdx++);
            r.createCell(0).setCellValue(stt++);
            r.getCell(0).setCellStyle(centerStyle);

            r.createCell(1).setCellValue(item.getSalesDate() != null ? item.getSalesDate().toString() : "");
            r.getCell(1).setCellStyle(centerStyle);

            r.createCell(2).setCellValue(item.getOrderCount() != null ? item.getOrderCount() : 0);
            r.getCell(2).setCellStyle(centerStyle);

            r.createCell(3).setCellValue(item.getNetRevenue() != null ? item.getNetRevenue().doubleValue() : 0.0);
            r.getCell(3).setCellStyle(currStyle);

            if (item.getOrderCount() != null) totalOrders += item.getOrderCount();
            if (item.getNetRevenue() != null) totalRev = totalRev.add(item.getNetRevenue());
        }

        Row totRow = sheet.createRow(rIdx++);
        Cell totLabel = totRow.createCell(0);
        totLabel.setCellValue("TỔNG CỘNG");
        totLabel.setCellStyle(totalStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 1));
        totRow.createCell(1).setCellStyle(totalStyle);

        Cell cOrders = totRow.createCell(2);
        cOrders.setCellValue(totalOrders);
        cOrders.setCellStyle(totalStyle);

        Cell cRev = totRow.createCell(3);
        cRev.setCellValue(totalRev.doubleValue());
        cRev.setCellStyle(totalCurrStyle);

        for (int i = 0; i <= 3; i++) {
            sheet.autoSizeColumn(i);
        }

        return true;
    }

    private boolean exportProductRevenue(Workbook workbook, String username, LocalDate fromDate, LocalDate toDate,
                                         CellStyle headerStyle, CellStyle textStyle, CellStyle centerStyle,
                                         CellStyle currStyle, CellStyle totalStyle, CellStyle totalCurrStyle) {
        List<ProductRevenueProjection> list = reportService.getProductRevenue(username, fromDate, toDate);
        if (list == null || list.isEmpty()) {
            return false;
        }

        Sheet sheet = workbook.createSheet("Du_Lieu_SanPham");
        int rIdx = 0;

        String[] headers = {"STT", "Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Số lượng bán", "Doanh thu (VNĐ)"};
        Row hRow = sheet.createRow(rIdx++);
        for (int i = 0; i < headers.length; i++) {
            Cell c = hRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        int stt = 1;
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalRev = BigDecimal.ZERO;

        for (ProductRevenueProjection item : list) {
            Row r = sheet.createRow(rIdx++);
            r.createCell(0).setCellValue(stt++);
            r.getCell(0).setCellStyle(centerStyle);

            r.createCell(1).setCellValue(item.getProductId() != null ? item.getProductId() : "");
            r.getCell(1).setCellStyle(centerStyle);

            r.createCell(2).setCellValue(item.getProductName() != null ? item.getProductName() : "");
            r.getCell(2).setCellStyle(textStyle);

            r.createCell(3).setCellValue(item.getUnit() != null ? item.getUnit() : "");
            r.getCell(3).setCellStyle(centerStyle);

            r.createCell(4).setCellValue(item.getQuantitySold() != null ? item.getQuantitySold().doubleValue() : 0.0);
            r.getCell(4).setCellStyle(centerStyle);

            r.createCell(5).setCellValue(item.getRevenue() != null ? item.getRevenue().doubleValue() : 0.0);
            r.getCell(5).setCellStyle(currStyle);

            if (item.getQuantitySold() != null) totalQty = totalQty.add(item.getQuantitySold());
            if (item.getRevenue() != null) totalRev = totalRev.add(item.getRevenue());
        }

        Row totRow = sheet.createRow(rIdx++);
        Cell totLabel = totRow.createCell(0);
        totLabel.setCellValue("TỔNG CỘNG");
        totLabel.setCellStyle(totalStyle);
        sheet.addMergedRegion(new CellRangeAddress(rIdx - 1, rIdx - 1, 0, 3));

        for (int i = 1; i <= 3; i++) {
            totRow.createCell(i).setCellStyle(totalStyle);
        }

        Cell cQty = totRow.createCell(4);
        cQty.setCellValue(totalQty.doubleValue());
        cQty.setCellStyle(totalStyle);

        Cell cRev = totRow.createCell(5);
        cRev.setCellValue(totalRev.doubleValue());
        cRev.setCellStyle(totalCurrStyle);

        for (int i = 0; i <= 5; i++) {
            sheet.autoSizeColumn(i);
        }

        return true;
    }

    private void recordAuditLog(BusinessHousehold household, User currentUser, String reportType, LocalDate fromDate, LocalDate toDate) {
        try {
            String clientIp = "UNKNOWN";
            String userAgent = "UNKNOWN";
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null && attributes.getRequest() != null) {
                HttpServletRequest request = attributes.getRequest();
                clientIp = request.getRemoteAddr();
                userAgent = request.getHeader("User-Agent");
            }

            String desc = "Xuất báo cáo Excel loại: " + reportType +
                    " (Từ: " + (fromDate != null ? fromDate : "Toàn bộ") +
                    " - Đến: " + (toDate != null ? toDate : "Hiện tại") + ")";

            activityLogHelper.logActivityInNewTransaction(
                    household,
                    currentUser,
                    "EXPORT_REPORT",
                    "reports",
                    reportType,
                    null,
                    desc,
                    clientIp,
                    userAgent
            );
        } catch (Exception e) {
            log.warn("Không thể ghi audit log khi xuất báo cáo: {}", e.getMessage());
        }
    }

    // Các helper styles
    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createBoldStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createAlertHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.ORANGE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createTextStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createCenterStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createPercentStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("0.00%"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createTotalRowStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private CellStyle createTotalCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private void setBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }
}
