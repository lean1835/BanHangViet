package com.sales.service.classes;

import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.dto.response.ImportCustomerResultResponse;
import com.sales.dto.response.ImportCustomerResultResponse.RowErrorDetail;
import com.sales.dto.response.ImportPreviewResponse;
import com.sales.dto.response.ImportPreviewResponse.DuplicateDetail;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.CustomerDebtRepository;
import com.sales.repository.CustomerRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.CustomerImportService;
import com.sales.utils.ExcelParserUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerImportServiceImpl implements CustomerImportService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(0|\\+84)[3|5|7|8|9][0-9]{8}$");
    private static final Pattern TAX_CODE_PATTERN = Pattern.compile("^[0-9]{10}(-[0-9]{3})?$");

    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;

    @Override
    public byte[] getImportTemplate() throws Exception {
        return ExcelParserUtils.generateCustomerImportTemplate();
    }

    private User validateAndGetUser(String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : null;
        if (!"VT-01".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (currentUser.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        return currentUser;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_IMPORT_FILE);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && StringUtils.hasText(ExcelParserUtils.getCellValueAsString(cell))) {
                return false;
            }
        }
        return true;
    }

    private String cleanPhone(String phone) {
        if (!StringUtils.hasText(phone)) return "";
        String cleaned = phone.replaceAll("[^0-9+]", "");
        if (cleaned.startsWith("+84")) {
            cleaned = "0" + cleaned.substring(3);
        }
        return cleaned;
    }

    @Override
    @Transactional(readOnly = true)
    public ImportPreviewResponse previewImport(String currentUsername, MultipartFile file) {
        validateFile(file);
        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        Map<String, Customer> existingByPhone = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId())
                .stream()
                .filter(c -> StringUtils.hasText(c.getPhoneNumber()))
                .collect(Collectors.toMap(Customer::getPhoneNumber, c -> c, (c1, c2) -> c1));

        List<DuplicateDetail> duplicates = new ArrayList<>();
        List<ImportPreviewResponse.RowErrorDetail> errors = new ArrayList<>();
        Set<String> processedPhonesInFile = new HashSet<>();

        int totalRows = 0;
        int validCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            for (int rowIndex = 1; rowIndex <= lastRowNum; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (isRowEmpty(row)) continue;

                totalRows++;
                int actualRow = rowIndex + 1;

                String name = ExcelParserUtils.getCellValueAsString(row.getCell(0));
                String rawPhone = ExcelParserUtils.getCellValueAsString(row.getCell(1));
                String taxCode = ExcelParserUtils.getCellValueAsString(row.getCell(2));
                BigDecimal creditLimit = null;
                BigDecimal initialDebt = null;
                try {
                    creditLimit = ExcelParserUtils.getCellValueAsBigDecimal(row.getCell(5));
                    initialDebt = ExcelParserUtils.getCellValueAsBigDecimal(row.getCell(6));
                } catch (NumberFormatException e) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, cleanPhone(rawPhone), name, "Dữ liệu hạn mức nợ hoặc nợ đầu kỳ không đúng định dạng số"));
                    continue;
                }

                String phone = cleanPhone(rawPhone);

                // Validations
                if (!StringUtils.hasText(name)) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, phone, name, "Tên khách hàng không được để trống"));
                    continue;
                }

                if (!StringUtils.hasText(phone) || !PHONE_PATTERN.matcher(phone).matches()) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, phone, name, "Số điện thoại không đúng định dạng Việt Nam"));
                    continue;
                }

                if (StringUtils.hasText(taxCode) && !TAX_CODE_PATTERN.matcher(taxCode.trim()).matches()) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, phone, name, "Mã số thuế không hợp lệ (10 hoặc 13 số)"));
                    continue;
                }

                if (creditLimit != null && creditLimit.compareTo(BigDecimal.ZERO) < 0) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, phone, name, "Hạn mức nợ không được âm"));
                    continue;
                }

                if (initialDebt != null && initialDebt.compareTo(BigDecimal.ZERO) < 0) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, phone, name, "Số dư nợ đầu kỳ không được âm"));
                    continue;
                }

                if (processedPhonesInFile.contains(phone)) {
                    errors.add(new ImportPreviewResponse.RowErrorDetail(actualRow, phone, name, "Trùng lặp số điện thoại với dòng khác trong tệp"));
                    continue;
                }
                processedPhonesInFile.add(phone);

                if (existingByPhone.containsKey(phone)) {
                    Customer existing = existingByPhone.get(phone);
                    duplicates.add(new DuplicateDetail(actualRow, phone, name, existing.getName(), "Khách hàng đã tồn tại trên hệ thống"));
                } else {
                    validCount++;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi đọc file xem trước danh mục khách hàng", e);
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        return ImportPreviewResponse.builder()
                .totalRows(totalRows)
                .validCount(validCount)
                .duplicateCount(duplicates.size())
                .errorCount(errors.size())
                .duplicates(duplicates)
                .errors(errors)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ImportCustomerResultResponse importCustomers(String currentUsername, MultipartFile file, String duplicateAction) {
        validateFile(file);
        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        boolean updateDuplicates = "UPDATE".equalsIgnoreCase(duplicateAction);

        Map<String, Customer> existingByPhone = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId())
                .stream()
                .filter(c -> StringUtils.hasText(c.getPhoneNumber()))
                .collect(Collectors.toMap(Customer::getPhoneNumber, c -> c, (c1, c2) -> c1));

        List<RowErrorDetail> errors = new ArrayList<>();
        List<List<String>> errorExportRows = new ArrayList<>();
        Set<String> processedPhonesInFile = new HashSet<>();
        List<Customer> customersToUpdate = new ArrayList<>();
        List<Customer> customersToCreate = new ArrayList<>();
        List<BigDecimal> initialDebtsForCreated = new ArrayList<>();

        int totalRows = 0;
        int successCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            for (int rowIndex = 1; rowIndex <= lastRowNum; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (isRowEmpty(row)) continue;

                totalRows++;
                int actualRow = rowIndex + 1;

                String name = ExcelParserUtils.getCellValueAsString(row.getCell(0));
                String rawPhone = ExcelParserUtils.getCellValueAsString(row.getCell(1));
                String taxCode = ExcelParserUtils.getCellValueAsString(row.getCell(2));
                String email = ExcelParserUtils.getCellValueAsString(row.getCell(3));
                String address = ExcelParserUtils.getCellValueAsString(row.getCell(4));
                BigDecimal creditLimit = null;
                BigDecimal initialDebt = null;
                try {
                    creditLimit = ExcelParserUtils.getCellValueAsBigDecimal(row.getCell(5));
                    initialDebt = ExcelParserUtils.getCellValueAsBigDecimal(row.getCell(6));
                } catch (NumberFormatException e) {
                    addError(errors, errorExportRows, actualRow, name, cleanPhone(rawPhone), "Dữ liệu hạn mức nợ hoặc nợ đầu kỳ không đúng định dạng số");
                    continue;
                }
                String deliveryChannel = ExcelParserUtils.getCellValueAsString(row.getCell(7));

                String phone = cleanPhone(rawPhone);

                // Validations
                if (!StringUtils.hasText(name)) {
                    addError(errors, errorExportRows, actualRow, name, phone, "Tên khách hàng không được để trống");
                    continue;
                }

                if (!StringUtils.hasText(phone) || !PHONE_PATTERN.matcher(phone).matches()) {
                    addError(errors, errorExportRows, actualRow, name, phone, "Số điện thoại không đúng định dạng Việt Nam");
                    continue;
                }

                if (StringUtils.hasText(taxCode) && !TAX_CODE_PATTERN.matcher(taxCode.trim()).matches()) {
                    addError(errors, errorExportRows, actualRow, name, phone, "Mã số thuế không hợp lệ (10 hoặc 13 số)");
                    continue;
                }

                if (creditLimit != null && creditLimit.compareTo(BigDecimal.ZERO) < 0) {
                    addError(errors, errorExportRows, actualRow, name, phone, "Hạn mức nợ không được âm");
                    continue;
                }

                if (initialDebt != null && initialDebt.compareTo(BigDecimal.ZERO) < 0) {
                    addError(errors, errorExportRows, actualRow, name, phone, "Số dư nợ đầu kỳ không được âm");
                    continue;
                }

                if (processedPhonesInFile.contains(phone)) {
                    addError(errors, errorExportRows, actualRow, name, phone, "Trùng lặp số điện thoại với dòng khác trong tệp");
                    continue;
                }
                processedPhonesInFile.add(phone);

                BigDecimal validCreditLimit = creditLimit != null ? creditLimit : BigDecimal.ZERO;
                BigDecimal validInitialDebt = initialDebt != null ? initialDebt : BigDecimal.ZERO;
                String validChannel = StringUtils.hasText(deliveryChannel) ? deliveryChannel.trim().toUpperCase() : "QR";

                if (existingByPhone.containsKey(phone)) {
                    if (updateDuplicates) {
                        Customer existing = existingByPhone.get(phone);
                        existing.setName(name.trim());
                        if (StringUtils.hasText(taxCode)) existing.setTaxCode(taxCode.trim());
                        if (StringUtils.hasText(email)) existing.setEmail(email.trim());
                        if (StringUtils.hasText(address)) existing.setAddress(address.trim());
                        if (creditLimit != null) existing.setCreditLimit(validCreditLimit);
                        customersToUpdate.add(existing);
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                    continue;
                }

                // Chuẩn bị tạo mới Customer
                Customer newCustomer = Customer.builder()
                        .household(household)
                        .name(name.trim())
                        .phoneNumber(phone)
                        .taxCode(StringUtils.hasText(taxCode) ? taxCode.trim() : null)
                        .email(StringUtils.hasText(email) ? email.trim() : null)
                        .address(StringUtils.hasText(address) ? address.trim() : null)
                        .creditLimit(validCreditLimit)
                        .currentDebt(validInitialDebt)
                        .defaultDeliveryChannel(validChannel)
                        .build();

                customersToCreate.add(newCustomer);
                initialDebtsForCreated.add(validInitialDebt);
                existingByPhone.put(phone, newCustomer);
                successCount++;
            }

            // Tối ưu N+1: Lưu batch hàng loạt thay vì lưu từng dòng
            if (!customersToUpdate.isEmpty()) {
                customerRepository.saveAll(customersToUpdate);
            }

            if (!customersToCreate.isEmpty()) {
                List<Customer> savedCustomers = customerRepository.saveAll(customersToCreate);
                List<CustomerDebt> debtsToSave = new ArrayList<>();
                for (int i = 0; i < savedCustomers.size(); i++) {
                    Customer savedCustomer = savedCustomers.get(i);
                    BigDecimal validInitialDebt = initialDebtsForCreated.get(i);
                    if (validInitialDebt.compareTo(BigDecimal.ZERO) > 0) {
                        CustomerDebt openingDebt = CustomerDebt.builder()
                                .household(household)
                                .customer(savedCustomer)
                                .amount(validInitialDebt)
                                .remainingAmount(validInitialDebt)
                                .type(DebtType.DEBT_CREATED)
                                .status(DebtStatus.PENDING)
                                .dueDate(LocalDateTime.now().plusDays(30))
                                .notes("[IMPORT_EXCEL] Số dư công nợ đầu kỳ nhập từ tệp Excel")
                                .createdByUser(currentUser)
                                .build();
                        debtsToSave.add(openingDebt);
                    }
                }
                if (!debtsToSave.isEmpty()) {
                    customerDebtRepository.saveAll(debtsToSave);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi xử lý import khách hàng", e);
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        String errorFileBase64 = null;
        if (!errorExportRows.isEmpty()) {
            try {
                String[] errHeaders = {"Dòng", "Tên KH", "Số điện thoại", "Lý do lỗi"};
                byte[] errorWorkbookBytes = ExcelParserUtils.generateImportErrorWorkbook(errHeaders, errorExportRows);
                errorFileBase64 = Base64.getEncoder().encodeToString(errorWorkbookBytes);
            } catch (Exception e) {
                log.warn("Không thể tạo file báo lỗi Excel", e);
            }
        }

        try {
            activityLogHelper.logActivityInNewTransaction(
                    household, currentUser, "IMPORT_CUSTOMERS", "customers",
                    null, null, "Import " + successCount + " khách hàng thành công, cập nhật: " + updatedCount + ", bỏ qua: " + skippedCount, null, null);
        } catch (Exception e) {
            log.warn("Không thể ghi activity log import khách hàng", e);
        }

        return ImportCustomerResultResponse.builder()
                .totalRows(totalRows)
                .successCount(successCount)
                .updatedCount(updatedCount)
                .skippedCount(skippedCount)
                .errorCount(errors.size())
                .errors(errors)
                .errorFileBase64(errorFileBase64)
                .build();
    }

    private void addError(List<RowErrorDetail> errors, List<List<String>> exportRows, int rowNum, String name, String phone, String reason) {
        errors.add(new RowErrorDetail(rowNum, name, phone, reason));
        List<String> r = new ArrayList<>();
        r.add(String.valueOf(rowNum));
        r.add(name != null ? name : "");
        r.add(phone != null ? phone : "");
        r.add(reason);
        exportRows.add(r);
    }
}
