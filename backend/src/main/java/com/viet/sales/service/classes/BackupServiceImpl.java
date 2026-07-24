package com.viet.sales.service.classes;

import com.viet.sales.constant.BackupType;
import com.viet.sales.entity.EInvoice;
import com.viet.sales.entity.Product;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.EInvoiceRepository;
import com.viet.sales.repository.ProductRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.BackupService;
import com.viet.sales.specification.EInvoiceSpecification;
import com.viet.sales.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
            byte[] excelData = createProductsExcel(products);
            String filename = "backup_products_all.xlsx";
            return createDownloadResponse(excelData, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.INVOICES) {
            List<EInvoice> invoices = eInvoiceRepository.findAll(EInvoiceSpecification.filterInvoices(householdId, null, effectiveFromDate, effectiveToDate, null, null));
            if (invoices.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }
            byte[] excelData = createInvoicesExcel(invoices);
            String filename = "backup_invoices_" + dateStr + ".xlsx";
            return createDownloadResponse(excelData, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        } else if (type == BackupType.FULL) {
            List<Product> products = productRepository.findAll(ProductSpecification.filterProducts(householdId, null, null, null, null, null));
            List<EInvoice> invoices = eInvoiceRepository.findAll(EInvoiceSpecification.filterInvoices(householdId, null, effectiveFromDate, effectiveToDate, null, null));

            if (products.isEmpty() && invoices.isEmpty()) {
                throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
            }

            byte[] zipData = createZipArchive(products, invoices);
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

    private void writeProductsExcelToStream(List<Product> products, java.io.OutputStream out) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        try {
            Sheet sheet = workbook.createSheet("Danh_Muc_Hang_Hoa");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"STT", "Mã SKU", "Tên hàng hóa", "Đơn vị tính", "Giá bán", "Tồn kho", "Nhóm hàng", "Trạng thái"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }

            int rowIdx = 1;
            for (Product p : products) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
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

    private byte[] createProductsExcel(List<Product> products) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            writeProductsExcelToStream(products, out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup sản phẩm", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void writeInvoicesExcelToStream(List<EInvoice> invoices, java.io.OutputStream out) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        try {
            Sheet sheet = workbook.createSheet("Danh_Sach_Hoa_Don");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"STT", "Mã tra cứu", "Số hóa đơn", "Tên người mua", "MST người mua", "Tổng tiền trước thuế", "Tiền thuế", "Tổng thanh toán", "Trạng thái", "Ngày tạo"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }

            int rowIdx = 1;
            for (EInvoice inv : invoices) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
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

    private byte[] createInvoicesExcel(List<EInvoice> invoices) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            writeInvoicesExcelToStream(invoices, out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi tạo file Excel backup hóa đơn", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private byte[] createZipArchive(List<Product> products, List<EInvoice> invoices) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            if (!products.isEmpty()) {
                ZipEntry entryProd = new ZipEntry("products.xlsx");
                zos.putNextEntry(entryProd);
                writeProductsExcelToStream(products, zos);
                zos.closeEntry();
            }

            if (!invoices.isEmpty()) {
                ZipEntry entryInv = new ZipEntry("invoices.xlsx");
                zos.putNextEntry(entryInv);
                writeInvoicesExcelToStream(invoices, zos);
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
