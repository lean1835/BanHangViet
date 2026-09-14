package com.sales.service.classes;

import com.sales.constant.RevenueThresholdConstants;
import com.sales.constant.RevenueWarningStatus;
import com.sales.dto.request.UpdateWarningThresholdRequest;
import com.sales.dto.response.*;
import com.sales.entity.AppNotification;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.EInvoice;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.AppNotificationRepository;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.AnnualRevenueTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnualRevenueTrackingServiceImpl implements AnnualRevenueTrackingService {

    private final UserRepository userRepository;
    private final BusinessHouseholdRepository householdRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final EInvoiceRepository invoiceRepository;
    private final AppNotificationRepository notificationRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ActivityLogRepository activityLogRepository;

    private static final DecimalFormatSymbols VIETNAM_SYMBOLS;

    static {
        VIETNAM_SYMBOLS = new DecimalFormatSymbols(new Locale("vi", "VN"));
        VIETNAM_SYMBOLS.setGroupingSeparator('.');
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        DecimalFormat df = new DecimalFormat("#,##0", VIETNAM_SYMBOLS);
        return df.format(amount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AnnualRevenueTrackingResponse getAnnualRevenueTracking(String currentUsername, Integer year) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // QTN-10 & RBAC: Sales staff (VT-02) cannot view total financial revenue reports
        if (currentUser.getRole() != null && "VT-02".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        LocalDate currentDate = LocalDate.now();
        int targetYear = (year != null) ? year : currentDate.getYear();
        if (targetYear < 2020 || targetYear > currentDate.getYear() + 1) {
            throw new AppException(ErrorCode.YEAR_INVALID);
        }

        // Get or initialize household settings
        BusinessHouseholdSettings settings = settingsRepository.findByHouseholdId(household.getId())
                .orElse(null);
        BigDecimal warningPercentage = (settings != null && settings.getRevenueWarningThresholdPercentage() != null)
                ? settings.getRevenueWarningThresholdPercentage()
                : RevenueThresholdConstants.DEFAULT_WARNING_PERCENTAGE;

        BigDecimal mandatoryThreshold = RevenueThresholdConstants.MANDATORY_REVENUE_THRESHOLD;
        BigDecimal warningRevenueAmount = mandatoryThreshold.multiply(warningPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Fetch valid invoices in calendar year according to QTN-22 & GAP 04
        LocalDateTime startOfYear = LocalDate.of(targetYear, 1, 1).atStartOfDay();
        LocalDateTime endOfYear = LocalDate.of(targetYear, 12, 31).atTime(LocalTime.MAX);

        List<EInvoice> validInvoices = invoiceRepository.findValidInvoicesForTaxPeriod(
                household.getId(), startOfYear, endOfYear
        );

        // Calculate cumulative revenue and tax amounts with monthly breakdown
        BigDecimal cumulativeRevenue = BigDecimal.ZERO;
        BigDecimal cumulativeTaxAmount = BigDecimal.ZERO;
        int validInvoiceCount = 0;

        Map<Integer, MonthAccumulator> monthlyBuckets = new TreeMap<>();
        for (int m = 1; m <= 12; m++) {
            monthlyBuckets.put(m, new MonthAccumulator(m));
        }

        for (EInvoice inv : validInvoices) {
            boolean isAdjustmentDecrease = inv.getReturnTicket() != null
                    || (inv.getTitle() != null && inv.getTitle().toLowerCase().contains("điều chỉnh giảm"));

            BigDecimal beforeTax = inv.getTotalAmountBeforeTax() != null ? inv.getTotalAmountBeforeTax() : BigDecimal.ZERO;
            BigDecimal taxAmt = inv.getTaxAmount() != null ? inv.getTaxAmount() : BigDecimal.ZERO;

            BigDecimal netRevenue = isAdjustmentDecrease ? beforeTax.negate() : beforeTax;
            BigDecimal netTax = isAdjustmentDecrease ? taxAmt.negate() : taxAmt;

            cumulativeRevenue = cumulativeRevenue.add(netRevenue);
            cumulativeTaxAmount = cumulativeTaxAmount.add(netTax);
            validInvoiceCount++;

            LocalDateTime eventTime = inv.getTaxResponseAt() != null ? inv.getTaxResponseAt() : inv.getCreatedAt();
            int invoiceMonth = eventTime.getMonthValue();

            MonthAccumulator bucket = monthlyBuckets.get(invoiceMonth);
            if (bucket != null) {
                bucket.add(netRevenue, netTax);
            }
        }

        // Build monthly breakdown
        int maxMonthToShow = (targetYear == currentDate.getYear()) ? currentDate.getMonthValue() : 12;
        BigDecimal runningCumulative = BigDecimal.ZERO;
        List<MonthlyRevenueBreakdownResponse> breakdownList = new ArrayList<>();

        for (int m = 1; m <= maxMonthToShow; m++) {
            MonthAccumulator bucket = monthlyBuckets.get(m);
            runningCumulative = runningCumulative.add(bucket.getRevenue());

            BigDecimal pct = runningCumulative.divide(mandatoryThreshold, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            breakdownList.add(MonthlyRevenueBreakdownResponse.builder()
                    .month(m)
                    .revenue(bucket.getRevenue().setScale(2, RoundingMode.HALF_UP))
                    .taxAmount(bucket.getTaxAmount().setScale(2, RoundingMode.HALF_UP))
                    .validInvoiceCount(bucket.getCount())
                    .cumulativeRevenue(runningCumulative.setScale(2, RoundingMode.HALF_UP))
                    .percentageOfThreshold(pct.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        // Metrics: Percentage of threshold
        BigDecimal thresholdPercentage = cumulativeRevenue.divide(mandatoryThreshold, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);

        // Elapsed months & average monthly run rate
        int elapsedMonths;
        if (targetYear < currentDate.getYear()) {
            elapsedMonths = 12;
        } else if (targetYear > currentDate.getYear()) {
            elapsedMonths = 1;
        } else {
            elapsedMonths = Math.max(1, currentDate.getMonthValue());
        }

        BigDecimal averageMonthlyRevenue = cumulativeRevenue.compareTo(BigDecimal.ZERO) > 0
                ? cumulativeRevenue.divide(BigDecimal.valueOf(elapsedMonths), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal remainingRevenueToThreshold = mandatoryThreshold.subtract(cumulativeRevenue).max(BigDecimal.ZERO);

        // Projected reach date
        LocalDate projectedReachDate = null;
        Boolean projectedInCurrentYear = null;

        if (targetYear < currentDate.getYear()) {
            // Historical year has already passed
            projectedReachDate = null;
            projectedInCurrentYear = false;
        } else if (cumulativeRevenue.compareTo(mandatoryThreshold) >= 0) {
            projectedReachDate = null;
            projectedInCurrentYear = true;
        } else if (averageMonthlyRevenue.compareTo(BigDecimal.ZERO) <= 0) {
            projectedReachDate = null;
            projectedInCurrentYear = false;
        } else {
            BigDecimal daysRemainingExact = remainingRevenueToThreshold.divide(averageMonthlyRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(30));
            long daysRemaining = Math.max(1, daysRemainingExact.longValue());
            projectedReachDate = currentDate.plusDays(daysRemaining);
            projectedInCurrentYear = (projectedReachDate.getYear() == targetYear);
        }

        // Determine if household was mandatory from beginning (TC-03)
        boolean isMandatoryFromBeginning = false;
        if (Boolean.TRUE.equals(household.getRevenueThresholdEnabled())) {
            if (cumulativeRevenue.compareTo(mandatoryThreshold) < 0) {
                // If revenue is below 1B but threshold is enabled, it was enabled from beginning/registration
                isMandatoryFromBeginning = true;
            } else {
                // If revenue reached/exceeded 1B, check if it was already mandatory before this target year
                boolean exceededThisYear = activityLogRepository.existsByHouseholdIdAndActionAndCreatedAtBetween(
                        household.getId(), RevenueThresholdConstants.ACTION_REVENUE_THRESHOLD_EXCEEDED,
                        startOfYear, endOfYear
                );
                isMandatoryFromBeginning = !exceededThisYear && (household.getCreatedAt() != null && household.getCreatedAt().isBefore(startOfYear));
            }
        }

        boolean isCurrentYear = (targetYear == currentDate.getYear());

        RevenueWarningStatus warningStatus;
        boolean shouldShowWarning;
        String warningMessage = null;
        String legalObligationNotice = null;

        // TC-03: Household already mandatory from beginning of the year
        if (isMandatoryFromBeginning) {
            warningStatus = RevenueWarningStatus.ALREADY_MANDATORY;
            shouldShowWarning = false;
        } else if (cumulativeRevenue.compareTo(mandatoryThreshold) >= 0) {
            // Reached/Exceeded 1 billion VND threshold (QTN-01)
            warningStatus = RevenueWarningStatus.EXCEEDED;
            shouldShowWarning = true;
            warningMessage = String.format("Doanh thu lũy kế năm %d đã vượt ngưỡng bắt buộc 1 tỷ đồng (%s VNĐ).",
                    targetYear, formatCurrency(cumulativeRevenue));
            legalObligationNotice = buildLegalObligationNotice(true, cumulativeRevenue, targetYear);

            // Only trigger state mutations and push notification if it's the current active year
            if (isCurrentYear) {
                if (!Boolean.TRUE.equals(household.getRevenueThresholdEnabled())) {
                    household.setRevenueThresholdEnabled(true);
                    householdRepository.save(household);

                    activityLogHelper.logActivityInNewTransaction(
                            household, currentUser, RevenueThresholdConstants.ACTION_REVENUE_THRESHOLD_EXCEEDED,
                            "business_households", household.getId(), "false", "true", null, null
                    );
                }

                pushNotificationIfNotExists(
                        household, currentUser, RevenueThresholdConstants.NOTIF_TYPE_REVENUE_EXCEEDED, "DANGER",
                        String.format("CẢNH BÁO: Doanh thu năm %d đã vượt ngưỡng bắt buộc 1 tỷ đồng", targetYear),
                        String.format("Doanh thu lũy kế năm %d của hộ đạt %s VNĐ, vượt ngưỡng 1 tỷ đồng. Hộ bắt buộc phải áp dụng HĐĐT khởi tạo từ máy tính tiền và nộp thuế theo phương pháp kê khai.",
                                targetYear, formatCurrency(cumulativeRevenue)),
                        "/tax/annual-revenue", targetYear, cumulativeRevenue, thresholdPercentage, startOfYear, endOfYear
                );
            }
        } else if (cumulativeRevenue.compareTo(warningRevenueAmount) >= 0) {
            // Crossed custom warning threshold (TC-02)
            warningStatus = RevenueWarningStatus.WARNING_TRIGGERED;
            shouldShowWarning = true;
            warningMessage = String.format("Doanh thu lũy kế năm %d đã đạt %s VNĐ (vượt mức cảnh báo %.1f%% so với ngưỡng 1 tỷ đồng).",
                    targetYear, formatCurrency(cumulativeRevenue), warningPercentage.doubleValue());
            legalObligationNotice = buildLegalObligationNotice(false, cumulativeRevenue, targetYear);

            // Only push notification if it's the current active year
            if (isCurrentYear) {
                pushNotificationIfNotExists(
                        household, currentUser, RevenueThresholdConstants.NOTIF_TYPE_REVENUE_WARNING, "WARNING",
                        String.format("Cảnh báo: Doanh thu năm %d sắp chạm ngưỡng 1 tỷ đồng (đạt %.1f%%)", targetYear, thresholdPercentage.doubleValue()),
                        String.format("Doanh thu lũy kế năm %d đã đạt %s VNĐ, vượt mức cảnh báo %.1f%% do chủ hộ đặt. Đề nghị chủ hộ chủ động chuẩn bị các thủ tục áp dụng HĐĐT khởi tạo từ máy tính tiền.",
                                targetYear, formatCurrency(cumulativeRevenue), warningPercentage.doubleValue()),
                        "/tax/annual-revenue", targetYear, cumulativeRevenue, thresholdPercentage, startOfYear, endOfYear
                );
            }
        } else {
            // Normal (TC-01)
            warningStatus = RevenueWarningStatus.BELOW_WARNING;
            shouldShowWarning = false;
        }

        return AnnualRevenueTrackingResponse.builder()
                .year(targetYear)
                .householdId(household.getId())
                .householdName(household.getName())
                .taxCode(household.getTaxCode())
                .mandatoryThreshold(mandatoryThreshold)
                .warningThresholdPercentage(warningPercentage)
                .warningRevenueAmount(warningRevenueAmount)
                .cumulativeRevenue(cumulativeRevenue.setScale(2, RoundingMode.HALF_UP))
                .cumulativeTaxAmount(cumulativeTaxAmount.setScale(2, RoundingMode.HALF_UP))
                .validInvoiceCount(validInvoiceCount)
                .thresholdPercentage(thresholdPercentage)
                .averageMonthlyRevenue(averageMonthlyRevenue)
                .elapsedMonths(elapsedMonths)
                .projectedReachDate(projectedReachDate)
                .projectedInCurrentYear(projectedInCurrentYear)
                .remainingRevenueToThreshold(remainingRevenueToThreshold.setScale(2, RoundingMode.HALF_UP))
                .warningStatus(warningStatus)
                .isMandatory(Boolean.TRUE.equals(household.getRevenueThresholdEnabled()))
                .isMandatoryFromBeginning(isMandatoryFromBeginning)
                .shouldShowWarning(shouldShowWarning)
                .warningMessage(warningMessage)
                .legalObligationNotice(legalObligationNotice)
                .monthlyBreakdown(breakdownList)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UpdateWarningThresholdResponse updateWarningThreshold(String currentUsername, UpdateWarningThresholdRequest request) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Only store owner (VT-01) can change threshold configuration
        if (currentUser.getRole() == null || !"VT-01".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        if (request == null || request.getWarningThresholdPercentage() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        BigDecimal percentage = request.getWarningThresholdPercentage();
        if (percentage.compareTo(RevenueThresholdConstants.MIN_WARNING_PERCENTAGE) < 0
                || percentage.compareTo(RevenueThresholdConstants.MAX_WARNING_PERCENTAGE) > 0) {
            throw new AppException(ErrorCode.INVALID_WARNING_THRESHOLD_PERCENTAGE);
        }

        BusinessHouseholdSettings settings = settingsRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> BusinessHouseholdSettings.builder()
                        .household(household)
                        .autoRetryEnabled(true)
                        .maxRetryAttempts(3)
                        .retryIntervalMinutes(15)
                        .maxRetryHoursDeadline(24)
                        .maxOrderHoldingHours(4)
                        .bankTransferTimeoutMinutes(15)
                        .expenseApprovalThreshold(new BigDecimal("500000.00"))
                        .revenueWarningThresholdPercentage(RevenueThresholdConstants.DEFAULT_WARNING_PERCENTAGE)
                        .build());

        String oldValue = String.valueOf(settings.getRevenueWarningThresholdPercentage());
        settings.setRevenueWarningThresholdPercentage(percentage);
        BusinessHouseholdSettings saved = settingsRepository.save(settings);

        activityLogHelper.logActivityInNewTransaction(
                household, currentUser, RevenueThresholdConstants.ACTION_UPDATE_WARNING_THRESHOLD,
                "business_household_settings", saved.getId(), oldValue, percentage.toString(), null, null
        );

        BigDecimal warningRevenueAmount = RevenueThresholdConstants.MANDATORY_REVENUE_THRESHOLD
                .multiply(percentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        return UpdateWarningThresholdResponse.builder()
                .householdId(household.getId())
                .warningThresholdPercentage(saved.getRevenueWarningThresholdPercentage())
                .warningRevenueAmount(warningRevenueAmount)
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppNotificationResponse> getNotifications(String currentUsername, int page, int size) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // QTN-10: Sales staff does not view household-level financial notifications
        if (currentUser.getRole() != null && "VT-02".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<AppNotification> notifPage = notificationRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId(), pageable);

        List<AppNotificationResponse> content = notifPage.getContent().stream()
                .map(this::mapToNotificationResponse)
                .toList();

        return PageResponse.<AppNotificationResponse>builder()
                .pageNumber(page)
                .pageSize(size)
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .last(notifPage.isLast())
                .content(content)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        if (currentUser.getRole() != null && "VT-02".equalsIgnoreCase(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return notificationRepository.countByHouseholdIdAndIsReadFalse(household.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markNotificationAsRead(String currentUsername, String notificationId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        AppNotification notif = notificationRepository.findByIdAndHouseholdId(notificationId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!Boolean.TRUE.equals(notif.getIsRead())) {
            notif.setIsRead(true);
            notif.setReadAt(LocalDateTime.now());
            notificationRepository.save(notif);
        }
    }

    private void pushNotificationIfNotExists(
            BusinessHousehold household,
            User actorUser,
            String type,
            String severity,
            String title,
            String message,
            String actionUrl,
            int targetYear,
            BigDecimal cumulativeRevenue,
            BigDecimal thresholdPercentage,
            LocalDateTime startOfYear,
            LocalDateTime endOfYear) {
        try {
            String yearPattern = "%\"year\":" + targetYear + "%";
            boolean exists = notificationRepository.existsNotificationInYear(household.getId(), type, startOfYear, endOfYear, yearPattern);
            if (!exists) {
                String metadataJson = String.format(
                        "{\"year\":%d,\"cumulativeRevenue\":%s,\"thresholdPercentage\":%s}",
                        targetYear,
                        cumulativeRevenue != null ? cumulativeRevenue.toPlainString() : "0",
                        thresholdPercentage != null ? thresholdPercentage.toPlainString() : "0"
                );

                AppNotification notif = AppNotification.builder()
                        .household(household)
                        .user(actorUser)
                        .notificationType(type)
                        .severity(severity)
                        .title(title)
                        .message(message)
                        .actionUrl(actionUrl)
                        .metadata(metadataJson)
                        .isRead(false)
                        .build();
                notificationRepository.save(notif);
            }
        } catch (Exception e) {
            log.error("Lỗi khi lưu thông báo cảnh báo ngưỡng doanh thu: {}", e.getMessage(), e);
        }
    }

    private String buildLegalObligationNotice(boolean isExceeded, BigDecimal revenue, int year) {
        if (isExceeded) {
            return String.format(
                    "Căn cứ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC, hộ kinh doanh có doanh thu trong năm đạt từ 1 tỷ đồng trở lên bắt buộc phải chuyển sang áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền và nộp thuế theo phương pháp kê khai. Doanh thu năm %d của hộ đã đạt %s VNĐ, hệ thống đã chính thức ghi nhận hộ thuộc diện bắt buộc.",
                    year, formatCurrency(revenue)
            );
        } else {
            return String.format(
                    "Căn cứ Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC, hộ kinh doanh có doanh thu trong năm đạt từ 1 tỷ đồng trở lên bắt buộc phải áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền và nộp thuế theo phương pháp kê khai. Doanh thu năm %d của hộ hiện đã đạt %s VNĐ. Đề nghị chủ hộ kinh doanh chủ động rà soát quy trình quản lý, chuẩn bị hạ tầng kỹ thuật và các thủ tục cần thiết để sẵn sàng chuyển đổi.",
                    year, formatCurrency(revenue)
            );
        }
    }

    private AppNotificationResponse mapToNotificationResponse(AppNotification notif) {
        return AppNotificationResponse.builder()
                .id(notif.getId())
                .notificationType(notif.getNotificationType())
                .severity(notif.getSeverity())
                .title(notif.getTitle())
                .message(notif.getMessage())
                .actionUrl(notif.getActionUrl())
                .targetType(notif.getTargetType())
                .targetId(notif.getTargetId())
                .metadata(notif.getMetadata())
                .isRead(notif.getIsRead())
                .readAt(notif.getReadAt())
                .isClosed(notif.getIsClosed())
                .closedAt(notif.getClosedAt())
                .createdAt(notif.getCreatedAt())
                .build();
    }

    private static class MonthAccumulator {
        private final int month;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal taxAmount = BigDecimal.ZERO;
        private int count = 0;

        public MonthAccumulator(int month) {
            this.month = month;
        }

        public void add(BigDecimal rev, BigDecimal tax) {
            this.revenue = this.revenue.add(rev);
            this.taxAmount = this.taxAmount.add(tax);
            this.count++;
        }

        public BigDecimal getRevenue() { return revenue; }
        public BigDecimal getTaxAmount() { return taxAmount; }
        public int getCount() { return count; }
    }
}
