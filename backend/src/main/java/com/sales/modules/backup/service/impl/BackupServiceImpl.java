package com.sales.modules.backup.service.impl;
import com.sales.common.constant.BackupType;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.OrderItem;
import com.sales.modules.product.entity.Product;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.backup.service.BackupService;
import com.sales.modules.invoice.specification.EInvoiceSpecification;
import com.sales.modules.product.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
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

    private static final DateTimeFormatter DATE_FILE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

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
            File tempFile = createProductsExcel(products, effectiveFromDate, effectiveToDate);
            String filename = "backup_products_all.xlsx";
            return createDownloadResponse(tempFile, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.ORDERS) {
            LocalDateTime startDateTime = effectiveFromDate.atStartOfDay();
            LocalDateTime endDateTime = effectiveToDate.atTime(LocalTime.MAX);
            List<Order> orders = orderRepository.findOrdersForBackup(householdId, startDateTime, endDateTime);
            if (orders.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }
            File tempFile = createOrdersExcel(orders, effectiveFromDate, effectiveToDate);
            String filename = "backup_orders_" + dateStr + ".xlsx";
            return createDownloadResponse(tempFile, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.INVOICES) {
            List<EInvoice> invoices = eInvoiceRepository.findAll(EInvoiceSpecification.filterInvoices(householdId, null, effectiveFromDate, effectiveToDate, null, null));
            if (invoices.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }
            File tempFile = createInvoicesExcel(invoices, effectiveFromDate, effectiveToDate);
            String filename = "backup_invoices_" + dateStr + ".xlsx";
            return createDownloadResponse(tempFile, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.FULL) {
            List<Product> products = productRepository.findAll(ProductSpecification.filterProducts(householdId, null, null, null, null, null));
            LocalDateTime startDateTime = effectiveFromDate.atStartOfDay();
            LocalDateTime endDateTime = effectiveToDate.atTime(LocalTime.MAX);
            List<Order> orders = orderRepository.findOrdersForBackup(householdId, startDateTime, endDateTime);
            List<EInvoice> invoices = eInvoiceRepository.findAll(EInvoiceSpecification.filterInvoices(householdId, null, effectiveFromDate, effectiveToDate, null, null));

            if (products.isEmpty() && orders.isEmpty() && invoices.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }

            File tempFile = createZipArchive(products, orders, invoices, effectiveFromDate, effectiveToDate);
            String filename = "backup_full_" + dateStr + ".zip";
            return createDownloadResponse(tempFile, filename, "application/zip");
        }

        throw new AppException(ErrorCode.INVALID_INPUT);
    }

    private String formatDateRangeStr(LocalDate fromDate, LocalDate toDate) {
        String from = fromDate != null ? fromDate.format(DATE_FILE_FORMATTER) : "start";
        String to = toDate != null ? toDate.format(DATE_FILE_FORMATTER) : "end";
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

    private Sheet createReportSheet(Workbook workbook, String sheetName, String title, LocalDate fromDate, LocalDate toDate) {
        Sheet sheet = workbook.createSheet(sheetName);
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle metaStyle = createMetaStyle(workbook);

        String fromStr = fromDate != null ? fromDate.format(DATE_FORMATTER) : "Tất cả";
        String toStr = toDate != null ? toDate.format(DATE_FORMATTER) : "Tất cả";
        String dateStr = fromStr + " - " + toStr;
        String exportTimeStr = LocalDateTime.now().format(DATETIME_FORMATTER);

        Row r0 = sheet.createRow(0);
        Cell c0 = r0.createCell(0);
        c0.setCellValue(title);
        c0.setCellStyle(titleStyle);

        Row r1 = sheet.createRow(1);
        Cell c1 = r1.createCell(0);
        c1.setCellValue("Khoảng thời gian sao lưu: " + dateStr);
        c1.setCellStyle(metaStyle);

        Row r2 = sheet.createRow(2);
        Cell c2 = r2.createCell(0);
        c2.setCellValue("Thời điểm xuất tệp: " + exportTimeStr);
        c2.setCellStyle(metaStyle);

        return sheet;
    }

    private void writeProductsExcelToStream(List<Product> products, LocalDate fromDate, LocalDate toDate, java.io.OutputStream out) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try {
                Sheet sheet = createReportSheet(workbook, "Danh_Muc_Hang_Hoa", "BÁO CÁO SAO LƯU DANH MỤC HÀNG HÓA SẢN PHẨM", fromDate, toDate);
                CellStyle headerStyle = createHeaderStyle(workbook);

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
    }

    private File createProductsExcel(List<Product> products, LocalDate fromDate, LocalDate toDate) {
        try {
            File tempFile = File.createTempFile("backup_products_", ".xlsx");
            tempFile.deleteOnExit();
            try (OutputStream out = new BufferedOutputStream(new FileOutputStream(tempFile))) {
                writeProductsExcelToStream(products, fromDate, toDate, out);
            }
            return tempFile;
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup sản phẩm", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void writeOrdersExcelToStream(List<Order> orders, LocalDate fromDate, LocalDate toDate, java.io.OutputStream out) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try {
                CellStyle headerStyle = createHeaderStyle(workbook);

                // Sheet 1: Lich_Su_Don_Hang
                Sheet sheet1 = createReportSheet(workbook, "Lich_Su_Don_Hang", "BÁO CÁO SAO LƯU LỊCH SỬ ĐƠN HÀNG", fromDate, toDate);

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
                    row.createCell(2).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().format(DATETIME_FORMATTER) : "");
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
                Sheet sheet2 = createReportSheet(workbook, "Chi_Tiet_Don_Hang", "BÁO CÁO CHI TIẾT MẶT HÀNG TRONG ĐƠN BÁN HÀNG", fromDate, toDate);

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
                            row.createCell(2).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().format(DATETIME_FORMATTER) : "");
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
    }

    private File createOrdersExcel(List<Order> orders, LocalDate fromDate, LocalDate toDate) {
        try {
            File tempFile = File.createTempFile("backup_orders_", ".xlsx");
            tempFile.deleteOnExit();
            try (OutputStream out = new BufferedOutputStream(new FileOutputStream(tempFile))) {
                writeOrdersExcelToStream(orders, fromDate, toDate, out);
            }
            return tempFile;
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup đơn hàng", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void writeInvoicesExcelToStream(List<EInvoice> invoices, LocalDate fromDate, LocalDate toDate, java.io.OutputStream out) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            try {
                Sheet sheet = createReportSheet(workbook, "Danh_Sach_Hoa_Don", "BÁO CÁO SAO LƯU DANH SÁCH HÓA ĐƠN THUẾ GTGT", fromDate, toDate);
                CellStyle headerStyle = createHeaderStyle(workbook);

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
    }

    private File createInvoicesExcel(List<EInvoice> invoices, LocalDate fromDate, LocalDate toDate) {
        try {
            File tempFile = File.createTempFile("backup_invoices_", ".xlsx");
            tempFile.deleteOnExit();
            try (OutputStream out = new BufferedOutputStream(new FileOutputStream(tempFile))) {
                writeInvoicesExcelToStream(invoices, fromDate, toDate, out);
            }
            return tempFile;
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup hóa đơn", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private File createZipArchive(List<Product> products, List<Order> orders, List<EInvoice> invoices, LocalDate fromDate, LocalDate toDate) {
        try {
            File tempFile = File.createTempFile("backup_full_", ".zip");
            tempFile.deleteOnExit();
            try (OutputStream fos = new BufferedOutputStream(new FileOutputStream(tempFile));
                 ZipOutputStream zos = new ZipOutputStream(fos)) {

                // 1. Danh mục Hàng hóa (.xlsx + .csv cho dữ liệu lớn)
                if (!products.isEmpty()) {
                    ZipEntry entryProdXlsx = new ZipEntry("products.xlsx");
                    zos.putNextEntry(entryProdXlsx);
                    writeProductsExcelToStream(products, fromDate, toDate, zos);
                    zos.closeEntry();

                    ZipEntry entryProdCsv = new ZipEntry("products.csv");
                    zos.putNextEntry(entryProdCsv);
                    writeProductsCsvToStream(products, zos);
                    zos.closeEntry();
                }

                // 2. Lịch sử Đơn hàng (.xlsx + .csv)
                if (!orders.isEmpty()) {
                    ZipEntry entryOrdXlsx = new ZipEntry("orders.xlsx");
                    zos.putNextEntry(entryOrdXlsx);
                    writeOrdersExcelToStream(orders, fromDate, toDate, zos);
                    zos.closeEntry();

                    ZipEntry entryOrdCsv = new ZipEntry("orders.csv");
                    zos.putNextEntry(entryOrdCsv);
                    writeOrdersCsvToStream(orders, zos);
                    zos.closeEntry();
                }

                // 3. Hóa đơn điện tử (.xlsx + .csv)
                if (!invoices.isEmpty()) {
                    ZipEntry entryInvXlsx = new ZipEntry("invoices.xlsx");
                    zos.putNextEntry(entryInvXlsx);
                    writeInvoicesExcelToStream(invoices, fromDate, toDate, zos);
                    zos.closeEntry();

                    ZipEntry entryInvCsv = new ZipEntry("invoices.csv");
                    zos.putNextEntry(entryInvCsv);
                    writeInvoicesCsvToStream(invoices, zos);
                    zos.closeEntry();
                }

                zos.finish();
            }
            return tempFile;
        } catch (IOException e) {
            log.error("Lỗi nén tệp zip backup", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void writeProductsCsvToStream(List<Product> products, OutputStream out) throws IOException {
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));
        writer.write('\ufeff'); // UTF-8 BOM để Excel hiển thị đúng dấu Tiếng Việt
        writer.write("STT,Mã SKU,Tên hàng hóa,Đơn vị tính,Giá bán,Tồn kho,Nhóm hàng,Trạng thái\r\n");
        int stt = 1;
        for (Product p : products) {
            writer.write(String.format("%d,\"%s\",\"%s\",\"%s\",%s,%s,\"%s\",\"%s\"\r\n",
                    stt++,
                    escapeCsv(p.getSku()),
                    escapeCsv(p.getName()),
                    escapeCsv(p.getUnit()),
                    p.getPrice() != null ? p.getPrice().toPlainString() : "0",
                    p.getStockQuantity() != null ? p.getStockQuantity().toPlainString() : "0",
                    escapeCsv(p.getGroup() != null ? p.getGroup().getName() : ""),
                    escapeCsv(p.getStatus())
            ));
        }
        writer.flush();
    }

    private void writeOrdersCsvToStream(List<Order> orders, OutputStream out) throws IOException {
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));
        writer.write('\ufeff');
        writer.write("STT,Mã đơn hàng,Ngày tạo,Khách hàng,SĐT Khách hàng,Nhân viên tạo,Phương thức TT,Trạng thái TT,Trạng thái đơn,Tổng tiền hàng,Giảm giá,Thành tiền\r\n");
        int stt = 1;
        for (Order o : orders) {
            writer.write(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,%s,%s\r\n",
                    stt++,
                    escapeCsv(o.getOrderNumber()),
                    escapeCsv(o.getCreatedAt() != null ? o.getCreatedAt().format(DATETIME_FORMATTER) : ""),
                    escapeCsv(o.getCustomer() != null && o.getCustomer().getName() != null ? o.getCustomer().getName() : "Khách lẻ"),
                    escapeCsv(o.getCustomer() != null && o.getCustomer().getPhoneNumber() != null ? o.getCustomer().getPhoneNumber() : ""),
                    escapeCsv(o.getCreatedByUser() != null && o.getCreatedByUser().getFullName() != null ? o.getCreatedByUser().getFullName() : (o.getCreatedByUser() != null ? o.getCreatedByUser().getUsername() : "")),
                    escapeCsv(o.getPaymentMethod()),
                    escapeCsv(o.getPaymentStatus()),
                    escapeCsv(o.getStatus()),
                    o.getTotalAmount() != null ? o.getTotalAmount().toPlainString() : "0",
                    o.getDiscountAmount() != null ? o.getDiscountAmount().toPlainString() : "0",
                    o.getFinalAmount() != null ? o.getFinalAmount().toPlainString() : "0"
            ));
        }
        writer.flush();
    }

    private void writeInvoicesCsvToStream(List<EInvoice> invoices, OutputStream out) throws IOException {
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));
        writer.write('\ufeff');
        writer.write("STT,Mã tra cứu,Số hóa đơn,Tên người mua,MST người mua,Tổng tiền trước thuế,Tiền thuế,Tổng thanh toán,Trạng thái,Ngày tạo\r\n");
        int stt = 1;
        for (EInvoice inv : invoices) {
            writer.write(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",%s,%s,%s,\"%s\",\"%s\"\r\n",
                    stt++,
                    escapeCsv(inv.getLookupCode()),
                    escapeCsv(inv.getInvoiceNumber()),
                    escapeCsv(inv.getBuyerName()),
                    escapeCsv(inv.getBuyerTaxCode()),
                    inv.getTotalAmountBeforeTax() != null ? inv.getTotalAmountBeforeTax().toPlainString() : "0",
                    inv.getTaxAmount() != null ? inv.getTaxAmount().toPlainString() : "0",
                    inv.getFinalAmount() != null ? inv.getFinalAmount().toPlainString() : "0",
                    escapeCsv(inv.getStatus()),
                    escapeCsv(inv.getCreatedAt() != null ? inv.getCreatedAt().toString() : "")
            ));
        }
        writer.flush();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return val.replace("\"", "\"\"");
    }

    /**
     * Resource quản lý tệp tạm tự động xóa khi luồng dữ liệu HTTP hoàn tất hoặc đóng kết nối
     */
    public static class CleanupFileSystemResource extends FileSystemResource {
        public CleanupFileSystemResource(File file) {
            super(file);
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return new FileInputStream(getFile()) {
                @Override
                public void close() throws IOException {
                    try {
                        super.close();
                    } finally {
                        try {
                            Files.deleteIfExists(getFile().toPath());
                        } catch (Exception ignored) {
                        }
                    }
                }
            };
        }
    }

    private ResponseEntity<Resource> createDownloadResponse(File tempFile, String filename, String contentTypeStr) {
        CleanupFileSystemResource resource = new CleanupFileSystemResource(tempFile);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .contentLength(tempFile.length())
                .contentType(MediaType.parseMediaType(contentTypeStr))
                .body(resource);
    }
}
