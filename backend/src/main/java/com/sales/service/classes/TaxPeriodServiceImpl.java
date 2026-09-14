package com.sales.service.classes;

import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.request.UnlockTaxPeriodRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxPeriodResponse;
import com.sales.dto.response.TaxSalesRegisterResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.EInvoice;
import com.sales.entity.TaxDeclarationPeriod;
import com.sales.entity.TaxSalesRegister;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.TaxDeclarationPeriodRepository;
import com.sales.repository.TaxSalesRegisterRepository;
import com.sales.repository.UserRepository;
import com.sales.dto.response.TaxRateRevenueSummaryItem;
import com.sales.dto.response.TaxRevenueSummaryResponse;
import com.sales.entity.TaxRate;
import com.sales.repository.TaxRateRepository;
import com.sales.service.interfaces.TaxPeriodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sales.dto.request.GenerateTaxPurchaseRegisterRequest;
import com.sales.dto.response.SupplierPurchaseGroupResponse;
import com.sales.dto.response.TaxPurchaseRegisterItemResponse;
import com.sales.dto.response.TaxPurchaseRegisterSummaryResponse;
import com.sales.entity.GoodsReceipt;
import com.sales.entity.GoodsReceiptDetail;
import com.sales.entity.Product;
import com.sales.entity.Supplier;
import com.sales.entity.TaxPurchaseRegister;
import com.sales.repository.GoodsReceiptDetailRepository;
import com.sales.repository.TaxPurchaseRegisterRepository;
import com.sales.service.interfaces.TaxReminderService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxPeriodServiceImpl implements TaxPeriodService {

    private final TaxDeclarationPeriodRepository taxPeriodRepository;
    private final TaxSalesRegisterRepository salesRegisterRepository;
    private final TaxPurchaseRegisterRepository purchaseRegisterRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final EInvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final TaxRateRepository taxRateRepository;
    private final ActivityLogHelper activityLogHelper;
    private final TaxReminderService taxReminderService;

    private static final java.util.regex.Pattern SUPPLIER_INVOICE_PATTERN =
            java.util.regex.Pattern.compile("(?i)(?:HĐ|HD|Hóa đơn|Hoa don)\\s*[:#-]?\\s*([A-Za-z0-9/_-]+)");

    private void validateTaxPeriodAccessRole(User user) {
        String roleCode = user.getRole() != null ? user.getRole().getCode() : null;
        if (!"VT-01".equalsIgnoreCase(roleCode) && !"VT-03".equalsIgnoreCase(roleCode) && !"VT-04".equalsIgnoreCase(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxPeriodResponse generateSalesRegister(String currentUsername, GenerateTaxRegisterRequest request) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // Verify role: sales staff cannot access tax period generation (TC-04)
        if (currentUser.getRole() != null && "VT-02".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String periodType = request.getPeriodType().trim().toUpperCase();
        Integer year = request.getYear();
        Integer periodNumber = request.getPeriodNumber();

        LocalDate startDate;
        LocalDate endDate;
        String periodName;

        if ("MONTHLY".equals(periodType)) {
            if (periodNumber < 1 || periodNumber > 12) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            YearMonth ym = YearMonth.of(year, periodNumber);
            startDate = ym.atDay(1);
            endDate = ym.atEndOfMonth();
            periodName = String.format("Bảng kê hóa đơn bán ra Tháng %02d/%d", periodNumber, year);
        } else if ("QUARTERLY".equals(periodType)) {
            if (periodNumber < 1 || periodNumber > 4) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            int startMonth = (periodNumber - 1) * 3 + 1;
            startDate = LocalDate.of(year, startMonth, 1);
            YearMonth endYm = YearMonth.of(year, startMonth + 2);
            endDate = endYm.atEndOfMonth();
            periodName = String.format("Bảng kê hóa đơn bán ra Quý %d năm %d", periodNumber, year);
        } else {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // Fetch valid e-invoices for household in period directly from DB (Optimized query)
        List<EInvoice> validInvoices = invoiceRepository.findValidInvoicesForTaxPeriod(
                household.getId(), startDateTime, endDateTime
        );

        // TC-03 & QTN-22: If period has no valid invoices, throw exception and do NOT create empty register
        if (validInvoices.isEmpty()) {
            throw new AppException(ErrorCode.NO_VALID_INVOICES_IN_PERIOD);
        }

        // Check existing period record
        TaxDeclarationPeriod period = taxPeriodRepository
                .findByHouseholdIdAndPeriodTypeAndYearAndPeriodNumber(household.getId(), periodType, year, periodNumber)
                .orElse(null);

        if (period != null) {
            if ("LOCKED".equalsIgnoreCase(period.getStatus())) {
                throw new AppException(ErrorCode.TAX_PERIOD_ALREADY_LOCKED);
            }
            // Clear existing register details before re-generating
            salesRegisterRepository.deleteByPeriodId(period.getId());
        } else {
            period = TaxDeclarationPeriod.builder()
                    .household(household)
                    .periodName(periodName)
                    .periodType(periodType)
                    .year(year)
                    .periodNumber(periodNumber)
                    .startDate(startDate)
                    .endDate(endDate)
                    .createdByUser(currentUser)
                    .status("GENERATED")
                    .build();
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        List<TaxSalesRegister> registerItems = new ArrayList<>();

        for (EInvoice inv : validInvoices) {
            String invoiceType = "ORIGINAL";
            if (inv.getReturnTicket() != null || (inv.getTitle() != null && inv.getTitle().toLowerCase().contains("điều chỉnh giảm"))) {
                invoiceType = "ADJUSTMENT_DECREASE";
            } else if (inv.getOriginalInvoice() != null || (inv.getTitle() != null && inv.getTitle().toLowerCase().contains("điều chỉnh tăng"))) {
                invoiceType = "ADJUSTMENT_INCREASE";
            }

            BigDecimal beforeTax = inv.getTotalAmountBeforeTax() != null ? inv.getTotalAmountBeforeTax() : BigDecimal.ZERO;
            BigDecimal taxAmt = inv.getTaxAmount() != null ? inv.getTaxAmount() : BigDecimal.ZERO;

            BigDecimal revenue;
            BigDecimal tax;

            if ("ADJUSTMENT_DECREASE".equals(invoiceType)) {
                revenue = beforeTax.negate();
                tax = taxAmt.negate();
            } else {
                revenue = beforeTax;
                tax = taxAmt;
            }

            totalRevenue = totalRevenue.add(revenue);
            totalTaxAmount = totalTaxAmount.add(tax);

            BigDecimal taxRatePercentage = BigDecimal.ZERO;
            if (beforeTax.compareTo(BigDecimal.ZERO) != 0) {
                taxRatePercentage = taxAmt.divide(beforeTax, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
            }

            TaxSalesRegister item = TaxSalesRegister.builder()
                    .period(period)
                    .invoice(inv)
                    .invoicePattern(inv.getInvoicePattern() != null ? inv.getInvoicePattern() : "1")
                    .invoiceSymbol(inv.getInvoiceSymbol() != null ? inv.getInvoiceSymbol() : "1C26TAA")
                    .invoiceNumber(inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : "N/A")
                    .issueDate(inv.getTaxResponseAt() != null ? inv.getTaxResponseAt() : inv.getCreatedAt())
                    .buyerName(inv.getBuyerName())
                    .buyerTaxCode(inv.getBuyerTaxCode())
                    .taxRatePercentage(taxRatePercentage)
                    .revenueAmount(revenue)
                    .taxAmount(tax)
                    .invoiceType(invoiceType)
                    .notes(inv.getCancelReason())
                    .build();

            registerItems.add(item);
        }

        period.setTotalValidInvoices(validInvoices.size());
        period.setTotalRevenue(totalRevenue);
        period.setTotalTaxAmount(totalTaxAmount);
        period.setStatus("GENERATED");

        period = taxPeriodRepository.save(period);

        for (TaxSalesRegister item : registerItems) {
            item.setPeriod(period);
        }
        salesRegisterRepository.saveAll(registerItems);

        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "GENERATE_TAX_SALES_REGISTER", "tax_declaration_periods",
                period.getId(), null, "Lập bảng kê thuế: " + periodName, null, null
        );

        return mapToPeriodResponse(period);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TaxSalesRegisterResponse> getSalesRegisterItems(String currentUsername, String periodId, int page, int size) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, currentUser.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by("issueDate").ascending());
        Page<TaxSalesRegister> itemsPage = salesRegisterRepository.findByPeriodId(period.getId(), pageable);

        List<TaxSalesRegisterResponse> content = itemsPage.getContent().stream()
                .map(this::mapToRegisterResponse)
                .collect(Collectors.toList());

        return PageResponse.<TaxSalesRegisterResponse>builder()
                .pageNumber(page)
                .pageSize(size)
                .totalElements(itemsPage.getTotalElements())
                .totalPages(itemsPage.getTotalPages())
                .last(itemsPage.isLast())
                .content(content)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TaxPeriodResponse getTaxPeriodDetail(String currentUsername, String periodId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, currentUser.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        return mapToPeriodResponse(period);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxPeriodResponse> getAllTaxPeriods(String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<TaxDeclarationPeriod> periods = taxPeriodRepository.findByHouseholdIdOrderByYearDescPeriodNumberDesc(currentUser.getHousehold().getId());
        return periods.stream().map(this::mapToPeriodResponse).collect(Collectors.toList());
    }

    private TaxPeriodResponse mapToPeriodResponse(TaxDeclarationPeriod period) {
        return TaxPeriodResponse.builder()
                .id(period.getId())
                .householdId(period.getHousehold().getId())
                .periodName(period.getPeriodName())
                .periodType(period.getPeriodType())
                .year(period.getYear())
                .periodNumber(period.getPeriodNumber())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .status(period.getStatus())
                .totalValidInvoices(period.getTotalValidInvoices())
                .totalRevenue(period.getTotalRevenue())
                .totalTaxAmount(period.getTotalTaxAmount())
                .createdByName(period.getCreatedByUser() != null ? period.getCreatedByUser().getFullName() : null)
                .lockedAt(period.getLockedAt())
                .lockedByName(period.getLockedByUser() != null ? period.getLockedByUser().getFullName() : null)
                .createdAt(period.getCreatedAt())
                .build();
    }

    private TaxSalesRegisterResponse mapToRegisterResponse(TaxSalesRegister item) {
        return TaxSalesRegisterResponse.builder()
                .id(item.getId())
                .periodId(item.getPeriod().getId())
                .invoiceId(item.getInvoice().getId())
                .invoicePattern(item.getInvoicePattern())
                .invoiceSymbol(item.getInvoiceSymbol())
                .invoiceNumber(item.getInvoiceNumber())
                .issueDate(item.getIssueDate())
                .buyerName(item.getBuyerName())
                .buyerTaxCode(item.getBuyerTaxCode())
                .taxRatePercentage(item.getTaxRatePercentage())
                .revenueAmount(item.getRevenueAmount())
                .taxAmount(item.getTaxAmount())
                .invoiceType(item.getInvoiceType())
                .notes(item.getNotes())
                .createdAt(item.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TaxRevenueSummaryResponse getTaxRevenueSummary(String currentUsername, String periodId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // TC-03: Sales staff (VT-02) cannot access tax revenue summary
        if (currentUser.getRole() != null && "VT-02".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        List<TaxSalesRegister> registerItems = salesRegisterRepository.findByPeriodId(period.getId());

        // Check if household tax rates contain any rate assigned to items in this period that is INACTIVE (TC-02)
        List<TaxRate> allHouseholdTaxRates = taxRateRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId());

        Set<BigDecimal> usedPercentages = registerItems.stream()
                .map(TaxSalesRegister::getTaxRatePercentage)
                .collect(Collectors.toSet());

        boolean hasInactiveRateInPeriod = allHouseholdTaxRates.stream()
                .anyMatch(tr -> Boolean.FALSE.equals(tr.getIsActive()) && usedPercentages.stream().anyMatch(p -> p.compareTo(tr.getRatePercentage()) == 0));

        if (hasInactiveRateInPeriod) {
            throw new AppException(ErrorCode.PRODUCT_TAX_RATE_INACTIVE);
        }

        Map<BigDecimal, List<TaxSalesRegister>> groupedByRate = registerItems.stream()
                .collect(Collectors.groupingBy(item -> item.getTaxRatePercentage() != null ?
                        item.getTaxRatePercentage().setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2)));

        List<TaxRateRevenueSummaryItem> summaryItems = new ArrayList<>();
        BigDecimal grandTotalRevenue = BigDecimal.ZERO;
        BigDecimal grandTotalTax = BigDecimal.ZERO;

        for (Map.Entry<BigDecimal, List<TaxSalesRegister>> entry : groupedByRate.entrySet()) {
            BigDecimal ratePct = entry.getKey();
            List<TaxSalesRegister> items = entry.getValue();

            BigDecimal groupRevenue = items.stream()
                    .map(TaxSalesRegister::getRevenueAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal groupTax = items.stream()
                    .map(TaxSalesRegister::getTaxAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long invoiceCount = items.stream()
                    .map(item -> item.getInvoice().getId())
                    .distinct()
                    .count();

            String rateName = allHouseholdTaxRates.stream()
                    .filter(tr -> tr.getRatePercentage().compareTo(ratePct) == 0)
                    .map(TaxRate::getName)
                    .findFirst()
                    .orElse(String.format("Thuế suất %.1f%%", ratePct));

            summaryItems.add(TaxRateRevenueSummaryItem.builder()
                    .taxRatePercentage(ratePct)
                    .taxRateName(rateName)
                    .revenueAmount(groupRevenue)
                    .taxAmount(groupTax)
                    .invoiceCount((int) invoiceCount)
                    .build());

            grandTotalRevenue = grandTotalRevenue.add(groupRevenue);
            grandTotalTax = grandTotalTax.add(groupTax);
        }

        summaryItems.sort((a, b) -> a.getTaxRatePercentage().compareTo(b.getTaxRatePercentage()));

        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "SUMMARIZE_TAX_REVENUE", "tax_declaration_periods",
                period.getId(), null, "Tổng hợp doanh thu chịu thuế: " + period.getPeriodName(), null, null
        );

        return TaxRevenueSummaryResponse.builder()
                .periodId(period.getId())
                .periodName(period.getPeriodName())
                .periodType(period.getPeriodType())
                .year(period.getYear())
                .periodNumber(period.getPeriodNumber())
                .totalRevenue(grandTotalRevenue)
                .totalTaxAmount(grandTotalTax)
                .taxRateSummaries(summaryItems)
                .build();
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> exportTaxDeclaration(String currentUsername, String periodId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // TC-03: Role check - Sales staff (VT-02) cannot export tax declaration
        if (currentUser.getRole() != null && "VT-02".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // TC-02: Validate household tax code and representative name with specific error messages
        if (household.getTaxCode() == null || household.getTaxCode().trim().isEmpty()) {
            throw new AppException(ErrorCode.HOUSEHOLD_TAX_CODE_MISSING);
        }
        if (household.getRepresentativeName() == null || household.getRepresentativeName().trim().isEmpty()) {
            throw new AppException(ErrorCode.HOUSEHOLD_REPRESENTATIVE_MISSING);
        }

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        List<TaxSalesRegister> registerItems = salesRegisterRepository.findByPeriodId(period.getId());
        if (registerItems.isEmpty()) {
            throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
        }

        List<TaxRate> allHouseholdTaxRates = taxRateRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId());

        byte[] excelContent = generateTaxDeclarationWorkbook(household, period, registerItems, allHouseholdTaxRates);

        // TC-04: Log audit activity
        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "EXPORT_TAX_DECLARATION", "tax_declaration_periods",
                period.getId(), null,
                String.format("Xuất tờ khai thuế và bảng kê kỳ: %s - Tổng thuế: %s VNĐ", period.getPeriodName(), period.getTotalTaxAmount()),
                null, null
        );

        // NCL-12-CN-007: Cập nhật cờ đã xuất tờ khai thuế cho kỳ và đồng bộ metadata thông báo
        period.setDeclarationExported(true);
        period.setDeclarationExportedAt(LocalDateTime.now());
        taxPeriodRepository.save(period);
        try {
            taxReminderService.markDeclarationAsExported(period.getId());
        } catch (Exception e) {
            log.warn("Không thể đồng bộ trạng thái xuất tờ khai sang dịch vụ nhắc lịch: {}", e.getMessage());
        }

        String fileName = String.format("To_khai_thue_%s_%s_%d.xlsx",
                period.getPeriodType(), period.getYear(), period.getPeriodNumber());

        org.springframework.http.ContentDisposition contentDisposition = org.springframework.http.ContentDisposition
                .builder("attachment")
                .filename(fileName)
                .build();

        ByteArrayResource resource = new ByteArrayResource(excelContent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(excelContent.length)
                .body(resource);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxPeriodResponse lockTaxPeriod(String currentUsername, String periodId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // TC-03: Chỉ chủ hộ kinh doanh (VT-01) mới có quyền chốt kỳ kê khai thuế
        if (currentUser.getRole() == null || !"VT-01".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        // TC-02: Kiểm tra nếu kỳ đã bị khóa trước đó
        if ("LOCKED".equalsIgnoreCase(period.getStatus())) {
            throw new AppException(ErrorCode.TAX_PERIOD_ALREADY_LOCKED);
        }

        period.setStatus("LOCKED");
        period.setLockedAt(LocalDateTime.now());
        period.setLockedByUser(currentUser);

        period = taxPeriodRepository.save(period);

        // NCL-12-CN-007 (AC-02 & QTN-21): Tự động đóng các nhắc việc nộp tờ khai của kỳ này khi kỳ đã được chốt
        try {
            taxReminderService.closeRemindersForPeriod(household, period.getId());
        } catch (Exception e) {
            log.error("Lỗi khi tự động đóng thông báo nhắc kỳ nộp thuế: {}", e.getMessage());
        }

        // TC-04: Lưu nhật ký hoạt động (Audit log)
        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "LOCK_TAX_PERIOD", "tax_declaration_periods",
                period.getId(), null,
                "Chốt kỳ kê khai thuế: " + period.getPeriodName(),
                null, null
        );

        return mapToPeriodResponse(period);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxPeriodResponse unlockTaxPeriod(String currentUsername, String periodId, UnlockTaxPeriodRequest request) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // Chỉ chủ hộ kinh doanh (VT-01) mới có quyền mở lại kỳ kê khai thuế
        if (currentUser.getRole() == null || !"VT-01".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        // Kiểm tra nếu kỳ chưa bị khóa
        if (!"LOCKED".equalsIgnoreCase(period.getStatus())) {
            throw new AppException(ErrorCode.TAX_PERIOD_NOT_LOCKED);
        }

        if (request == null || request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.TAX_PERIOD_UNLOCK_REASON_REQUIRED);
        }

        period.setStatus("GENERATED");
        period.setLockedAt(null);
        period.setLockedByUser(null);

        period = taxPeriodRepository.save(period);

        // TC-04: Lưu nhật ký hoạt động (Audit log) kèm lý do mở lại
        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "UNLOCK_TAX_PERIOD", "tax_declaration_periods",
                period.getId(), null,
                "Mở lại kỳ kê khai thuế: " + period.getPeriodName() + " - Lý do: " + request.getReason().trim(),
                null, null
        );

        return mapToPeriodResponse(period);
    }

    private byte[] generateTaxDeclarationWorkbook(
            BusinessHousehold household,
            TaxDeclarationPeriod period,
            List<TaxSalesRegister> registerItems,
            List<TaxRate> allHouseholdTaxRates) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            DataFormat dataFormat = workbook.createDataFormat();

            // Fonts
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);

            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);

            Font subTitleFont = workbook.createFont();
            subTitleFont.setItalic(true);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            // Cell Styles
            CellStyle nationalHeaderStyle = workbook.createCellStyle();
            nationalHeaderStyle.setFont(boldFont);
            nationalHeaderStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle subTitleStyle = workbook.createCellStyle();
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle tableHeaderStyle = workbook.createCellStyle();
            tableHeaderStyle.setFont(headerFont);
            tableHeaderStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            tableHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tableHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            tableHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            tableHeaderStyle.setBorderTop(BorderStyle.THIN);
            tableHeaderStyle.setBorderBottom(BorderStyle.THIN);
            tableHeaderStyle.setBorderLeft(BorderStyle.THIN);
            tableHeaderStyle.setBorderRight(BorderStyle.THIN);
            tableHeaderStyle.setWrapText(true);

            CellStyle borderLeft = workbook.createCellStyle();
            borderLeft.setBorderTop(BorderStyle.THIN);
            borderLeft.setBorderBottom(BorderStyle.THIN);
            borderLeft.setBorderLeft(BorderStyle.THIN);
            borderLeft.setBorderRight(BorderStyle.THIN);
            borderLeft.setAlignment(HorizontalAlignment.LEFT);

            CellStyle borderCenter = workbook.createCellStyle();
            borderCenter.setBorderTop(BorderStyle.THIN);
            borderCenter.setBorderBottom(BorderStyle.THIN);
            borderCenter.setBorderLeft(BorderStyle.THIN);
            borderCenter.setBorderRight(BorderStyle.THIN);
            borderCenter.setAlignment(HorizontalAlignment.CENTER);

            CellStyle borderNumber = workbook.createCellStyle();
            borderNumber.setBorderTop(BorderStyle.THIN);
            borderNumber.setBorderBottom(BorderStyle.THIN);
            borderNumber.setBorderLeft(BorderStyle.THIN);
            borderNumber.setBorderRight(BorderStyle.THIN);
            borderNumber.setAlignment(HorizontalAlignment.RIGHT);
            borderNumber.setDataFormat(dataFormat.getFormat("#,##0"));

            CellStyle borderPercent = workbook.createCellStyle();
            borderPercent.setBorderTop(BorderStyle.THIN);
            borderPercent.setBorderBottom(BorderStyle.THIN);
            borderPercent.setBorderLeft(BorderStyle.THIN);
            borderPercent.setBorderRight(BorderStyle.THIN);
            borderPercent.setAlignment(HorizontalAlignment.RIGHT);
            borderPercent.setDataFormat(dataFormat.getFormat("0.00%"));

            CellStyle borderTotalLabel = workbook.createCellStyle();
            borderTotalLabel.setFont(boldFont);
            borderTotalLabel.setBorderTop(BorderStyle.DOUBLE);
            borderTotalLabel.setBorderBottom(BorderStyle.THIN);
            borderTotalLabel.setBorderLeft(BorderStyle.THIN);
            borderTotalLabel.setBorderRight(BorderStyle.THIN);
            borderTotalLabel.setAlignment(HorizontalAlignment.CENTER);

            CellStyle borderTotalNumber = workbook.createCellStyle();
            borderTotalNumber.setFont(boldFont);
            borderTotalNumber.setBorderTop(BorderStyle.DOUBLE);
            borderTotalNumber.setBorderBottom(BorderStyle.THIN);
            borderTotalNumber.setBorderLeft(BorderStyle.THIN);
            borderTotalNumber.setBorderRight(BorderStyle.THIN);
            borderTotalNumber.setAlignment(HorizontalAlignment.RIGHT);
            borderTotalNumber.setDataFormat(dataFormat.getFormat("#,##0"));

            // ----------------------------------------------------
            // Sheet 1: To_Khai_Thue_01_CNKD
            // ----------------------------------------------------
            Sheet sheet1 = workbook.createSheet("To_Khai_Thue_01_CNKD");
            sheet1.setDisplayGridlines(true);

            int r1 = 0;
            Row rowNat1 = sheet1.createRow(r1++);
            Cell cNat1 = rowNat1.createCell(0);
            cNat1.setCellValue("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM");
            cNat1.setCellStyle(nationalHeaderStyle);
            sheet1.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

            Row rowNat2 = sheet1.createRow(r1++);
            Cell cNat2 = rowNat2.createCell(0);
            cNat2.setCellValue("Độc lập - Tự do - Hạnh phúc");
            cNat2.setCellStyle(nationalHeaderStyle);
            sheet1.addMergedRegion(new CellRangeAddress(1, 1, 0, 4));

            Row rowSep = sheet1.createRow(r1++);
            Cell cSep = rowSep.createCell(0);
            cSep.setCellValue("----------o0o----------");
            cSep.setCellStyle(subTitleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(2, 2, 0, 4));

            r1++; // blank line

            Row rowT1 = sheet1.createRow(r1++);
            Cell cT1 = rowT1.createCell(0);
            cT1.setCellValue("TỜ KHAI THUẾ ĐỐI VỚI HỘ KINH DOANH, CÁ NHÂN KINH DOANH (MÔ PHỎNG)");
            cT1.setCellStyle(titleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(4, 4, 0, 4));

            Row rowSub1 = sheet1.createRow(r1++);
            Cell cSub1 = rowSub1.createCell(0);
            cSub1.setCellValue("(Áp dụng cho hộ kinh doanh, cá nhân kinh doanh nộp thuế theo phương pháp kê khai)");
            cSub1.setCellStyle(subTitleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(5, 5, 0, 4));

            Row rowSub2 = sheet1.createRow(r1++);
            Cell cSub2 = rowSub2.createCell(0);
            cSub2.setCellValue("Mẫu số: 01/CNKD (Ban hành kèm theo Thông tư số 40/2021/TT-BTC)");
            cSub2.setCellStyle(subTitleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(6, 6, 0, 4));

            r1++; // blank line

            // Info rows
            createLabelValueRow(sheet1, r1++, "[01] Kỳ tính thuế:", String.format("%s (Từ ngày %s đến ngày %s)",
                    period.getPeriodName(), period.getStartDate().format(DATE_FORMATTER), period.getEndDate().format(DATE_FORMATTER)), boldFont);
            createLabelValueRow(sheet1, r1++, "[02] Tên người nộp thuế / Hộ KD:", household.getName(), null);
            createLabelValueRow(sheet1, r1++, "[03] Mã số thuế:", household.getTaxCode(), boldFont);
            createLabelValueRow(sheet1, r1++, "[04] Người đại diện hợp pháp:", household.getRepresentativeName(), null);
            createLabelValueRow(sheet1, r1++, "[05] Địa chỉ kinh doanh:", household.getAddress() != null ? household.getAddress() : "", null);
            createLabelValueRow(sheet1, r1++, "[06] Số điện thoại liên hệ:", household.getPhoneNumber() != null ? household.getPhoneNumber() : "", null);

            r1++; // blank line

            Row rowTblTitle1 = sheet1.createRow(r1++);
            Cell cTblTitle1 = rowTblTitle1.createCell(0);
            cTblTitle1.setCellValue("BẢNG TỔNG HỢP NGHĨA VỤ THUẾ THEO TỪNG NHÓM THUẾ SUẤT");
            CellStyle tblTitleStyle = workbook.createCellStyle();
            tblTitleStyle.setFont(boldFont);
            cTblTitle1.setCellStyle(tblTitleStyle);

            // Table Header 1
            Row hRow1 = sheet1.createRow(r1++);
            hRow1.setHeightInPoints(26);
            String[] s1Headers = {"STT", "Chỉ tiêu / Nhóm ngành nghề tính thuế", "Doanh thu tính thuế (VNĐ)", "Thuế suất", "Tiền thuế phải nộp (VNĐ)"};
            for (int i = 0; i < s1Headers.length; i++) {
                Cell cell = hRow1.createCell(i);
                cell.setCellValue(s1Headers[i]);
                cell.setCellStyle(tableHeaderStyle);
            }

            // Summary grouped by tax rate
            Map<BigDecimal, List<TaxSalesRegister>> groupedByRate = registerItems.stream()
                    .collect(Collectors.groupingBy(item -> item.getTaxRatePercentage() != null ?
                            item.getTaxRatePercentage().setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2)));

            List<BigDecimal> sortedRates = new ArrayList<>(groupedByRate.keySet());
            sortedRates.sort(BigDecimal::compareTo);

            int stt1 = 1;
            BigDecimal s1TotalRev = BigDecimal.ZERO;
            BigDecimal s1TotalTax = BigDecimal.ZERO;

            for (BigDecimal ratePct : sortedRates) {
                List<TaxSalesRegister> items = groupedByRate.get(ratePct);
                BigDecimal groupRevenue = items.stream().map(TaxSalesRegister::getRevenueAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal groupTax = items.stream().map(TaxSalesRegister::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

                String rateName = allHouseholdTaxRates.stream()
                        .filter(tr -> tr.getRatePercentage().compareTo(ratePct) == 0)
                        .map(TaxRate::getName)
                        .findFirst()
                        .orElse(String.format("Hàng hóa / Dịch vụ chịu thuế %.1f%%", ratePct));

                Row dRow = sheet1.createRow(r1++);
                Cell c0 = dRow.createCell(0); c0.setCellValue(stt1++); c0.setCellStyle(borderCenter);
                Cell c1 = dRow.createCell(1); c1.setCellValue(rateName); c1.setCellStyle(borderLeft);
                Cell c2 = dRow.createCell(2); c2.setCellValue(groupRevenue.doubleValue()); c2.setCellStyle(borderNumber);
                double rateVal = ratePct != null ? ratePct.divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP).doubleValue() : 0.0;
                Cell c3 = dRow.createCell(3); c3.setCellValue(rateVal); c3.setCellStyle(borderPercent);
                Cell c4 = dRow.createCell(4); c4.setCellValue(groupTax.doubleValue()); c4.setCellStyle(borderNumber);

                s1TotalRev = s1TotalRev.add(groupRevenue);
                s1TotalTax = s1TotalTax.add(groupTax);
            }

            // Total row sheet 1
            Row totRow1 = sheet1.createRow(r1++);
            totRow1.setHeightInPoints(22);
            Cell t0 = totRow1.createCell(0); t0.setCellValue("TỔNG CỘNG"); t0.setCellStyle(borderTotalLabel);
            Cell t1 = totRow1.createCell(1); t1.setCellStyle(borderTotalLabel);
            sheet1.addMergedRegion(new CellRangeAddress(r1 - 1, r1 - 1, 0, 1));

            Cell t2 = totRow1.createCell(2); t2.setCellValue(s1TotalRev.doubleValue()); t2.setCellStyle(borderTotalNumber);
            Cell t3 = totRow1.createCell(3); t3.setCellValue("---"); t3.setCellStyle(borderCenter);
            Cell t4 = totRow1.createCell(4); t4.setCellValue(s1TotalTax.doubleValue()); t4.setCellStyle(borderTotalNumber);

            r1++; // blank line
            Row pledgeRow = sheet1.createRow(r1++);
            Cell pledgeCell = pledgeRow.createCell(0);
            pledgeCell.setCellValue("Tôi cam đoan số liệu khai trên là đúng sự thật và chịu trách nhiệm trước pháp luật về những số liệu đã khai.");
            pledgeCell.setCellStyle(subTitleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(r1 - 1, r1 - 1, 0, 4));

            r1++; // blank line
            LocalDate now = LocalDate.now();
            Row dateRow = sheet1.createRow(r1++);
            Cell dateCell = dateRow.createCell(3);
            dateCell.setCellValue(String.format("Ngày %02d tháng %02d năm %d", now.getDayOfMonth(), now.getMonthValue(), now.getYear()));
            dateCell.setCellStyle(subTitleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(r1 - 1, r1 - 1, 3, 4));

            Row signHeaderRow = sheet1.createRow(r1++);
            Cell signHeaderCell = signHeaderRow.createCell(3);
            signHeaderCell.setCellValue("NGƯỜI NỘP THUẾ (hoặc ĐẠI DIỆN HỢP PHÁP)");
            signHeaderCell.setCellStyle(nationalHeaderStyle);
            sheet1.addMergedRegion(new CellRangeAddress(r1 - 1, r1 - 1, 3, 4));

            Row signSubRow = sheet1.createRow(r1++);
            Cell signSubCell = signSubRow.createCell(3);
            signSubCell.setCellValue("(Ký, ghi rõ họ tên)");
            signSubCell.setCellStyle(subTitleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(r1 - 1, r1 - 1, 3, 4));

            r1 += 3; // spacing for signature
            Row nameRow = sheet1.createRow(r1++);
            Cell nameCell = nameRow.createCell(3);
            nameCell.setCellValue(household.getRepresentativeName());
            nameCell.setCellStyle(nationalHeaderStyle);
            sheet1.addMergedRegion(new CellRangeAddress(r1 - 1, r1 - 1, 3, 4));

            // Auto-size columns for sheet 1
            for (int i = 0; i < 5; i++) {
                sheet1.autoSizeColumn(i);
                int currentWidth = sheet1.getColumnWidth(i);
                sheet1.setColumnWidth(i, Math.max(currentWidth + 1000, 4000));
            }

            // ----------------------------------------------------
            // Sheet 2: Bang_Ke_Ban_Ra_01_2_BK
            // ----------------------------------------------------
            Sheet sheet2 = workbook.createSheet("Bang_Ke_Ban_Ra_01_2_BK");
            sheet2.setDisplayGridlines(true);

            int r2 = 0;
            Row rowS2T1 = sheet2.createRow(r2++);
            Cell cS2T1 = rowS2T1.createCell(0);
            cS2T1.setCellValue("BẢNG KÊ HOẠT ĐỘNG KINH DOANH TRONG KỲ CỦA HỘ KINH DOANH (MÔ PHỎNG)");
            cS2T1.setCellStyle(titleStyle);
            sheet2.addMergedRegion(new CellRangeAddress(0, 0, 0, 11));

            Row rowS2Sub = sheet2.createRow(r2++);
            Cell cS2Sub = rowS2Sub.createCell(0);
            cS2Sub.setCellValue("(Phụ lục 01-2/BK-HĐKD ban hành kèm theo Thông tư số 40/2021/TT-BTC)");
            cS2Sub.setCellStyle(subTitleStyle);
            sheet2.addMergedRegion(new CellRangeAddress(1, 1, 0, 11));

            Row rowS2Info = sheet2.createRow(r2++);
            Cell cS2Info = rowS2Info.createCell(0);
            cS2Info.setCellValue(String.format("Kỳ tính thuế: %s | Tên hộ KD: %s | MST: %s",
                    period.getPeriodName(), household.getName(), household.getTaxCode()));
            cS2Info.setCellStyle(nationalHeaderStyle);
            sheet2.addMergedRegion(new CellRangeAddress(2, 2, 0, 11));

            r2++; // blank line

            // Table Header 2
            Row hRow2 = sheet2.createRow(r2++);
            hRow2.setHeightInPoints(28);
            String[] s2Headers = {
                    "STT", "Mẫu số HĐ", "Ký hiệu HĐ", "Số hóa đơn", "Ngày cấp mã / lập",
                    "Tên người mua", "MST người mua", "Doanh thu chưa thuế (VNĐ)",
                    "Thuế suất", "Tiền thuế (VNĐ)", "Loại hóa đơn", "Ghi chú"
            };

            for (int i = 0; i < s2Headers.length; i++) {
                Cell cell = hRow2.createCell(i);
                cell.setCellValue(s2Headers[i]);
                cell.setCellStyle(tableHeaderStyle);
            }

            int stt2 = 1;
            BigDecimal s2TotalRev = BigDecimal.ZERO;
            BigDecimal s2TotalTax = BigDecimal.ZERO;

            for (TaxSalesRegister item : registerItems) {
                Row dRow = sheet2.createRow(r2++);

                Cell c0 = dRow.createCell(0); c0.setCellValue(stt2++); c0.setCellStyle(borderCenter);
                Cell c1 = dRow.createCell(1); c1.setCellValue(item.getInvoicePattern() != null ? item.getInvoicePattern() : "1"); c1.setCellStyle(borderCenter);
                Cell c2 = dRow.createCell(2); c2.setCellValue(item.getInvoiceSymbol() != null ? item.getInvoiceSymbol() : ""); c2.setCellStyle(borderCenter);
                Cell c3 = dRow.createCell(3); c3.setCellValue(item.getInvoiceNumber() != null ? item.getInvoiceNumber() : ""); c3.setCellStyle(borderCenter);
                Cell c4 = dRow.createCell(4); c4.setCellValue(item.getIssueDate() != null ? item.getIssueDate().format(DATETIME_FORMATTER) : ""); c4.setCellStyle(borderCenter);
                Cell c5 = dRow.createCell(5); c5.setCellValue(item.getBuyerName() != null ? item.getBuyerName() : "Khách lẻ"); c5.setCellStyle(borderLeft);
                Cell c6 = dRow.createCell(6); c6.setCellValue(item.getBuyerTaxCode() != null ? item.getBuyerTaxCode() : ""); c6.setCellStyle(borderCenter);
                Cell c7 = dRow.createCell(7); c7.setCellValue(item.getRevenueAmount() != null ? item.getRevenueAmount().doubleValue() : 0.0); c7.setCellStyle(borderNumber);
                Cell c8 = dRow.createCell(8);
                BigDecimal rate = item.getTaxRatePercentage() != null ? item.getTaxRatePercentage().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
                c8.setCellValue(rate.doubleValue()); c8.setCellStyle(borderPercent);
                Cell c9 = dRow.createCell(9); c9.setCellValue(item.getTaxAmount() != null ? item.getTaxAmount().doubleValue() : 0.0); c9.setCellStyle(borderNumber);

                String typeName = "Hóa đơn gốc";
                if ("ADJUSTMENT_DECREASE".equalsIgnoreCase(item.getInvoiceType())) {
                    typeName = "Điều chỉnh giảm";
                } else if ("ADJUSTMENT_INCREASE".equalsIgnoreCase(item.getInvoiceType())) {
                    typeName = "Điều chỉnh tăng";
                }
                Cell c10 = dRow.createCell(10); c10.setCellValue(typeName); c10.setCellStyle(borderCenter);
                Cell c11 = dRow.createCell(11); c11.setCellValue(item.getNotes() != null ? item.getNotes() : ""); c11.setCellStyle(borderLeft);

                if (item.getRevenueAmount() != null) s2TotalRev = s2TotalRev.add(item.getRevenueAmount());
                if (item.getTaxAmount() != null) s2TotalTax = s2TotalTax.add(item.getTaxAmount());
            }

            // Total row sheet 2
            Row totRow2 = sheet2.createRow(r2++);
            totRow2.setHeightInPoints(22);
            Cell t2_0 = totRow2.createCell(0); t2_0.setCellValue("TỔNG CỘNG"); t2_0.setCellStyle(borderTotalLabel);
            for (int i = 1; i <= 6; i++) {
                totRow2.createCell(i).setCellStyle(borderTotalLabel);
            }
            sheet2.addMergedRegion(new CellRangeAddress(r2 - 1, r2 - 1, 0, 6));

            Cell t2_7 = totRow2.createCell(7); t2_7.setCellValue(s2TotalRev.doubleValue()); t2_7.setCellStyle(borderTotalNumber);
            Cell t2_8 = totRow2.createCell(8); t2_8.setCellValue("---"); t2_8.setCellStyle(borderCenter);
            Cell t2_9 = totRow2.createCell(9); t2_9.setCellValue(s2TotalTax.doubleValue()); t2_9.setCellStyle(borderTotalNumber);
            Cell t2_10 = totRow2.createCell(10); t2_10.setCellStyle(borderCenter);
            Cell t2_11 = totRow2.createCell(11); t2_11.setCellStyle(borderCenter);

            // Auto-size columns for sheet 2
            for (int i = 0; i < s2Headers.length; i++) {
                sheet2.autoSizeColumn(i);
                int currentWidth = sheet2.getColumnWidth(i);
                sheet2.setColumnWidth(i, Math.max(currentWidth + 1000, 3500));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi khi sinh tệp Excel tờ khai thuế: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void createLabelValueRow(Sheet sheet, int rowIndex, String label, String value, Font labelFont) {
        Row row = sheet.createRow(rowIndex);
        Cell cLabel = row.createCell(0);
        cLabel.setCellValue(label);
        if (labelFont != null) {
            CellStyle s = sheet.getWorkbook().createCellStyle();
            s.setFont(labelFont);
            cLabel.setCellStyle(s);
        }
        Cell cValue = row.createCell(1);
        cValue.setCellValue(value != null ? value : "");
        sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 1, 4));
    }

    // =========================================================================
    // NCL-12-CN-006: Bảng kê hàng hóa mua vào theo kỳ
    // =========================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxPurchaseRegisterSummaryResponse generatePurchaseRegister(String currentUsername, GenerateTaxPurchaseRegisterRequest request) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        validateTaxPeriodAccessRole(currentUser);

        String periodType = request.getPeriodType().trim().toUpperCase();
        Integer year = request.getYear();
        Integer periodNumber = request.getPeriodNumber();

        LocalDate startDate;
        LocalDate endDate;
        String periodName;

        if ("MONTHLY".equals(periodType)) {
            if (periodNumber < 1 || periodNumber > 12) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            YearMonth ym = YearMonth.of(year, periodNumber);
            startDate = ym.atDay(1);
            endDate = ym.atEndOfMonth();
            periodName = String.format("Bảng kê thuế Tháng %02d/%d", periodNumber, year);
        } else if ("QUARTERLY".equals(periodType)) {
            if (periodNumber < 1 || periodNumber > 4) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            int startMonth = (periodNumber - 1) * 3 + 1;
            startDate = LocalDate.of(year, startMonth, 1);
            YearMonth endYm = YearMonth.of(year, startMonth + 2);
            endDate = endYm.atEndOfMonth();
            periodName = String.format("Bảng kê thuế Quý %d năm %d", periodNumber, year);
        } else {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // Lọc các dòng phiếu nhập kho trong kỳ
        List<GoodsReceiptDetail> receiptDetails = goodsReceiptDetailRepository.findReceiptDetailsForTaxPeriod(
                household.getId(), startDateTime, endDateTime
        );

        if (receiptDetails.isEmpty()) {
            throw new AppException(ErrorCode.NO_GOODS_RECEIPTS_IN_PERIOD);
        }

        // Kiểm tra kỳ kê khai trong DB
        TaxDeclarationPeriod period = taxPeriodRepository
                .findByHouseholdIdAndPeriodTypeAndYearAndPeriodNumber(household.getId(), periodType, year, periodNumber)
                .orElse(null);

        if (period != null) {
            if ("LOCKED".equalsIgnoreCase(period.getStatus())) {
                throw new AppException(ErrorCode.TAX_PERIOD_ALREADY_LOCKED);
            }
            purchaseRegisterRepository.deleteByPeriodId(period.getId());
        } else {
            period = TaxDeclarationPeriod.builder()
                    .household(household)
                    .periodName(periodName)
                    .periodType(periodType)
                    .year(year)
                    .periodNumber(periodNumber)
                    .startDate(startDate)
                    .endDate(endDate)
                    .createdByUser(currentUser)
                    .status("GENERATED")
                    .build();
            period = taxPeriodRepository.save(period);
        }

        // Xử lý chuẩn hóa và lưu trữ
        List<TaxPurchaseRegister> entitiesToSave = new ArrayList<>();
        List<TaxPurchaseRegisterItemResponse> allItemDtos = new ArrayList<>();
        Map<String, SupplierPurchaseGroupResponse> validSupplierMap = new LinkedHashMap<>();
        List<TaxPurchaseRegisterItemResponse> missingSupplierItems = new ArrayList<>();

        BigDecimal grandTotalQuantity = BigDecimal.ZERO;
        BigDecimal grandTotalAmount = BigDecimal.ZERO;
        BigDecimal eligibleTaxDeductionAmount = BigDecimal.ZERO;
        Set<String> totalReceiptIds = new HashSet<>();
        Set<String> missingSupplierReceiptIds = new HashSet<>();

        for (GoodsReceiptDetail grd : receiptDetails) {
            GoodsReceipt gr = grd.getReceipt();
            Product product = grd.getProduct();
            Supplier supplier = gr.getSupplier();

            totalReceiptIds.add(gr.getId());

            BigDecimal baseQty = grd.getBaseQuantity() != null ? grd.getBaseQuantity() : grd.getQuantity();
            BigDecimal basePrice = grd.getBasePurchasePrice() != null ? grd.getBasePurchasePrice() : grd.getPurchasePrice();
            if (baseQty == null) baseQty = BigDecimal.ZERO;
            if (basePrice == null) basePrice = BigDecimal.ZERO;

            BigDecimal lineTotal = baseQty.multiply(basePrice).setScale(2, RoundingMode.HALF_UP);

            grandTotalQuantity = grandTotalQuantity.add(baseQty);
            grandTotalAmount = grandTotalAmount.add(lineTotal);

            boolean isMissing = (supplier == null || supplier.getName() == null || supplier.getName().trim().isEmpty());
            String suppInvoiceNum = extractSupplierInvoiceNumber(gr.getNotes());

            TaxPurchaseRegisterItemResponse itemDto = TaxPurchaseRegisterItemResponse.builder()
                    .receiptId(gr.getId())
                    .receiptNumber(gr.getReceiptNumber())
                    .receiptDate(gr.getReceivedAt() != null ? gr.getReceivedAt() : gr.getCreatedAt())
                    .supplierId(supplier != null ? supplier.getId() : null)
                    .supplierName(supplier != null ? supplier.getName() : "Không xác định")
                    .supplierTaxCode(supplier != null ? supplier.getTaxCode() : null)
                    .supplierInvoiceNumber(suppInvoiceNum)
                    .productId(product != null ? product.getId() : null)
                    .productCode(product != null ? (product.getSku() != null ? product.getSku() : (product.getBarcode() != null ? product.getBarcode() : "N/A")) : "N/A")
                    .productName(product != null ? product.getName() : "N/A")
                    .unitName(grd.getUnitName() != null ? grd.getUnitName() : (product != null ? product.getUnit() : ""))
                    .baseQuantity(baseQty)
                    .basePurchasePrice(basePrice)
                    .totalAmount(lineTotal)
                    .isSupplierMissing(isMissing)
                    .notes(gr.getNotes())
                    .build();

            TaxPurchaseRegister entity = TaxPurchaseRegister.builder()
                    .period(period)
                    .receipt(gr)
                    .receiptDetail(grd)
                    .receiptNumber(itemDto.getReceiptNumber())
                    .receiptDate(itemDto.getReceiptDate())
                    .supplier(supplier)
                    .supplierName(itemDto.getSupplierName())
                    .supplierTaxCode(itemDto.getSupplierTaxCode())
                    .supplierInvoiceNumber(itemDto.getSupplierInvoiceNumber())
                    .product(product)
                    .productCode(itemDto.getProductCode())
                    .productName(itemDto.getProductName())
                    .unitName(itemDto.getUnitName())
                    .baseQuantity(baseQty)
                    .basePurchasePrice(basePrice)
                    .totalAmount(lineTotal)
                    .isSupplierMissing(isMissing)
                    .notes(itemDto.getNotes())
                    .build();

            entitiesToSave.add(entity);
            allItemDtos.add(itemDto);

            if (isMissing) {
                missingSupplierItems.add(itemDto);
                missingSupplierReceiptIds.add(gr.getId());
            } else {
                eligibleTaxDeductionAmount = eligibleTaxDeductionAmount.add(lineTotal);
                String suppKey = supplier.getId();
                SupplierPurchaseGroupResponse group = validSupplierMap.computeIfAbsent(suppKey, k ->
                        SupplierPurchaseGroupResponse.builder()
                                .supplierId(supplier.getId())
                                .supplierName(supplier.getName())
                                .supplierTaxCode(supplier.getTaxCode())
                                .items(new ArrayList<>())
                                .subtotalQuantity(BigDecimal.ZERO)
                                .subtotalAmount(BigDecimal.ZERO)
                                .receiptCount(0)
                                .build()
                );
                group.getItems().add(itemDto);
                group.setSubtotalQuantity(group.getSubtotalQuantity().add(baseQty));
                group.setSubtotalAmount(group.getSubtotalAmount().add(lineTotal));
            }
        }

        // Đếm số lượng phiếu nhập cho từng nhóm NCC
        for (SupplierPurchaseGroupResponse group : validSupplierMap.values()) {
            long rCount = group.getItems().stream().map(TaxPurchaseRegisterItemResponse::getReceiptId).distinct().count();
            group.setReceiptCount((int) rCount);
        }

        // Nhóm phiếu thiếu NCC (TC-02)
        SupplierPurchaseGroupResponse unidentifiedGroup = null;
        boolean hasMissing = !missingSupplierItems.isEmpty();
        String warningMsg = null;
        if (hasMissing) {
            BigDecimal missingQty = missingSupplierItems.stream()
                    .map(TaxPurchaseRegisterItemResponse::getBaseQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal missingAmt = missingSupplierItems.stream()
                    .map(TaxPurchaseRegisterItemResponse::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            unidentifiedGroup = SupplierPurchaseGroupResponse.builder()
                    .supplierId(null)
                    .supplierName("Chứng từ không có thông tin Nhà cung cấp")
                    .supplierTaxCode(null)
                    .items(missingSupplierItems)
                    .subtotalQuantity(missingQty)
                    .subtotalAmount(missingAmt)
                    .receiptCount(missingSupplierReceiptIds.size())
                    .build();

            warningMsg = String.format("Cảnh báo: Phát hiện %d phiếu nhập hàng (tổng giá trị %s đ) không có thông tin Nhà cung cấp. Các khoản này không đủ điều kiện đưa vào hồ sơ kê khai thuế hợp lệ.",
                    missingSupplierReceiptIds.size(), formatMoney(missingAmt));
        }

        // Lưu danh sách chi tiết
        for (TaxPurchaseRegister entity : entitiesToSave) {
            entity.setPeriod(period);
        }
        List<TaxPurchaseRegister> savedEntities = purchaseRegisterRepository.saveAll(entitiesToSave);

        // Cập nhật ID được sinh ra từ savedEntities vào DTO theo thứ tự O(N)
        for (int i = 0; i < savedEntities.size(); i++) {
            allItemDtos.get(i).setId(savedEntities.get(i).getId());
        }

        // Cập nhật giá trị vào period
        period.setTotalPurchaseAmount(grandTotalAmount);
        period.setTotalPurchaseReceipts(totalReceiptIds.size());
        if ("DRAFT".equalsIgnoreCase(period.getStatus())) {
            period.setStatus("GENERATED");
        }
        period = taxPeriodRepository.save(period);

        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "GENERATE_TAX_PURCHASE_REGISTER", "tax_declaration_periods",
                period.getId(), null, "Lập bảng kê hàng hóa mua vào: " + period.getPeriodName(), null, null
        );

        return TaxPurchaseRegisterSummaryResponse.builder()
                .periodId(period.getId())
                .periodName(period.getPeriodName())
                .periodType(period.getPeriodType())
                .year(period.getYear())
                .periodNumber(period.getPeriodNumber())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .status(period.getStatus())
                .isLocked("LOCKED".equalsIgnoreCase(period.getStatus()))
                .validSuppliers(new ArrayList<>(validSupplierMap.values()))
                .unidentifiedSuppliers(unidentifiedGroup)
                .hasMissingSupplierReceipts(hasMissing)
                .missingSupplierReceiptCount(missingSupplierReceiptIds.size())
                .warningMessage(warningMsg)
                .grandTotalQuantity(grandTotalQuantity)
                .grandTotalAmount(grandTotalAmount)
                .eligibleForTaxDeductionAmount(eligibleTaxDeductionAmount)
                .totalReceiptCount(totalReceiptIds.size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TaxPurchaseRegisterSummaryResponse getPurchaseRegisterSummary(String currentUsername, String periodId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        validateTaxPeriodAccessRole(currentUser);

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        List<TaxPurchaseRegister> entities = purchaseRegisterRepository.findByPeriodIdOrderByReceiptDateAsc(period.getId());
        if (entities.isEmpty()) {
            throw new AppException(ErrorCode.PURCHASE_REGISTER_NOT_FOUND);
        }

        return buildSummaryFromEntities(period, entities);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TaxPurchaseRegisterItemResponse> getPurchaseRegisterItems(
            String currentUsername, String periodId, int page, int size, Boolean missingSupplierOnly) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        validateTaxPeriodAccessRole(currentUser);

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by("receiptDate").ascending());
        Page<TaxPurchaseRegister> pageResult;
        if (Boolean.TRUE.equals(missingSupplierOnly)) {
            pageResult = purchaseRegisterRepository.findByPeriodIdAndIsSupplierMissing(period.getId(), true, pageable);
        } else {
            pageResult = purchaseRegisterRepository.findByPeriodId(period.getId(), pageable);
        }

        List<TaxPurchaseRegisterItemResponse> content = pageResult.getContent().stream()
                .map(this::mapPurchaseRegisterItemToResponse)
                .collect(Collectors.toList());

        return PageResponse.<TaxPurchaseRegisterItemResponse>builder()
                .content(content)
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> exportPurchaseRegister(String currentUsername, String periodId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        validateTaxPeriodAccessRole(currentUser);

        TaxDeclarationPeriod period = taxPeriodRepository.findByIdAndHouseholdId(periodId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_PERIOD_NOT_FOUND));

        List<TaxPurchaseRegister> entities = purchaseRegisterRepository.findByPeriodIdOrderByReceiptDateAsc(period.getId());
        if (entities.isEmpty()) {
            throw new AppException(ErrorCode.PURCHASE_REGISTER_NOT_FOUND);
        }

        TaxPurchaseRegisterSummaryResponse summary = buildSummaryFromEntities(period, entities);
        byte[] excelBytes = generatePurchaseRegisterWorkbook(household, period, summary);

        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, "EXPORT_TAX_PURCHASE_REGISTER", "tax_declaration_periods",
                period.getId(), null, "Xuất Excel bảng kê hàng hóa mua vào: " + period.getPeriodName(), null, null
        );

        String fileName = String.format("Bang_ke_hang_hoa_mua_vao_%s_%d.xlsx",
                "MONTHLY".equals(period.getPeriodType()) ? "T" + period.getPeriodNumber() : "Q" + period.getPeriodNumber(),
                period.getYear());

        org.springframework.http.ContentDisposition contentDisposition = org.springframework.http.ContentDisposition
                .builder("attachment")
                .filename(fileName)
                .build();

        ByteArrayResource resource = new ByteArrayResource(excelBytes);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(excelBytes.length)
                .body(resource);
    }

    private TaxPurchaseRegisterSummaryResponse buildSummaryFromEntities(
            TaxDeclarationPeriod period, List<TaxPurchaseRegister> entities) {
        Map<String, SupplierPurchaseGroupResponse> validSupplierMap = new LinkedHashMap<>();
        List<TaxPurchaseRegisterItemResponse> missingSupplierItems = new ArrayList<>();

        BigDecimal grandTotalQuantity = BigDecimal.ZERO;
        BigDecimal grandTotalAmount = BigDecimal.ZERO;
        BigDecimal eligibleTaxDeductionAmount = BigDecimal.ZERO;
        Set<String> totalReceiptIds = new HashSet<>();
        Set<String> missingSupplierReceiptIds = new HashSet<>();

        for (TaxPurchaseRegister entity : entities) {
            totalReceiptIds.add(entity.getReceipt() != null ? entity.getReceipt().getId() : entity.getReceiptNumber());
            grandTotalQuantity = grandTotalQuantity.add(entity.getBaseQuantity());
            grandTotalAmount = grandTotalAmount.add(entity.getTotalAmount());

            TaxPurchaseRegisterItemResponse itemDto = mapPurchaseRegisterItemToResponse(entity);

            if (Boolean.TRUE.equals(entity.getIsSupplierMissing())) {
                missingSupplierItems.add(itemDto);
                missingSupplierReceiptIds.add(itemDto.getReceiptId());
            } else {
                eligibleTaxDeductionAmount = eligibleTaxDeductionAmount.add(entity.getTotalAmount());
                String suppKey = entity.getSupplier() != null ? entity.getSupplier().getId() : (entity.getSupplierName() != null ? entity.getSupplierName() : "UNKNOWN");
                SupplierPurchaseGroupResponse group = validSupplierMap.computeIfAbsent(suppKey, k ->
                        SupplierPurchaseGroupResponse.builder()
                                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                                .supplierName(entity.getSupplierName())
                                .supplierTaxCode(entity.getSupplierTaxCode())
                                .items(new ArrayList<>())
                                .subtotalQuantity(BigDecimal.ZERO)
                                .subtotalAmount(BigDecimal.ZERO)
                                .receiptCount(0)
                                .build()
                );
                group.getItems().add(itemDto);
                group.setSubtotalQuantity(group.getSubtotalQuantity().add(entity.getBaseQuantity()));
                group.setSubtotalAmount(group.getSubtotalAmount().add(entity.getTotalAmount()));
            }
        }

        for (SupplierPurchaseGroupResponse group : validSupplierMap.values()) {
            long rCount = group.getItems().stream().map(TaxPurchaseRegisterItemResponse::getReceiptId).distinct().count();
            group.setReceiptCount((int) rCount);
        }

        SupplierPurchaseGroupResponse unidentifiedGroup = null;
        boolean hasMissing = !missingSupplierItems.isEmpty();
        String warningMsg = null;
        if (hasMissing) {
            BigDecimal missingQty = missingSupplierItems.stream()
                    .map(TaxPurchaseRegisterItemResponse::getBaseQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal missingAmt = missingSupplierItems.stream()
                    .map(TaxPurchaseRegisterItemResponse::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            unidentifiedGroup = SupplierPurchaseGroupResponse.builder()
                    .supplierId(null)
                    .supplierName("Chứng từ không có thông tin Nhà cung cấp")
                    .supplierTaxCode(null)
                    .items(missingSupplierItems)
                    .subtotalQuantity(missingQty)
                    .subtotalAmount(missingAmt)
                    .receiptCount(missingSupplierReceiptIds.size())
                    .build();

            warningMsg = String.format("Cảnh báo: Phát hiện %d phiếu nhập hàng (tổng giá trị %s đ) không có thông tin Nhà cung cấp. Các khoản này không đủ điều kiện đưa vào hồ sơ kê khai thuế hợp lệ.",
                    missingSupplierReceiptIds.size(), formatMoney(missingAmt));
        }

        return TaxPurchaseRegisterSummaryResponse.builder()
                .periodId(period.getId())
                .periodName(period.getPeriodName())
                .periodType(period.getPeriodType())
                .year(period.getYear())
                .periodNumber(period.getPeriodNumber())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .status(period.getStatus())
                .isLocked("LOCKED".equalsIgnoreCase(period.getStatus()))
                .validSuppliers(new ArrayList<>(validSupplierMap.values()))
                .unidentifiedSuppliers(unidentifiedGroup)
                .hasMissingSupplierReceipts(hasMissing)
                .missingSupplierReceiptCount(missingSupplierReceiptIds.size())
                .warningMessage(warningMsg)
                .grandTotalQuantity(grandTotalQuantity)
                .grandTotalAmount(grandTotalAmount)
                .eligibleForTaxDeductionAmount(eligibleTaxDeductionAmount)
                .totalReceiptCount(totalReceiptIds.size())
                .build();
    }

    private TaxPurchaseRegisterItemResponse mapPurchaseRegisterItemToResponse(TaxPurchaseRegister entity) {
        return TaxPurchaseRegisterItemResponse.builder()
                .id(entity.getId())
                .receiptId(entity.getReceipt() != null ? entity.getReceipt().getId() : null)
                .receiptNumber(entity.getReceiptNumber())
                .receiptDate(entity.getReceiptDate())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .supplierName(entity.getSupplierName())
                .supplierTaxCode(entity.getSupplierTaxCode())
                .supplierInvoiceNumber(entity.getSupplierInvoiceNumber())
                .productId(entity.getProduct() != null ? entity.getProduct().getId() : null)
                .productCode(entity.getProductCode())
                .productName(entity.getProductName())
                .unitName(entity.getUnitName())
                .baseQuantity(entity.getBaseQuantity())
                .basePurchasePrice(entity.getBasePurchasePrice())
                .totalAmount(entity.getTotalAmount())
                .isSupplierMissing(entity.getIsSupplierMissing())
                .notes(entity.getNotes())
                .build();
    }

    private String extractSupplierInvoiceNumber(String notes) {
        if (notes == null || notes.trim().isEmpty()) {
            return null;
        }
        // Tìm kiếm nếu trong ghi chú có định dạng "HĐ: XYZ" hoặc "HD: XYZ" hoặc "Số HĐ: XYZ"
        java.util.regex.Matcher matcher = SUPPLIER_INVOICE_PATTERN.matcher(notes);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0";
        return java.text.NumberFormat.getNumberInstance(new java.util.Locale("vi", "VN")).format(amount);
    }

    private byte[] generatePurchaseRegisterWorkbook(
            BusinessHousehold household,
            TaxDeclarationPeriod period,
            TaxPurchaseRegisterSummaryResponse summary) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Bang_Ke_Mua_Vao");
            sheet.setDisplayGridlines(true);

            DataFormat dataFormat = workbook.createDataFormat();

            // Fonts
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);

            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);

            Font subTitleFont = workbook.createFont();
            subTitleFont.setItalic(true);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            Font warningFont = workbook.createFont();
            warningFont.setBold(true);
            warningFont.setColor(IndexedColors.RED.getIndex());

            // Styles
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle subTitleStyle = workbook.createCellStyle();
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle tableHeaderStyle = workbook.createCellStyle();
            tableHeaderStyle.setFont(headerFont);
            tableHeaderStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            tableHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tableHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            tableHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            tableHeaderStyle.setBorderTop(BorderStyle.THIN);
            tableHeaderStyle.setBorderBottom(BorderStyle.THIN);
            tableHeaderStyle.setBorderLeft(BorderStyle.THIN);
            tableHeaderStyle.setBorderRight(BorderStyle.THIN);
            tableHeaderStyle.setWrapText(true);

            CellStyle groupHeaderStyle = workbook.createCellStyle();
            groupHeaderStyle.setFont(boldFont);
            groupHeaderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            groupHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            groupHeaderStyle.setBorderTop(BorderStyle.THIN);
            groupHeaderStyle.setBorderBottom(BorderStyle.THIN);
            groupHeaderStyle.setBorderLeft(BorderStyle.THIN);
            groupHeaderStyle.setBorderRight(BorderStyle.THIN);

            CellStyle subtotalStyle = workbook.createCellStyle();
            subtotalStyle.setFont(boldFont);
            subtotalStyle.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            subtotalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            subtotalStyle.setBorderTop(BorderStyle.THIN);
            subtotalStyle.setBorderBottom(BorderStyle.THIN);
            subtotalStyle.setBorderLeft(BorderStyle.THIN);
            subtotalStyle.setBorderRight(BorderStyle.THIN);

            CellStyle grandTotalStyle = workbook.createCellStyle();
            grandTotalStyle.setFont(boldFont);
            grandTotalStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            grandTotalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            grandTotalStyle.setBorderTop(BorderStyle.MEDIUM);
            grandTotalStyle.setBorderBottom(BorderStyle.MEDIUM);
            grandTotalStyle.setBorderLeft(BorderStyle.THIN);
            grandTotalStyle.setBorderRight(BorderStyle.THIN);

            CellStyle borderLeft = workbook.createCellStyle();
            borderLeft.setBorderTop(BorderStyle.THIN);
            borderLeft.setBorderBottom(BorderStyle.THIN);
            borderLeft.setBorderLeft(BorderStyle.THIN);
            borderLeft.setBorderRight(BorderStyle.THIN);
            borderLeft.setAlignment(HorizontalAlignment.LEFT);

            CellStyle borderCenter = workbook.createCellStyle();
            borderCenter.setBorderTop(BorderStyle.THIN);
            borderCenter.setBorderBottom(BorderStyle.THIN);
            borderCenter.setBorderLeft(BorderStyle.THIN);
            borderCenter.setBorderRight(BorderStyle.THIN);
            borderCenter.setAlignment(HorizontalAlignment.CENTER);

            CellStyle borderNumber = workbook.createCellStyle();
            borderNumber.setBorderTop(BorderStyle.THIN);
            borderNumber.setBorderBottom(BorderStyle.THIN);
            borderNumber.setBorderLeft(BorderStyle.THIN);
            borderNumber.setBorderRight(BorderStyle.THIN);
            borderNumber.setAlignment(HorizontalAlignment.RIGHT);
            borderNumber.setDataFormat(dataFormat.getFormat("#,##0.00"));

            CellStyle subtotalNumber = workbook.createCellStyle();
            subtotalNumber.cloneStyleFrom(subtotalStyle);
            subtotalNumber.setAlignment(HorizontalAlignment.RIGHT);
            subtotalNumber.setDataFormat(dataFormat.getFormat("#,##0.00"));

            CellStyle grandTotalNumber = workbook.createCellStyle();
            grandTotalNumber.cloneStyleFrom(grandTotalStyle);
            grandTotalNumber.setAlignment(HorizontalAlignment.RIGHT);
            grandTotalNumber.setDataFormat(dataFormat.getFormat("#,##0.00"));

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            int r = 0;

            // 1. Thông tin Hộ kinh doanh
            Row rH1 = sheet.createRow(r++);
            Cell cH1 = rH1.createCell(0);
            cH1.setCellValue("Tên Hộ kinh doanh: " + (household != null ? household.getName() : ""));
            cH1.getCellStyle().setFont(boldFont);

            Row rH2 = sheet.createRow(r++);
            Cell cH2 = rH2.createCell(0);
            cH2.setCellValue("Mã số thuế: " + (household != null ? household.getTaxCode() : ""));

            Row rH3 = sheet.createRow(r++);
            Cell cH3 = rH3.createCell(0);
            cH3.setCellValue("Địa chỉ: " + (household != null ? household.getAddress() : ""));
            r++;

            // 2. Tiêu đề chính
            Row rTitle = sheet.createRow(r++);
            Cell cTitle = rTitle.createCell(0);
            cTitle.setCellValue("BẢNG KÊ HÀNG HÓA, DỊCH VỤ MUA VÀO");
            cTitle.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 0, 10));

            Row rSub = sheet.createRow(r++);
            Cell cSub = rSub.createCell(0);
            cSub.setCellValue("(" + period.getPeriodName() + " - Từ ngày " + period.getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " đến ngày " + period.getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")");
            cSub.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 0, 10));
            r++;

            // 3. Header bảng
            String[] headers = {
                    "STT", "Ngày phiếu", "Số phiếu nhập", "Nhà cung cấp", "MST NCC",
                    "Số HĐ NCC", "Mặt hàng", "ĐVT", "Số lượng", "Đơn giá nhập (đ)", "Thành tiền (đ)"
            };

            Row headerRow = sheet.createRow(r++);
            headerRow.setHeightInPoints(26);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(tableHeaderStyle);
            }

            int stt = 1;

            // 4. Nhóm Nhà cung cấp hợp lệ
            if (summary.getValidSuppliers() != null) {
                for (SupplierPurchaseGroupResponse group : summary.getValidSuppliers()) {
                    // Dòng nhóm NCC
                    Row suppRow = sheet.createRow(r++);
                    Cell suppCell = suppRow.createCell(0);
                    suppCell.setCellValue("Nhà cung cấp: " + group.getSupplierName() + (group.getSupplierTaxCode() != null ? " - MST: " + group.getSupplierTaxCode() : ""));
                    suppCell.setCellStyle(groupHeaderStyle);
                    for (int i = 1; i < headers.length; i++) {
                        Cell emptyCell = suppRow.createCell(i);
                        emptyCell.setCellStyle(groupHeaderStyle);
                    }
                    sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 0, headers.length - 1));

                    // Dòng chi tiết
                    for (TaxPurchaseRegisterItemResponse item : group.getItems()) {
                        Row itemRow = sheet.createRow(r++);
                        Cell c0 = itemRow.createCell(0); c0.setCellValue(stt++); c0.setCellStyle(borderCenter);
                        Cell c1 = itemRow.createCell(1); c1.setCellValue(item.getReceiptDate() != null ? item.getReceiptDate().format(dateFormatter) : ""); c1.setCellStyle(borderCenter);
                        Cell c2 = itemRow.createCell(2); c2.setCellValue(item.getReceiptNumber() != null ? item.getReceiptNumber() : ""); c2.setCellStyle(borderCenter);
                        Cell c3 = itemRow.createCell(3); c3.setCellValue(item.getSupplierName() != null ? item.getSupplierName() : ""); c3.setCellStyle(borderLeft);
                        Cell c4 = itemRow.createCell(4); c4.setCellValue(item.getSupplierTaxCode() != null ? item.getSupplierTaxCode() : ""); c4.setCellStyle(borderCenter);
                        Cell c5 = itemRow.createCell(5); c5.setCellValue(item.getSupplierInvoiceNumber() != null ? item.getSupplierInvoiceNumber() : ""); c5.setCellStyle(borderCenter);
                        Cell c6 = itemRow.createCell(6); c6.setCellValue(item.getProductName() != null ? item.getProductName() : ""); c6.setCellStyle(borderLeft);
                        Cell c7 = itemRow.createCell(7); c7.setCellValue(item.getUnitName() != null ? item.getUnitName() : ""); c7.setCellStyle(borderCenter);
                        Cell c8 = itemRow.createCell(8); c8.setCellValue(item.getBaseQuantity() != null ? item.getBaseQuantity().doubleValue() : 0.0); c8.setCellStyle(borderNumber);
                        Cell c9 = itemRow.createCell(9); c9.setCellValue(item.getBasePurchasePrice() != null ? item.getBasePurchasePrice().doubleValue() : 0.0); c9.setCellStyle(borderNumber);
                        Cell c10 = itemRow.createCell(10); c10.setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0.0); c10.setCellStyle(borderNumber);
                    }

                    // Dòng tổng phụ NCC
                    Row subRow = sheet.createRow(r++);
                    Cell subLabel = subRow.createCell(0);
                    subLabel.setCellValue("Cộng nhóm NCC [" + group.getSupplierName() + "]:");
                    subLabel.setCellStyle(subtotalStyle);
                    for (int i = 1; i <= 7; i++) {
                        Cell c = subRow.createCell(i);
                        c.setCellStyle(subtotalStyle);
                    }
                    sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 0, 7));

                    Cell subQty = subRow.createCell(8);
                    subQty.setCellValue(group.getSubtotalQuantity() != null ? group.getSubtotalQuantity().doubleValue() : 0.0);
                    subQty.setCellStyle(subtotalNumber);

                    Cell subPrice = subRow.createCell(9);
                    subPrice.setCellValue("---");
                    subPrice.setCellStyle(subtotalStyle);

                    Cell subAmt = subRow.createCell(10);
                    subAmt.setCellValue(group.getSubtotalAmount() != null ? group.getSubtotalAmount().doubleValue() : 0.0);
                    subAmt.setCellStyle(subtotalNumber);
                }
            }

            // 5. Dòng TỔNG CỘNG TOÀN KỲ
            Row grandRow = sheet.createRow(r++);
            Cell grandLabel = grandRow.createCell(0);
            grandLabel.setCellValue("TỔNG CỘNG HÀNG HÓA MUA VÀO TOÀN KỲ:");
            grandLabel.setCellStyle(grandTotalStyle);
            for (int i = 1; i <= 7; i++) {
                Cell c = grandRow.createCell(i);
                c.setCellStyle(grandTotalStyle);
            }
            sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 0, 7));

            Cell grandQty = grandRow.createCell(8);
            grandQty.setCellValue(summary.getGrandTotalQuantity() != null ? summary.getGrandTotalQuantity().doubleValue() : 0.0);
            grandQty.setCellStyle(grandTotalNumber);

            Cell grandPrice = grandRow.createCell(9);
            grandPrice.setCellValue("---");
            grandPrice.setCellStyle(grandTotalStyle);

            Cell grandAmt = grandRow.createCell(10);
            grandAmt.setCellValue(summary.getGrandTotalAmount() != null ? summary.getGrandTotalAmount().doubleValue() : 0.0);
            grandAmt.setCellStyle(grandTotalNumber);
            r++;

            // 6. Nhóm cảnh báo thiếu NCC (TC-02)
            if (summary.getUnidentifiedSuppliers() != null && summary.getUnidentifiedSuppliers().getItems() != null && !summary.getUnidentifiedSuppliers().getItems().isEmpty()) {
                Row warnTitleRow = sheet.createRow(r++);
                Cell warnTitle = warnTitleRow.createCell(0);
                warnTitle.setCellValue("DANH SÁCH CHỨNG TỪ KHÔNG CÓ THÔNG TIN NHÀ CUNG CẤP (KHÔNG ĐỦ ĐIỀU KIỆN KÊ KHAI THUẾ)");
                CellStyle warnStyle = workbook.createCellStyle();
                warnStyle.setFont(warningFont);
                warnStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
                warnStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                warnStyle.setAlignment(HorizontalAlignment.LEFT);
                warnTitle.setCellStyle(warnStyle);
                for (int i = 1; i < headers.length; i++) {
                    Cell c = warnTitleRow.createCell(i);
                    c.setCellStyle(warnStyle);
                }
                sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 0, headers.length - 1));

                for (TaxPurchaseRegisterItemResponse mItem : summary.getUnidentifiedSuppliers().getItems()) {
                    Row itemRow = sheet.createRow(r++);
                    Cell c0 = itemRow.createCell(0); c0.setCellValue(stt++); c0.setCellStyle(borderCenter);
                    Cell c1 = itemRow.createCell(1); c1.setCellValue(mItem.getReceiptDate() != null ? mItem.getReceiptDate().format(dateFormatter) : ""); c1.setCellStyle(borderCenter);
                    Cell c2 = itemRow.createCell(2); c2.setCellValue(mItem.getReceiptNumber() != null ? mItem.getReceiptNumber() : ""); c2.setCellStyle(borderCenter);
                    Cell c3 = itemRow.createCell(3); c3.setCellValue("Không xác định (Thiếu NCC)"); c3.setCellStyle(borderLeft);
                    Cell c4 = itemRow.createCell(4); c4.setCellValue("---"); c4.setCellStyle(borderCenter);
                    Cell c5 = itemRow.createCell(5); c5.setCellValue("---"); c5.setCellStyle(borderCenter);
                    Cell c6 = itemRow.createCell(6); c6.setCellValue(mItem.getProductName() != null ? mItem.getProductName() : ""); c6.setCellStyle(borderLeft);
                    Cell c7 = itemRow.createCell(7); c7.setCellValue(mItem.getUnitName() != null ? mItem.getUnitName() : ""); c7.setCellStyle(borderCenter);
                    Cell c8 = itemRow.createCell(8); c8.setCellValue(mItem.getBaseQuantity() != null ? mItem.getBaseQuantity().doubleValue() : 0.0); c8.setCellStyle(borderNumber);
                    Cell c9 = itemRow.createCell(9); c9.setCellValue(mItem.getBasePurchasePrice() != null ? mItem.getBasePurchasePrice().doubleValue() : 0.0); c9.setCellStyle(borderNumber);
                    Cell c10 = itemRow.createCell(10); c10.setCellValue(mItem.getTotalAmount() != null ? mItem.getTotalAmount().doubleValue() : 0.0); c10.setCellStyle(borderNumber);
                }
                r++;
            }

            // 7. Chân trang chữ ký
            r += 2;
            Row signRow1 = sheet.createRow(r++);
            Cell signDate = signRow1.createCell(7);
            signDate.setCellValue("Ngày ..... tháng ..... năm .....");
            signDate.getCellStyle().setAlignment(HorizontalAlignment.CENTER);
            sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 7, 10));

            Row signRow2 = sheet.createRow(r++);
            Cell s1 = signRow2.createCell(1);
            s1.setCellValue("NGƯỜI LẬP BIỂU");
            s1.getCellStyle().setFont(boldFont);
            s1.getCellStyle().setAlignment(HorizontalAlignment.CENTER);
            sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 1, 3));

            Cell s2 = signRow2.createCell(7);
            s2.setCellValue("CHỦ HỘ KINH DOANH");
            s2.getCellStyle().setFont(boldFont);
            s2.getCellStyle().setAlignment(HorizontalAlignment.CENTER);
            sheet.addMergedRegion(new CellRangeAddress(r - 1, r - 1, 7, 10));

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.max(currentWidth + 1000, 3500));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Lỗi khi sinh tệp Excel bảng kê hàng hóa mua vào: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
