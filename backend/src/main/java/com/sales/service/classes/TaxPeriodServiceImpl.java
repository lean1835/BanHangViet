package com.sales.service.classes;

import com.sales.dto.request.GenerateTaxRegisterRequest;
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
import com.sales.service.interfaces.TaxPeriodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxPeriodServiceImpl implements TaxPeriodService {

    private final TaxDeclarationPeriodRepository taxPeriodRepository;
    private final TaxSalesRegisterRepository salesRegisterRepository;
    private final EInvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;

    @Override
    @Transactional
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
}
