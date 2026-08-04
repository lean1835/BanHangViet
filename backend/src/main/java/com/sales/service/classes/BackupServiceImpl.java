package com.sales.service.classes;

import com.sales.constant.BackupType;
import com.sales.entity.EInvoice;
import com.sales.entity.Order;
import com.sales.entity.OrderItem;
import com.sales.entity.Product;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.BackupService;
import com.sales.specification.EInvoiceSpecification;
import com.sales.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupServiceImpl implements BackupService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> exportBackupData(String currentUsername, BackupType type, LocalDate fromDate, LocalDate toDate) {
        LocalDate effectiveToDate = toDate != null ? toDate : LocalDate.now();
        LocalDate effectiveFromDate = fromDate != null ? fromDate : effectiveToDate.minusYears(1);

        if (effectiveFromDate.isAfter(effectiveToDate) || effectiveFromDate.plusYears(1).isBefore(effectiveToDate)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (currentUser.getRole() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String roleCode = currentUser.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"OWNER".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (currentUser.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        String householdId = currentUser.getHousehold().getId();
        String dateStr = formatDateRangeStr(effectiveFromDate, effectiveToDate);

        if (type == BackupType.PRODUCTS) {
            List<Product> products = productRepository.findAll(ProductSpecification.filterProducts(householdId, null, null, null, null, null));
            if (products.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }
            byte[] excelData = createProductsExcel(products, effectiveFromDate, effectiveToDate);
            String filename = "backup_products_all.xlsx";
            return createDownloadResponse(excelData, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.ORDERS) {
            LocalDateTime startDateTime = effectiveFromDate.atStartOfDay();
            LocalDateTime endDateTime = effectiveToDate.atTime(LocalTime.MAX);
            List<Order> orders = orderRepository.findByHouseholdIdAndDeletedAtIsNullAndCreatedAtBetweenOrderByCreatedAtDesc(householdId, startDateTime, endDateTime);
            if (orders.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }
            byte[] excelData = createOrdersExcel(orders, effectiveFromDate, effectiveToDate);
            String filename = "backup_orders_" + dateStr + ".xlsx";
            return createDownloadResponse(excelData, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.INVOICES) {
            List<EInvoice> invoices = eInvoiceRepository.findAll(EInvoiceSpecification.filterInvoices(householdId, null, effectiveFromDate, effectiveToDate, null, null));
            if (invoices.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }
            byte[] excelData = createInvoicesExcel(invoices, effectiveFromDate, effectiveToDate);
            String filename = "backup_invoices_" + dateStr + ".xlsx";
            return createDownloadResponse(excelData, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.FULL) {
            List<Product> products = productRepository.findAll(ProductSpecification.filterProducts(householdId, null, null, null, null, null));
            LocalDateTime startDateTime = effectiveFromDate.atStartOfDay();
            LocalDateTime endDateTime = effectiveToDate.atTime(LocalTime.MAX);
            List<Order> orders = orderRepository.findByHouseholdIdAndDeletedAtIsNullAndCreatedAtBetweenOrderByCreatedAtDesc(householdId, startDateTime, endDateTime);
            List<EInvoice> invoices = eInvoiceRepository.findAll(EInvoiceSpecification.filterInvoices(householdId, null, effectiveFromDate, effectiveToDate, null, null));

            if (products.isEmpty() && orders.isEmpty() && invoices.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }

            byte[] zipData = createZipArchive(products, orders, invoices, effectiveFromDate, effectiveToDate);
            String filename = "backup_full_" + dateStr + ".zip";
            return createDownloadResponse(zipData, filename, "application/zip");
        }

        throw new AppException(ErrorCode.INVALID_INPUT);
    }

    private String formatDateRangeStr(LocalDate fromDate, LocalDate toDate) {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd");
        String from = fromDate != null ? fromDate.format(dtf) : "start";
        String to = toDate != null ? toDate.format(dtf) : "end";
        return from + "_" + to;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return headerStyle;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle createMetaStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        return style;
    }

    private void writeProductsExcelToStream(List<Product> products, LocalDate fromDate, LocalDate toDate, java.io.OutputStream out) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        try {
            Sheet sheet = workbook.createSheet("Danh_Muc_Hang_Hoa");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle metaStyle = createMetaStyle(workbook);

            String dateStr = (fromDate != null ? fromDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Tất cả") +
                    " - " + (toDate != null ? toDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Tất cả");
            String exportTimeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

            Row r0 = sheet.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("BÁO CÁO SAO LƯU DANH MỤC HÀNG HÓA SẢN PHẨM");
            c0.setCellStyle(titleStyle);

            Row r1 = sheet.createRow(1);
            Cell c1 = r1.createCell(0);
            c1.setCellValue("Khoảng thời gian sao lưu: " + dateStr);
            c1.setCellStyle(metaStyle);

            Row r2 = sheet.createRow(2);
            Cell c2 = r2.createCell(0);
            c2.setCellValue("Thời điểm xuất tệp: " + exportTimeStr);
            c2.setCellStyle(metaStyle);

            Row headerRow = sheet.createRow(4);
            String[] headers = {"STT", "Mã SKU", "Tên hàng hóa", "Đơn vị tính", "Giá bán", "Tồn kho", "Nhóm hàng", "Trạng thái"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }

            int rowIdx = 5;
            for (Product p : products) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 5);
                row.createCell(1).setCellValue(p.getSku() != null ? p.getSku() : "");
                row.createCell(2).setCellValue(p.getName() != null ? p.getName() : "");
                row.createCell(3).setCellValue(p.getUnit() != null ? p.getUnit() : "");
                row.createCell(4).setCellValue(p.getPrice() != null ? p.getPrice().doubleValue() : 0);
                row.createCell(5).setCellValue(p.getStockQuantity() != null ? p.getStockQuantity().doubleValue() : 0);
                row.createCell(6).setCellValue(p.getGroup() != null ? p.getGroup().getName() : "");
                row.createCell(7).setCellValue(p.getStatus() != null ? p.getStatus() : "");
            }

            workbook.write(out);
        } finally {
            workbook.dispose();
        }
    }

    private byte[] createProductsExcel(List<Product> products, LocalDate fromDate, LocalDate toDate) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            writeProductsExcelToStream(products, fromDate, toDate, out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup sản phẩm", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void writeOrdersExcelToStream(List<Order> orders, LocalDate fromDate, LocalDate toDate, java.io.OutputStream out) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        try {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle metaStyle = createMetaStyle(workbook);

            String dateStr = (fromDate != null ? fromDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "") +
                    " - " + (toDate != null ? toDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            String exportTimeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

            // Sheet 1: Lich_Su_Don_Hang
            Sheet sheet1 = workbook.createSheet("Lich_Su_Don_Hang");
            Row r0 = sheet1.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("BÁO CÁO SAO LƯU LỊCH SỬ ĐƠN HÀNG");
            c0.setCellStyle(titleStyle);

            Row r1 = sheet1.createRow(1);
            Cell c1 = r1.createCell(0);
            c1.setCellValue("Khoảng thời gian sao lưu: " + dateStr);
            c1.setCellStyle(metaStyle);

            Row r2 = sheet1.createRow(2);
            Cell c2 = r2.createCell(0);
            c2.setCellValue("Thời điểm xuất tệp: " + exportTimeStr);
            c2.setCellStyle(metaStyle);

            String[] headers1 = {"STT", "Mã đơn hàng", "Ngày tạo", "Khách hàng", "SĐT Khách hàng", "Nhân viên tạo", "Phương thức TT", "Trạng thái TT", "Trạng thái đơn", "Tổng tiền hàng", "Giảm giá", "Thành tiền"};
            Row headerRow1 = sheet1.createRow(4);
            for (int i = 0; i < headers1.length; i++) {
                Cell cell = headerRow1.createCell(i);
                cell.setCellValue(headers1[i]);
                cell.setCellStyle(headerStyle);
                sheet1.setColumnWidth(i, 20 * 256);
            }

            int rowIdx1 = 5;
            for (Order o : orders) {
                Row row = sheet1.createRow(rowIdx1++);
                row.createCell(0).setCellValue(rowIdx1 - 5);
                row.createCell(1).setCellValue(o.getOrderNumber() != null ? o.getOrderNumber() : "");
                row.createCell(2).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "");
                row.createCell(3).setCellValue(o.getCustomer() != null && o.getCustomer().getName() != null ? o.getCustomer().getName() : "Khách lẻ");
                row.createCell(4).setCellValue(o.getCustomer() != null && o.getCustomer().getPhoneNumber() != null ? o.getCustomer().getPhoneNumber() : "");
                row.createCell(5).setCellValue(o.getCreatedByUser() != null && o.getCreatedByUser().getFullName() != null ? o.getCreatedByUser().getFullName() : (o.getCreatedByUser() != null ? o.getCreatedByUser().getUsername() : ""));
                row.createCell(6).setCellValue(o.getPaymentMethod() != null ? o.getPaymentMethod() : "");
                row.createCell(7).setCellValue(o.getPaymentStatus() != null ? o.getPaymentStatus() : "");
                row.createCell(8).setCellValue(o.getStatus() != null ? o.getStatus() : "");
                row.createCell(9).setCellValue(o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0);
                row.createCell(10).setCellValue(o.getDiscountAmount() != null ? o.getDiscountAmount().doubleValue() : 0);
                row.createCell(11).setCellValue(o.getFinalAmount() != null ? o.getFinalAmount().doubleValue() : 0);
            }

            // Sheet 2: Chi_Tiet_Don_Hang
            Sheet sheet2 = workbook.createSheet("Chi_Tiet_Don_Hang");
            Row r0_2 = sheet2.createRow(0);
            Cell c0_2 = r0_2.createCell(0);
            c0_2.setCellValue("BÁO CÁO CHI TIẾT MẶT HÀNG TRONG ĐƠN BÁN HÀNG");
            c0_2.setCellStyle(titleStyle);

            Row r1_2 = sheet2.createRow(1);
            Cell c1_2 = r1_2.createCell(0);
            c1_2.setCellValue("Khoảng thời gian sao lưu: " + dateStr);
            c1_2.setCellStyle(metaStyle);

            Row r2_2 = sheet2.createRow(2);
            Cell c2_2 = r2_2.createCell(0);
            c2_2.setCellValue("Thời điểm xuất tệp: " + exportTimeStr);
            c2_2.setCellStyle(metaStyle);

            String[] headers2 = {"STT", "Mã đơn hàng", "Ngày tạo", "Tên sản phẩm", "Mã SKU", "Đơn vị tính", "Đơn giá", "Số lượng", "Thành tiền"};
            Row headerRow2 = sheet2.createRow(4);
            for (int i = 0; i < headers2.length; i++) {
                Cell cell = headerRow2.createCell(i);
                cell.setCellValue(headers2[i]);
                cell.setCellStyle(headerStyle);
                sheet2.setColumnWidth(i, 20 * 256);
            }

            int rowIdx2 = 5;
            for (Order o : orders) {
                if (o.getItems() != null) {
                    for (OrderItem item : o.getItems()) {
                        Row row = sheet2.createRow(rowIdx2++);
                        row.createCell(0).setCellValue(rowIdx2 - 5);
                        row.createCell(1).setCellValue(o.getOrderNumber() != null ? o.getOrderNumber() : "");
                        row.createCell(2).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "");
                        row.createCell(3).setCellValue(item.getProductName() != null ? item.getProductName() : (item.getProduct() != null ? item.getProduct().getName() : ""));
                        row.createCell(4).setCellValue(item.getProduct() != null && item.getProduct().getSku() != null ? item.getProduct().getSku() : "");
                        row.createCell(5).setCellValue(item.getProduct() != null && item.getProduct().getUnit() != null ? item.getProduct().getUnit() : "");
                        row.createCell(6).setCellValue(item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0);
                        row.createCell(7).setCellValue(item.getQuantity() != null ? item.getQuantity().doubleValue() : 0);
                        row.createCell(8).setCellValue(item.getSubtotal() != null ? item.getSubtotal().doubleValue() : 0);
                    }
                }
            }

            workbook.write(out);
        } finally {
            workbook.dispose();
        }
    }

    private byte[] createOrdersExcel(List<Order> orders, LocalDate fromDate, LocalDate toDate) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            writeOrdersExcelToStream(orders, fromDate, toDate, out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup đơn hàng", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void writeInvoicesExcelToStream(List<EInvoice> invoices, LocalDate fromDate, LocalDate toDate, java.io.OutputStream out) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        try {
            Sheet sheet = workbook.createSheet("Danh_Sach_Hoa_Don");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle metaStyle = createMetaStyle(workbook);

            String dateStr = (fromDate != null ? fromDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "") +
                    " - " + (toDate != null ? toDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            String exportTimeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

            Row r0 = sheet.createRow(0);
            Cell c0 = r0.createCell(0);
            c0.setCellValue("BÁO CÁO SAO LƯU DANH SÁCH HÓA ĐƠN THUẾ GTGT");
            c0.setCellStyle(titleStyle);

            Row r1 = sheet.createRow(1);
            Cell c1 = r1.createCell(0);
            c1.setCellValue("Khoảng thời gian sao lưu: " + dateStr);
            c1.setCellStyle(metaStyle);

            Row r2 = sheet.createRow(2);
            Cell c2 = r2.createCell(0);
            c2.setCellValue("Thời điểm xuất tệp: " + exportTimeStr);
            c2.setCellStyle(metaStyle);

            Row headerRow = sheet.createRow(4);
            String[] headers = {"STT", "Mã tra cứu", "Số hóa đơn", "Tên người mua", "MST người mua", "Tổng tiền trước thuế", "Tiền thuế", "Tổng thanh toán", "Trạng thái", "Ngày tạo"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }

            int rowIdx = 5;
            for (EInvoice inv : invoices) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 5);
                row.createCell(1).setCellValue(inv.getLookupCode() != null ? inv.getLookupCode() : "");
                row.createCell(2).setCellValue(inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : "");
                row.createCell(3).setCellValue(inv.getBuyerName() != null ? inv.getBuyerName() : "");
                row.createCell(4).setCellValue(inv.getBuyerTaxCode() != null ? inv.getBuyerTaxCode() : "");
                row.createCell(5).setCellValue(inv.getTotalAmountBeforeTax() != null ? inv.getTotalAmountBeforeTax().doubleValue() : 0);
                row.createCell(6).setCellValue(inv.getTaxAmount() != null ? inv.getTaxAmount().doubleValue() : 0);
                row.createCell(7).setCellValue(inv.getFinalAmount() != null ? inv.getFinalAmount().doubleValue() : 0);
                row.createCell(8).setCellValue(inv.getStatus() != null ? inv.getStatus() : "");
                row.createCell(9).setCellValue(inv.getCreatedAt() != null ? inv.getCreatedAt().toString() : "");
            }

            workbook.write(out);
        } finally {
            workbook.dispose();
        }
    }

    private byte[] createInvoicesExcel(List<EInvoice> invoices, LocalDate fromDate, LocalDate toDate) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            writeInvoicesExcelToStream(invoices, fromDate, toDate, out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup hóa đơn", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private byte[] createZipArchive(List<Product> products, List<Order> orders, List<EInvoice> invoices, LocalDate fromDate, LocalDate toDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            if (!products.isEmpty()) {
                ZipEntry entryProd = new ZipEntry("products.xlsx");
                zos.putNextEntry(entryProd);
                writeProductsExcelToStream(products, fromDate, toDate, zos);
                zos.closeEntry();
            }

            if (!orders.isEmpty()) {
                ZipEntry entryOrd = new ZipEntry("orders.xlsx");
                zos.putNextEntry(entryOrd);
                writeOrdersExcelToStream(orders, fromDate, toDate, zos);
                zos.closeEntry();
            }

            if (!invoices.isEmpty()) {
                ZipEntry entryInv = new ZipEntry("invoices.xlsx");
                zos.putNextEntry(entryInv);
                writeInvoicesExcelToStream(invoices, fromDate, toDate, zos);
                zos.closeEntry();
            }

            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi nén tệp zip backup", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private ResponseEntity<Resource> createDownloadResponse(byte[] data, String filename, String contentTypeStr) {
        ByteArrayResource resource = new ByteArrayResource(data);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentTypeStr))
                .body(resource);
    }
}
