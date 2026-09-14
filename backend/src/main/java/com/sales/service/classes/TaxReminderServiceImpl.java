package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.TaxNotificationType;
import com.sales.dto.request.UpdateTaxReminderSettingsRequest;
import com.sales.dto.response.TaxPeriodChecklistResponse;
import com.sales.dto.response.TaxPeriodReminderResponse;
import com.sales.dto.response.TaxReminderScanResultResponse;
import com.sales.dto.response.TaxReminderSettingsResponse;
import com.sales.entity.AppNotification;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.TaxDeclarationPeriod;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.AppNotificationRepository;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.TaxDeclarationPeriodRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.TaxReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxReminderServiceImpl implements TaxReminderService {

    private final UserRepository userRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final TaxDeclarationPeriodRepository taxPeriodRepository;
    private final AppNotificationRepository notificationRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkManagementRole(User user) {
        if (user.getRole() == null || "VT-02".equalsIgnoreCase(user.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private BusinessHouseholdSettings getOrCreateSettings(BusinessHousehold household) {
        return settingsRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> settingsRepository.save(BusinessHouseholdSettings.builder()
                        .household(household)
                        .taxPeriodType("QUARTERLY")
                        .taxReminderDaysBefore(5)
                        .taxReminderEnabled(true)
                        .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public TaxReminderSettingsResponse getReminderSettings(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        checkManagementRole(user);

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        BusinessHouseholdSettings settings = getOrCreateSettings(household);

        return TaxReminderSettingsResponse.builder()
                .householdId(household.getId())
                .householdName(household.getName())
                .taxPeriodType(settings.getTaxPeriodType() != null ? settings.getTaxPeriodType() : "QUARTERLY")
                .taxReminderDaysBefore(settings.getTaxReminderDaysBefore() != null ? settings.getTaxReminderDaysBefore() : 5)
                .taxReminderEnabled(settings.getTaxReminderEnabled() != null ? settings.getTaxReminderEnabled() : true)
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxReminderSettingsResponse updateReminderSettings(String currentUsername, UpdateTaxReminderSettingsRequest request) {
        User user = getAuthenticatedUser(currentUsername);

        // RBAC: Chỉ chủ hộ kinh doanh (VT-01) mới có quyền cập nhật cấu hình nhắc nộp tờ khai
        if (user.getRole() == null || !"VT-01".equalsIgnoreCase(user.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        if (request.getTaxReminderDaysBefore() == null || request.getTaxReminderDaysBefore() < 1 || request.getTaxReminderDaysBefore() > 30) {
            throw new AppException(ErrorCode.INVALID_REMINDER_DAYS);
        }

        String periodType = request.getTaxPeriodType().trim().toUpperCase();
        if (!"MONTHLY".equals(periodType) && !"QUARTERLY".equals(periodType)) {
            throw new AppException(ErrorCode.INVALID_TAX_PERIOD_TYPE);
        }

        BusinessHouseholdSettings settings = getOrCreateSettings(household);

        Map<String, Object> oldVal = new HashMap<>();
        oldVal.put("taxPeriodType", settings.getTaxPeriodType());
        oldVal.put("taxReminderDaysBefore", settings.getTaxReminderDaysBefore());
        oldVal.put("taxReminderEnabled", settings.getTaxReminderEnabled());

        settings.setTaxPeriodType(periodType);
        settings.setTaxReminderDaysBefore(request.getTaxReminderDaysBefore());
        settings.setTaxReminderEnabled(request.getTaxReminderEnabled());

        BusinessHouseholdSettings saved = settingsRepository.save(settings);

        Map<String, Object> newVal = new HashMap<>();
        newVal.put("taxPeriodType", saved.getTaxPeriodType());
        newVal.put("taxReminderDaysBefore", saved.getTaxReminderDaysBefore());
        newVal.put("taxReminderEnabled", saved.getTaxReminderEnabled());

        try {
            activityLogHelper.logActivityInNewTransaction(
                    household, user, "UPDATE_TAX_REMINDER_SETTINGS", "business_household_settings",
                    saved.getId(), objectMapper.writeValueAsString(oldVal), objectMapper.writeValueAsString(newVal),
                    null, null);
        } catch (Exception e) {
            log.error("Lỗi khi ghi nhật ký kiểm toán cập nhật cấu hình nhắc thuế: {}", e.getMessage());
        }

        log.info("Cập nhật cấu hình nhắc lịch nộp tờ khai cho hộ {}: periodType={}, daysBefore={}, enabled={}",
                household.getId(), saved.getTaxPeriodType(), saved.getTaxReminderDaysBefore(), saved.getTaxReminderEnabled());

        return TaxReminderSettingsResponse.builder()
                .householdId(household.getId())
                .householdName(household.getName())
                .taxPeriodType(saved.getTaxPeriodType())
                .taxReminderDaysBefore(saved.getTaxReminderDaysBefore())
                .taxReminderEnabled(saved.getTaxReminderEnabled())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxPeriodReminderResponse> getActiveReminders(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        checkManagementRole(user);

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        BusinessHouseholdSettings settings = getOrCreateSettings(household);
        if (!Boolean.TRUE.equals(settings.getTaxReminderEnabled())) {
            return Collections.emptyList();
        }

        // Tiền đề: Hộ đã có ít nhất một hóa đơn bán hàng trong hệ thống
        if (!eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull(household.getId())) {
            return Collections.emptyList();
        }

        int reminderDays = settings.getTaxReminderDaysBefore() != null ? settings.getTaxReminderDaysBefore() : 5;
        LocalDate today = LocalDate.now();

        // Lấy tất cả kỳ chưa chốt
        List<TaxDeclarationPeriod> openPeriods = taxPeriodRepository.findByHouseholdIdAndStatusNot(household.getId(), "LOCKED");

        List<TaxPeriodReminderResponse> reminders = new ArrayList<>();
        for (TaxDeclarationPeriod period : openPeriods) {
            TaxPeriodReminderResponse reminder = evaluatePeriodReminder(household, period, reminderDays, today);
            reminders.add(reminder);
        }

        // Sắp xếp theo mức độ ưu tiên: DANGER (quá hạn) trước, rồi WARNING (sắp đến hạn), theo hạn nộp tăng dần
        reminders.sort((r1, r2) -> {
            if ("DANGER".equals(r1.getSeverity()) && !"DANGER".equals(r2.getSeverity())) return -1;
            if (!"DANGER".equals(r1.getSeverity()) && "DANGER".equals(r2.getSeverity())) return 1;
            return r1.getFilingDeadline().compareTo(r2.getFilingDeadline());
        });

        return reminders;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxReminderScanResultResponse triggerScanReminders(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        checkManagementRole(user);

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        BusinessHouseholdSettings settings = getOrCreateSettings(household);
        int created = processRemindersForHousehold(household, LocalDate.now(), settings);
        List<TaxPeriodReminderResponse> activeReminders = getActiveReminders(currentUsername);

        return TaxReminderScanResultResponse.builder()
                .householdsScanned(1)
                .notificationsCreated(created)
                .notificationsUpdated(0)
                .notificationsClosed(0)
                .activeReminders(activeReminders)
                .build();
    }

    @Override
    public void scanAndGenerateTaxReminders() {
        scanAndGenerateTaxReminders(LocalDate.now());
    }

    @Override
    public void scanAndGenerateTaxReminders(LocalDate today) {
        log.info("Bắt đầu job quét nhắc lịch nộp tờ khai thuế ngày {}", today);
        // Tải trước household cùng settings qua @EntityGraph để tránh N+1 queries
        List<BusinessHouseholdSettings> allSettings = settingsRepository.findByTaxReminderEnabledTrue();

        int totalCreated = 0;
        int totalHouseholds = 0;

        for (BusinessHouseholdSettings settings : allSettings) {
            BusinessHousehold household = settings.getHousehold();
            if (household == null) continue;

            try {
                // Tách transaction theo từng hộ để tránh lỗi một hộ làm rollback cả batch job
                totalCreated += processRemindersForHousehold(household, today, settings);
                totalHouseholds++;
            } catch (Exception e) {
                log.error("Lỗi khi xử lý nhắc lịch thuế cho hộ ID={}: {}", household.getId(), e.getMessage(), e);
            }
        }

        log.info("Hoàn tất job quét nhắc lịch nộp tờ khai: đã quét {} hộ, tạo mới/cập nhật {} thông báo.",
                totalHouseholds, totalCreated);
    }

    private int processRemindersForHousehold(BusinessHousehold household) {
        return processRemindersForHousehold(household, LocalDate.now(), null);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public int processRemindersForHousehold(BusinessHousehold household, LocalDate today, BusinessHouseholdSettings settings) {
        // Tiền đề: Hộ đã phát sinh hóa đơn trong hệ thống
        if (!eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull(household.getId())) {
            return 0;
        }

        if (settings == null) {
            settings = getOrCreateSettings(household);
        }
        if (!Boolean.TRUE.equals(settings.getTaxReminderEnabled())) {
            return 0;
        }

        int reminderDays = settings.getTaxReminderDaysBefore() != null ? settings.getTaxReminderDaysBefore() : 5;

        // Tối ưu N+1: Truy vấn tất cả kỳ của hộ 1 lần duy nhất
        List<TaxDeclarationPeriod> allPeriods = taxPeriodRepository.findByHouseholdIdOrderByYearDescPeriodNumberDesc(household.getId());

        // Tối ưu N+1: Tải trước toàn bộ thông báo TAX_PERIOD chưa đóng của hộ
        List<AppNotification> unclosedNotifs = notificationRepository
                .findByHouseholdIdAndTargetTypeAndIsClosedFalse(household.getId(), "TAX_PERIOD");
        Map<String, List<AppNotification>> notifsByTargetId = unclosedNotifs.stream()
                .filter(n -> n.getTargetId() != null)
                .collect(java.util.stream.Collectors.groupingBy(AppNotification::getTargetId));

        // 1. Tự động đóng nhắc việc cho các kỳ đã chốt (AC-02) theo lô (batch update)
        LocalDateTime now = LocalDateTime.now();
        List<AppNotification> toClose = new ArrayList<>();
        for (TaxDeclarationPeriod period : allPeriods) {
            if ("LOCKED".equalsIgnoreCase(period.getStatus())) {
                List<AppNotification> notifs = notifsByTargetId.get(period.getId());
                if (notifs != null) {
                    for (AppNotification notif : notifs) {
                        if (!Boolean.TRUE.equals(notif.getIsClosed())) {
                            notif.setIsClosed(true);
                            notif.setIsRead(true);
                            notif.setClosedAt(now);
                            toClose.add(notif);
                        }
                    }
                }
            }
        }
        if (!toClose.isEmpty()) {
            notificationRepository.saveAll(toClose);
            log.info("Đã tự động đóng {} thông báo nhắc nộp tờ khai của các kỳ đã chốt cho hộ {}", toClose.size(), household.getId());
        }

        // 2. Kiểm tra các kỳ chưa chốt để sinh/cập nhật nhắc việc (AC-01 & AC-03)
        List<TaxDeclarationPeriod> openPeriods = new ArrayList<>(allPeriods.stream()
                .filter(p -> !"LOCKED".equalsIgnoreCase(p.getStatus()))
                .toList());

        // 3. Tự động phát hiện kỳ vừa kết thúc nhưng chưa từng được bấm "Lập bảng kê" (missing period detection)
        detectAndAddCompletedPeriodIfMissing(household, settings.getTaxPeriodType(), today, allPeriods, openPeriods);

        int count = 0;
        for (TaxDeclarationPeriod period : openPeriods) {
            LocalDate deadline = calculateTaxFilingDeadline(period.getPeriodType(), period.getYear(), period.getPeriodNumber());
            long daysRemaining = ChronoUnit.DAYS.between(today, deadline);

            boolean isOverdue = daysRemaining < 0;
            boolean isApproaching = daysRemaining >= 0 && daysRemaining <= reminderDays;

            if (isOverdue) {
                // AC-03: Quá hạn nộp mà chưa chốt -> Mức độ DANGER, giữ trong danh sách
                createOrUpdateOverdueNotification(household, period, deadline, Math.abs(daysRemaining));
                count++;
            } else if (isApproaching) {
                // AC-01: Đến mốc nhắc trước hạn -> Mức độ WARNING
                createOrUpdateReminderNotification(household, period, deadline, daysRemaining);
                count++;
            }
        }

        return count;
    }

    private void detectAndAddCompletedPeriodIfMissing(
            BusinessHousehold household,
            String periodType,
            LocalDate today,
            List<TaxDeclarationPeriod> allPeriods,
            List<TaxDeclarationPeriod> openPeriods) {

        if (periodType == null) periodType = "QUARTERLY";
        int targetYear = today.getYear();
        int targetPeriodNumber;
        LocalDate startDate;
        LocalDate endDate;
        String periodName;

        if ("QUARTERLY".equalsIgnoreCase(periodType)) {
            int currentMonth = today.getMonthValue();
            if (currentMonth <= 3) {
                // Đang ở Quý 1 -> Kỳ vừa xong là Quý 4 năm trước
                targetYear = today.getYear() - 1;
                targetPeriodNumber = 4;
                startDate = LocalDate.of(targetYear, 10, 1);
                endDate = LocalDate.of(targetYear, 12, 31);
            } else if (currentMonth <= 6) {
                // Đang ở Quý 2 -> Kỳ vừa xong là Quý 1
                targetPeriodNumber = 1;
                startDate = LocalDate.of(targetYear, 1, 1);
                endDate = LocalDate.of(targetYear, 3, 31);
            } else if (currentMonth <= 9) {
                // Đang ở Quý 3 -> Kỳ vừa xong là Quý 2
                targetPeriodNumber = 2;
                startDate = LocalDate.of(targetYear, 4, 1);
                endDate = LocalDate.of(targetYear, 6, 30);
            } else {
                // Đang ở Quý 4 -> Kỳ vừa xong là Quý 3
                targetPeriodNumber = 3;
                startDate = LocalDate.of(targetYear, 7, 1);
                endDate = LocalDate.of(targetYear, 9, 30);
            }
            periodName = String.format("Bảng kê hóa đơn bán ra Quý %d năm %d", targetPeriodNumber, targetYear);
        } else {
            // MONTHLY
            int prevMonth = today.getMonthValue() - 1;
            if (prevMonth < 1) {
                prevMonth = 12;
                targetYear = today.getYear() - 1;
            }
            targetPeriodNumber = prevMonth;
            startDate = LocalDate.of(targetYear, targetPeriodNumber, 1);
            endDate = startDate.plusMonths(1).minusDays(1);
            periodName = String.format("Bảng kê hóa đơn bán ra Tháng %d năm %d", targetPeriodNumber, targetYear);
        }

        final int finalTargetYear = targetYear;
        final int finalTargetPeriodNumber = targetPeriodNumber;
        final String finalPeriodType = periodType;

        boolean alreadyExists = allPeriods.stream().anyMatch(p ->
                finalPeriodType.equalsIgnoreCase(p.getPeriodType()) &&
                p.getYear() != null && p.getYear() == finalTargetYear &&
                p.getPeriodNumber() != null && p.getPeriodNumber() == finalTargetPeriodNumber
        );

        if (!alreadyExists) {
            // Tạo kỳ ảo biểu diễn kỳ vừa xong nhưng chưa từng bấm tạo bảng kê
            TaxDeclarationPeriod virtualPeriod = TaxDeclarationPeriod.builder()
                    .id("PENDING_" + finalPeriodType + "_" + finalTargetYear + "_" + finalTargetPeriodNumber)
                    .household(household)
                    .periodName(periodName)
                    .periodType(finalPeriodType)
                    .year(finalTargetYear)
                    .periodNumber(finalTargetPeriodNumber)
                    .startDate(startDate)
                    .endDate(endDate)
                    .status("DRAFT")
                    .totalValidInvoices(0)
                    .totalPurchaseReceipts(0)
                    .declarationExported(false)
                    .build();
            openPeriods.add(virtualPeriod);
        }
    }

    private void createOrUpdateReminderNotification(
            BusinessHousehold household,
            TaxDeclarationPeriod period,
            LocalDate deadline,
            long daysRemaining) {

        String notifType = TaxNotificationType.TAX_DECLARATION_REMINDER;
        String deadlineStr = deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        String title = String.format("Nhắc lịch nộp tờ khai %s (Còn %d ngày)", period.getPeriodName(), daysRemaining);
        String message = String.format("Hạn nộp tờ khai thuế là ngày %s. Vui lòng hoàn thành lập bảng kê, xuất tờ khai và chốt kỳ đúng hạn để không bị phạt vi phạm hành chính.",
                deadlineStr);
        String actionUrl = "/reports/tax-declaration?periodId=" + period.getId();

        TaxPeriodChecklistResponse checklist = buildChecklist(period);
        String metadataJson;
        try {
            Map<String, Object> metaMap = new HashMap<>();
            metaMap.put("periodId", period.getId());
            metaMap.put("periodName", period.getPeriodName());
            metaMap.put("periodType", period.getPeriodType());
            metaMap.put("year", period.getYear());
            metaMap.put("periodNumber", period.getPeriodNumber());
            metaMap.put("filingDeadline", deadline.toString());
            metaMap.put("daysRemaining", daysRemaining);
            metaMap.put("isOverdue", false);
            metaMap.put("checklist", checklist);
            metadataJson = objectMapper.writeValueAsString(metaMap);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        Optional<AppNotification> existing = notificationRepository
                .findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
                        household.getId(), "TAX_PERIOD", period.getId(), notifType);

        if (existing.isPresent()) {
            AppNotification notif = existing.get();
            notif.setTitle(title);
            notif.setMessage(message);
            notif.setMetadata(metadataJson);
            notificationRepository.save(notif);
        } else {
            AppNotification newNotif = AppNotification.builder()
                    .household(household)
                    .targetType("TAX_PERIOD")
                    .targetId(period.getId())
                    .notificationType(notifType)
                    .severity("WARNING")
                    .title(title)
                    .message(message)
                    .actionUrl(actionUrl)
                    .metadata(metadataJson)
                    .isRead(false)
                    .isClosed(false)
                    .build();
            notificationRepository.save(newNotif);
        }
    }

    private void createOrUpdateOverdueNotification(
            BusinessHousehold household,
            TaxDeclarationPeriod period,
            LocalDate deadline,
            long overdueDays) {

        String notifType = TaxNotificationType.TAX_DECLARATION_OVERDUE;
        String deadlineStr = deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        String title = String.format("CẢNH BÁO: Quá hạn nộp tờ khai %s (%d ngày)", period.getPeriodName(), overdueDays);
        String message = String.format("Kỳ thuế đã quá hạn nộp từ ngày %s (quá hạn %d ngày). Hộ kinh doanh cần khẩn trương kiểm tra bảng kê, xuất tờ khai và chốt kỳ để nộp thuế tránh bị phạt vi phạm hành chính.",
                deadlineStr, overdueDays);
        String actionUrl = "/reports/tax-declaration?periodId=" + period.getId();

        TaxPeriodChecklistResponse checklist = buildChecklist(period);
        String metadataJson;
        try {
            Map<String, Object> metaMap = new HashMap<>();
            metaMap.put("periodId", period.getId());
            metaMap.put("periodName", period.getPeriodName());
            metaMap.put("periodType", period.getPeriodType());
            metaMap.put("year", period.getYear());
            metaMap.put("periodNumber", period.getPeriodNumber());
            metaMap.put("filingDeadline", deadline.toString());
            metaMap.put("overdueDays", overdueDays);
            metaMap.put("isOverdue", true);
            metaMap.put("checklist", checklist);
            metadataJson = objectMapper.writeValueAsString(metaMap);
        } catch (Exception e) {
            metadataJson = "{}";
        }

        Optional<AppNotification> existing = notificationRepository
                .findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
                        household.getId(), "TAX_PERIOD", period.getId(), notifType);

        if (existing.isPresent()) {
            AppNotification notif = existing.get();
            notif.setTitle(title);
            notif.setMessage(message);
            notif.setSeverity("DANGER");
            notif.setMetadata(metadataJson);
            notificationRepository.save(notif);
        } else {
            // Đóng thông báo nhắc trước hạn nếu còn mở, để thay bằng thông báo quá hạn
            closePreDueRemindersForPeriod(household, period.getId());

            AppNotification newNotif = AppNotification.builder()
                    .household(household)
                    .targetType("TAX_PERIOD")
                    .targetId(period.getId())
                    .notificationType(notifType)
                    .severity("DANGER")
                    .title(title)
                    .message(message)
                    .actionUrl(actionUrl)
                    .metadata(metadataJson)
                    .isRead(false)
                    .isClosed(false)
                    .build();
            notificationRepository.save(newNotif);
        }
    }

    private void closePreDueRemindersForPeriod(BusinessHousehold household, String periodId) {
        Optional<AppNotification> preDue = notificationRepository
                .findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
                        household.getId(), "TAX_PERIOD", periodId, TaxNotificationType.TAX_DECLARATION_REMINDER);
        if (preDue.isPresent()) {
            AppNotification notif = preDue.get();
            notif.setIsClosed(true);
            notif.setClosedAt(LocalDateTime.now());
            notificationRepository.save(notif);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeRemindersForPeriod(BusinessHousehold household, String periodId) {
        List<AppNotification> unclosedNotifications = notificationRepository
                .findByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(
                        household.getId(), "TAX_PERIOD", periodId);

        if (!unclosedNotifications.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            for (AppNotification notif : unclosedNotifications) {
                notif.setIsClosed(true);
                notif.setIsRead(true);
                notif.setClosedAt(now);
            }
            notificationRepository.saveAll(unclosedNotifications);
            log.info("Đã tự động đóng {} thông báo nhắc nộp tờ khai cho kỳ ID={}", unclosedNotifications.size(), periodId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markDeclarationAsExported(String periodId) {
        taxPeriodRepository.findById(periodId).ifPresent(period -> {
            period.setDeclarationExported(true);
            period.setDeclarationExportedAt(LocalDateTime.now());
            taxPeriodRepository.save(period);
            log.info("Đã đánh dấu xuất tờ khai cho kỳ ID={}", periodId);

            // Cập nhật ngay metadata của thông báo nhắc nhở đang mở (nếu có)
            if (period.getHousehold() != null) {
                List<AppNotification> notifs = notificationRepository
                        .findByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(
                                period.getHousehold().getId(), "TAX_PERIOD", periodId);
                if (!notifs.isEmpty()) {
                    TaxPeriodChecklistResponse checklist = buildChecklist(period);
                    for (AppNotification notif : notifs) {
                        try {
                            Map<String, Object> metaMap;
                            if (notif.getMetadata() != null && !notif.getMetadata().isEmpty()) {
                                metaMap = objectMapper.readValue(notif.getMetadata(), Map.class);
                            } else {
                                metaMap = new HashMap<>();
                            }
                            metaMap.put("checklist", checklist);
                            notif.setMetadata(objectMapper.writeValueAsString(metaMap));
                        } catch (Exception e) {
                            log.warn("Không thể cập nhật metadata thông báo sau khi xuất tờ khai: {}", e.getMessage());
                        }
                    }
                    notificationRepository.saveAll(notifs);
                }
            }
        });
    }

    @Override
    public LocalDate calculateTaxFilingDeadline(String periodType, int year, int periodNumber) {
        if ("MONTHLY".equalsIgnoreCase(periodType)) {
            if (periodNumber < 1 || periodNumber > 12) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            int nextMonth = periodNumber + 1;
            int nextYear = year;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear = year + 1;
            }
            return LocalDate.of(nextYear, nextMonth, 20);
        } else if ("QUARTERLY".equalsIgnoreCase(periodType)) {
            return switch (periodNumber) {
                case 1 -> LocalDate.of(year, 4, 30);
                case 2 -> LocalDate.of(year, 7, 31);
                case 3 -> LocalDate.of(year, 10, 31);
                case 4 -> LocalDate.of(year + 1, 1, 31);
                default -> throw new AppException(ErrorCode.INVALID_INPUT);
            };
        } else {
            throw new AppException(ErrorCode.INVALID_TAX_PERIOD_TYPE);
        }
    }

    private TaxPeriodChecklistResponse buildChecklist(TaxDeclarationPeriod period) {
        boolean salesGen = !"DRAFT".equalsIgnoreCase(period.getStatus()) || (period.getTotalValidInvoices() != null && period.getTotalValidInvoices() > 0);
        boolean purchaseGen = period.getTotalPurchaseReceipts() != null && period.getTotalPurchaseReceipts() > 0;
        boolean declExported = Boolean.TRUE.equals(period.getDeclarationExported());
        boolean isLocked = "LOCKED".equalsIgnoreCase(period.getStatus());

        return TaxPeriodChecklistResponse.builder()
                .salesRegisterGenerated(salesGen)
                .salesRegisterUrl("/reports/tax-sales-invoices?periodId=" + period.getId())
                .purchaseRegisterGenerated(purchaseGen)
                .purchaseRegisterUrl("/reports/tax-declaration?tab=purchase-register&periodId=" + period.getId())
                .declarationExported(declExported)
                .declarationExportUrl("/reports/tax-declaration?tab=declaration&periodId=" + period.getId())
                .periodLocked(isLocked)
                .periodLockUrl("/reports/tax-declaration")
                .build();
    }

    private TaxPeriodReminderResponse evaluatePeriodReminder(
            BusinessHousehold household,
            TaxDeclarationPeriod period,
            int reminderDaysBefore,
            LocalDate today) {

        LocalDate deadline = calculateTaxFilingDeadline(period.getPeriodType(), period.getYear(), period.getPeriodNumber());
        long daysRemaining = ChronoUnit.DAYS.between(today, deadline);
        boolean isOverdue = daysRemaining < 0;
        boolean isLocked = "LOCKED".equalsIgnoreCase(period.getStatus());

        String severity;
        if (isLocked) {
            severity = "INFO";
        } else if (isOverdue) {
            severity = "DANGER";
        } else if (daysRemaining <= reminderDaysBefore) {
            severity = "WARNING";
        } else {
            severity = "INFO";
        }

        TaxPeriodChecklistResponse checklist = buildChecklist(period);

        String title;
        String message;
        if (isLocked) {
            title = String.format("Kỳ thuế %s đã hoàn tất chốt sổ", period.getPeriodName());
            message = "Kỳ kê khai đã được chốt và khóa số liệu an toàn theo quy định.";
        } else if (isOverdue) {
            long overdueDays = Math.abs(daysRemaining);
            title = String.format("CẢNH BÁO: Quá hạn nộp tờ khai %s (%d ngày)", period.getPeriodName(), overdueDays);
            message = String.format("Kỳ thuế đã quá hạn nộp từ ngày %s. Hộ kinh doanh cần khẩn trương kiểm tra bảng kê, xuất tờ khai và chốt kỳ để nộp thuế tránh bị phạt vi phạm hành chính.",
                    deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        } else {
            title = String.format("Nhắc lịch nộp tờ khai %s (Còn %d ngày)", period.getPeriodName(), daysRemaining);
            message = String.format("Hạn nộp tờ khai thuế là ngày %s. Vui lòng hoàn thành các bước lập bảng kê, xuất tờ khai và chốt kỳ đúng hạn.",
                    deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }

        return TaxPeriodReminderResponse.builder()
                .periodId(period.getId())
                .periodName(period.getPeriodName())
                .periodType(period.getPeriodType())
                .year(period.getYear())
                .periodNumber(period.getPeriodNumber())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .filingDeadline(deadline)
                .daysRemaining(daysRemaining)
                .isOverdue(isOverdue)
                .severity(severity)
                .status(period.getStatus())
                .isClosed(isLocked)
                .checklist(checklist)
                .title(title)
                .message(message)
                .actionUrl("/reports/tax-declaration?periodId=" + period.getId())
                .createdAt(period.getCreatedAt())
                .build();
    }
}
