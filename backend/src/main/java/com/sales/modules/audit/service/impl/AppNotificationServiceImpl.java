package com.sales.modules.audit.service.impl;
import com.sales.modules.audit.entity.AppNotification;
import com.sales.modules.audit.entity.UserNotificationSetting;
import com.sales.modules.audit.repository.AppNotificationRepository;
import com.sales.modules.audit.repository.UserNotificationSettingRepository;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.entity.CustomerDebt;
import com.sales.modules.customer.repository.CustomerDebtRepository;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.common.constant.NotificationTypeConstant;
import com.sales.modules.audit.dto.request.BatchUpdateNotificationSettingsRequest;
import com.sales.modules.audit.dto.request.CreateNotificationRequest;
import com.sales.modules.audit.dto.request.NotificationFilterRequest;
import com.sales.modules.audit.dto.request.UpdateNotificationSettingRequest;
import com.sales.modules.audit.dto.response.AppNotificationResponse;
import com.sales.modules.audit.dto.response.NotificationBadgeCountResponse;
import com.sales.modules.audit.dto.response.NotificationSettingItemResponse;
import com.sales.common.dto.PageResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.service.AppNotificationService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppNotificationServiceImpl implements AppNotificationService {

    private final AppNotificationRepository notificationRepository;
    private final UserNotificationSettingRepository settingRepository;
    private final UserRepository userRepository;
    private final BusinessHouseholdRepository householdRepository;
    private final EInvoiceRepository invoiceRepository;
    private final CustomerDebtRepository customerDebtRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppNotificationResponse> getNotifications(
            String currentUsername, NotificationFilterRequest filter, int page, int size) {

        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        NotificationFilterRequest effectiveFilter = filter != null ? filter : new NotificationFilterRequest();
        String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : "";
        boolean isCashier = "VT-02".equalsIgnoreCase(roleCode);

        // QTN-10: Nhân viên bán hàng chỉ được xem loại tác nghiệp cho phép
        if (isCashier && effectiveFilter.getNotificationType() != null) {
            if (NotificationTypeConstant.FINANCIAL_AND_ADMIN_TYPES.contains(effectiveFilter.getNotificationType())) {
                throw new AppException(ErrorCode.NOTIFICATION_ACCESS_DENIED);
            }
        }

        Set<String> disabledTypes = isCashier
                ? Collections.emptySet()
                : settingRepository.findDisabledTypesByUserId(currentUser.getId());

        Specification<AppNotification> spec = buildSpecification(currentUser, effectiveFilter, disabledTypes);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AppNotification> notifPage = notificationRepository.findAll(spec, pageable);
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
    public NotificationBadgeCountResponse getBadgeCount(String currentUsername) {
        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        LocalDateTime threshold30Days = LocalDateTime.now().minusDays(30);
        String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : "";
        boolean isCashier = "VT-02".equalsIgnoreCase(roleCode);

        long unreadCount;
        long unclosedCount;
        long dangerCount;
        long warningCount;

        if (isCashier) {
            Collection<String> allowedTypes = NotificationTypeConstant.CASHIER_ALLOWED_TYPES;
            unreadCount = notificationRepository.countCashierUnread(
                    household.getId(), currentUser.getId(), allowedTypes, threshold30Days);
            unclosedCount = notificationRepository.countCashierUnclosed(
                    household.getId(), currentUser.getId(), allowedTypes, threshold30Days);
            dangerCount = notificationRepository.countCashierBySeverity(
                    household.getId(), currentUser.getId(), allowedTypes, "DANGER", threshold30Days);
            warningCount = notificationRepository.countCashierBySeverity(
                    household.getId(), currentUser.getId(), allowedTypes, "WARNING", threshold30Days);
        } else {
            Set<String> disabledTypes = settingRepository.findDisabledTypesByUserId(currentUser.getId());
            int disabledCount = disabledTypes.size();
            unreadCount = notificationRepository.countHouseholdUnread(
                    household.getId(), disabledTypes, disabledCount, threshold30Days);
            unclosedCount = notificationRepository.countHouseholdUnclosed(
                    household.getId(), disabledTypes, disabledCount, threshold30Days);
            dangerCount = notificationRepository.countHouseholdBySeverity(
                    household.getId(), disabledTypes, disabledCount, "DANGER", threshold30Days);
            warningCount = notificationRepository.countHouseholdBySeverity(
                    household.getId(), disabledTypes, disabledCount, "WARNING", threshold30Days);
        }

        return NotificationBadgeCountResponse.builder()
                .unreadCount(unreadCount)
                .unclosedCount(unclosedCount)
                .dangerCount(dangerCount)
                .warningCount(warningCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(String currentUsername) {
        return getBadgeCount(currentUsername).getUnreadCount();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markNotificationAsRead(String currentUsername, String notificationId) {
        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        AppNotification notif = notificationRepository.findByIdAndHouseholdId(notificationId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        // Kiểm tra phân quyền xem cho NV bán hàng (QTN-10)
        String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : "";
        if ("VT-02".equalsIgnoreCase(roleCode)) {
            if (NotificationTypeConstant.FINANCIAL_AND_ADMIN_TYPES.contains(notif.getNotificationType())) {
                throw new AppException(ErrorCode.NOTIFICATION_ACCESS_DENIED);
            }
        }

        if (!Boolean.TRUE.equals(notif.getIsRead())) {
            notif.setIsRead(true);
            notif.setReadAt(LocalDateTime.now());
            notificationRepository.save(notif);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int markAllAsRead(String currentUsername) {
        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        LocalDateTime threshold30Days = LocalDateTime.now().minusDays(30);
        String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : "";
        boolean isCashier = "VT-02".equalsIgnoreCase(roleCode);

        List<AppNotification> unreadList = notificationRepository
                .findByHouseholdIdAndIsReadFalseAndIsClosedFalseAndCreatedAtGreaterThanEqual(
                        household.getId(), threshold30Days);

        LocalDateTime now = LocalDateTime.now();
        List<AppNotification> toUpdate = new ArrayList<>();

        for (AppNotification notif : unreadList) {
            if (isCashier) {
                // Chỉ mark as read những thông báo cashier được phép xem
                if (NotificationTypeConstant.CASHIER_ALLOWED_TYPES.contains(notif.getNotificationType())) {
                    if (notif.getUser() == null || notif.getUser().getId().equals(currentUser.getId())) {
                        notif.setIsRead(true);
                        notif.setReadAt(now);
                        toUpdate.add(notif);
                    }
                }
            } else {
                notif.setIsRead(true);
                notif.setReadAt(now);
                toUpdate.add(notif);
            }
        }

        if (!toUpdate.isEmpty()) {
            notificationRepository.saveAll(toUpdate);
        }
        return toUpdate.size();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationSettingItemResponse> getNotificationSettings(String currentUsername) {
        User currentUser = validateAndGetUser(currentUsername);
        Set<String> disabledTypes = settingRepository.findDisabledTypesByUserId(currentUser.getId());

        List<NotificationSettingItemResponse> result = new ArrayList<>();
        for (NotificationConfigItem item : PREDEFINED_SETTINGS) {
            boolean isEnabled = !disabledTypes.contains(item.type);
            result.add(NotificationSettingItemResponse.builder()
                    .notificationType(item.type)
                    .title(item.title)
                    .description(item.description)
                    .category(item.category)
                    .isEnabled(isEnabled)
                    .isMandatory(item.isMandatory)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateNotificationSetting(String currentUsername, UpdateNotificationSettingRequest request) {
        if (request == null || request.getNotificationType() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        User currentUser = validateAndGetUser(currentUsername);

        // Không cho phép tắt loại thông báo bắt buộc
        if (Boolean.FALSE.equals(request.getIsEnabled()) &&
                NotificationTypeConstant.MANDATORY_NOTIFICATION_TYPES.contains(request.getNotificationType())) {
            throw new AppException(ErrorCode.CANNOT_DISABLE_MANDATORY_NOTIFICATION);
        }

        // Kiểm tra loại thông báo có được hỗ trợ
        boolean isSupported = PREDEFINED_SETTINGS.stream()
                .anyMatch(item -> item.type.equalsIgnoreCase(request.getNotificationType()));
        if (!isSupported) {
            throw new AppException(ErrorCode.INVALID_NOTIFICATION_TYPE);
        }

        Optional<UserNotificationSetting> existingOpt = settingRepository
                .findByUserIdAndNotificationType(currentUser.getId(), request.getNotificationType());

        if (existingOpt.isPresent()) {
            UserNotificationSetting setting = existingOpt.get();
            setting.setIsEnabled(request.getIsEnabled());
            settingRepository.save(setting);
        } else {
            UserNotificationSetting newSetting = UserNotificationSetting.builder()
                    .user(currentUser)
                    .notificationType(request.getNotificationType())
                    .isEnabled(request.getIsEnabled())
                    .build();
            settingRepository.save(newSetting);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateNotificationSettingsBatch(String currentUsername, BatchUpdateNotificationSettingsRequest request) {
        if (request == null || request.getSettings() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        for (UpdateNotificationSettingRequest single : request.getSettings()) {
            updateNotificationSetting(currentUsername, single);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AppNotificationResponse createNotification(String householdId, CreateNotificationRequest request) {
        if (request == null || request.getNotificationType() == null || request.getTitle() == null || request.getMessage() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        BusinessHousehold household = householdRepository.findById(householdId)
                .orElseThrow(() -> new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND));

        User targetUser = null;
        if (request.getTargetUserId() != null) {
            targetUser = userRepository.findById(request.getTargetUserId()).orElse(null);
        }

        String severity = request.getSeverity() != null ? request.getSeverity().toUpperCase() : "WARNING";
        if (!List.of("INFO", "WARNING", "DANGER").contains(severity)) {
            throw new AppException(ErrorCode.INVALID_NOTIFICATION_SEVERITY);
        }

        AppNotification notif = AppNotification.builder()
                .household(household)
                .user(targetUser)
                .notificationType(request.getNotificationType())
                .severity(severity)
                .title(request.getTitle())
                .message(request.getMessage())
                .actionUrl(request.getActionUrl())
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .metadata(request.getMetadata())
                .isRead(false)
                .isClosed(false)
                .build();

        AppNotification saved = notificationRepository.save(notif);
        return mapToNotificationResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeNotificationsByTarget(String targetType, String targetId) {
        if (targetType == null || targetId == null) {
            return;
        }

        List<AppNotification> activeNotifs = notificationRepository
                .findByTargetTypeAndTargetIdAndIsClosedFalse(targetType, targetId);

        if (activeNotifs.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (AppNotification notif : activeNotifs) {
            notif.setIsClosed(true);
            notif.setClosedAt(now);
            notif.setIsRead(true);
            if (notif.getReadAt() == null) {
                notif.setReadAt(now);
            }
        }

        notificationRepository.saveAll(activeNotifs);
        log.info("Đã tự động đóng {} thông báo cho targetType={}, targetId={}", activeNotifs.size(), targetType, targetId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeNotificationsByTargetIds(String targetType, Collection<String> targetIds) {
        if (targetType == null || targetIds == null || targetIds.isEmpty()) {
            return;
        }

        List<AppNotification> activeNotifs = notificationRepository
                .findByTargetTypeAndTargetIdInAndIsClosedFalse(targetType, targetIds);

        if (activeNotifs.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (AppNotification notif : activeNotifs) {
            notif.setIsClosed(true);
            notif.setClosedAt(now);
            notif.setIsRead(true);
            if (notif.getReadAt() == null) {
                notif.setReadAt(now);
            }
        }

        notificationRepository.saveAll(activeNotifs);
        log.info("Đã tự động đóng {} thông báo cho targetType={}, count={}", activeNotifs.size(), targetType, targetIds.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int syncReminders(String currentUsername) {
        User currentUser = validateAndGetUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        List<AppNotification> newNotifications = new ArrayList<>();

        // 1. Quét hóa đơn SEND_ERROR chưa có thông báo đang mở (TC-01) - Tối ưu batching không gọi N+1
        List<EInvoice> errorInvoices = invoiceRepository
                .findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "SEND_ERROR");

        if (!errorInvoices.isEmpty()) {
            List<AppNotification> openInvoiceNotifs = notificationRepository
                    .findByHouseholdIdAndTargetTypeAndIsClosedFalse(household.getId(), "INVOICE");
            Set<String> openInvoiceIds = new HashSet<>();
            for (AppNotification n : openInvoiceNotifs) {
                if (n.getTargetId() != null) {
                    openInvoiceIds.add(n.getTargetId());
                }
            }

            for (EInvoice inv : errorInvoices) {
                if (!openInvoiceIds.contains(inv.getId())) {
                    String invLabel = inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : inv.getLookupCode();
                    String errDetail = inv.getTaxAuthorityResponse() != null ? inv.getTaxAuthorityResponse() : "Lỗi kết nối cơ quan thuế";
                    AppNotification notif = AppNotification.builder()
                            .household(household)
                            .user(inv.getCreatedByUser())
                            .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                            .severity("DANGER")
                            .title("Cảnh báo: Hóa đơn " + invLabel + " bị lỗi gửi cơ quan thuế")
                            .message("Hóa đơn điện tử gửi cơ quan thuế không thành công. Chi tiết lỗi: " + errDetail + ". Vui lòng kiểm tra và gửi lại.")
                            .actionUrl("/e-invoices?id=" + inv.getId())
                            .targetType("INVOICE")
                            .targetId(inv.getId())
                            .isRead(false)
                            .isClosed(false)
                            .build();
                    newNotifications.add(notif);
                    openInvoiceIds.add(inv.getId());
                }
            }
        }

        // 2. Quét công nợ đến hạn & quá hạn (QTN-14 & TC-01) - Tối ưu batching không gọi N+1
        LocalDateTime today = LocalDateTime.now();
        List<CustomerDebt> debts = customerDebtRepository.findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(
                household.getId(), List.of("PENDING", "OVERDUE"), "DEBT_CREATED");

        if (!debts.isEmpty()) {
            List<AppNotification> openDebtNotifs = notificationRepository
                    .findByHouseholdIdAndTargetTypeAndIsClosedFalse(household.getId(), "CUSTOMER_DEBT");
            Set<String> openDebtKeys = new HashSet<>();
            for (AppNotification n : openDebtNotifs) {
                if (n.getTargetId() != null && n.getNotificationType() != null) {
                    openDebtKeys.add(n.getTargetId() + "#" + n.getNotificationType());
                }
            }

            Set<String> debtIdsToClose = new HashSet<>();

            for (CustomerDebt debt : debts) {
                // Kiểm tra nếu khách hàng đã hết nợ (currentDebt <= 0) hoặc khoản nợ đã thanh toán xong (remainingAmount <= 0)
                boolean isCustomerDebtZero = debt.getCustomer() != null && debt.getCustomer().getCurrentDebt() != null
                        && debt.getCustomer().getCurrentDebt().compareTo(BigDecimal.ZERO) <= 0;
                boolean isDebtAmountZero = debt.getRemainingAmount() != null
                        && debt.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0;

                if (isCustomerDebtZero || isDebtAmountZero) {
                    debtIdsToClose.add(debt.getId());
                    continue;
                }

                if (debt.getDueDate() != null && debt.getDueDate().isBefore(today.plusDays(3))) {
                    boolean isOverdue = debt.getDueDate().isBefore(today);
                    String notifType = isOverdue ? NotificationTypeConstant.DEBT_OVERDUE : NotificationTypeConstant.DEBT_DUE;
                    String severity = isOverdue ? "DANGER" : "WARNING";
                    String debtKey = debt.getId() + "#" + notifType;

                    if (!openDebtKeys.contains(debtKey)) {
                        String customerName = debt.getCustomer() != null ? debt.getCustomer().getName() : "Khách hàng";
                        String title = (isOverdue ? "Quá hạn thu nợ: " : "Đến hạn thu nợ: ") + customerName;
                        BigDecimal displayAmount = debt.getRemainingAmount() != null ? debt.getRemainingAmount() : debt.getAmount();
                        String message = String.format("Khoản nợ giá trị %s VNĐ của khách hàng %s hạn thanh toán vào ngày %s. Vui lòng đôn đốc thu hồi.",
                                formatCurrency(displayAmount), customerName, debt.getDueDate().toLocalDate());

                        AppNotification notif = AppNotification.builder()
                                .household(household)
                                .user(null)
                                .notificationType(notifType)
                                .severity(severity)
                                .title(title)
                                .message(message)
                                .actionUrl("/debts?customerId=" + (debt.getCustomer() != null ? debt.getCustomer().getId() : ""))
                                .targetType("CUSTOMER_DEBT")
                                .targetId(debt.getId())
                                .isRead(false)
                                .isClosed(false)
                                .build();
                        newNotifications.add(notif);
                        openDebtKeys.add(debtKey);
                    }
                }
            }

            if (!debtIdsToClose.isEmpty()) {
                closeNotificationsByTargetIds("CUSTOMER_DEBT", debtIdsToClose);
            }
        }

        if (!newNotifications.isEmpty()) {
            notificationRepository.saveAll(newNotifications);
        }

        return newNotifications.size();
    }

    @Override
    @Scheduled(cron = "0 0 2 * * ?") // 02:00 AM hàng ngày
    @Transactional(rollbackFor = Exception.class)
    public void cleanupExpiredNotificationsJob() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        log.info("Bắt đầu dọn dẹp thông báo cũ quá 30 ngày (trước mốc {})", cutoffDate);
        long deleted = notificationRepository.deleteByCreatedAtBefore(cutoffDate);
        log.info("Hoàn tất dọn dẹp thông báo. Đã xóa {} bản ghi cũ.", deleted);
    }

    // =========================================================================
    // Helper Methods & Specifications
    // =========================================================================

    private Specification<AppNotification> buildSpecification(
            User currentUser, NotificationFilterRequest filter, Set<String> disabledTypes) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Ràng buộc Multi-tenancy: Bắt buộc cùng household_id
            predicates.add(cb.equal(root.get("household").get("id"), currentUser.getHousehold().getId()));

            // 2. Ràng buộc 30 ngày lưu trữ (Data Retention Policy)
            LocalDateTime threshold30Days = LocalDateTime.now().minusDays(30);
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), threshold30Days));

            // 3. Ràng buộc QTN-10 & Phân quyền theo vai trò (TC-03)
            String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : "";
            if ("VT-02".equalsIgnoreCase(roleCode)) {
                // Nhân viên bán hàng: CHỈ ĐƯỢC XEM tác nghiệp bán hàng
                predicates.add(root.get("notificationType").in(NotificationTypeConstant.CASHIER_ALLOWED_TYPES));

                // Dùng LEFT JOIN tường minh để không vô tình loại bỏ các bản ghi thông báo quầy chung (user_id IS NULL)
                Join<AppNotification, User> userJoin = root.join("user", JoinType.LEFT);
                Predicate forMe = cb.equal(userJoin.get("id"), currentUser.getId());
                Predicate forAll = cb.isNull(root.get("user"));
                predicates.add(cb.or(forMe, forAll));
            } else {
                // Chủ hộ (VT-01) hoặc Kế toán (VT-03):
                // Loại trừ các loại thông báo mà chủ hộ đã chủ động TẮT trong Settings
                if (disabledTypes != null && !disabledTypes.isEmpty()) {
                    predicates.add(cb.not(root.get("notificationType").in(disabledTypes)));
                }
            }

            // 4. Lọc theo severity
            if (filter.getSeverity() != null && !filter.getSeverity().isBlank()) {
                predicates.add(cb.equal(root.get("severity"), filter.getSeverity().trim().toUpperCase()));
            }

            // 5. Lọc theo loại thông báo cụ thể
            if (filter.getNotificationType() != null && !filter.getNotificationType().isBlank()) {
                predicates.add(cb.equal(root.get("notificationType"), filter.getNotificationType().trim()));
            }

            // 6. Lọc theo trạng thái đã đọc
            if (filter.getIsRead() != null) {
                predicates.add(cb.equal(root.get("isRead"), filter.getIsRead()));
            }

            // 7. Lọc theo trạng thái đóng (mặc định nếu null thì chỉ lấy việc chưa đóng)
            if (filter.getIsClosed() != null) {
                predicates.add(cb.equal(root.get("isClosed"), filter.getIsClosed()));
            } else {
                predicates.add(cb.isFalse(root.get("isClosed")));
            }

            // 8. Tìm kiếm từ khóa tiêu đề hoặc nội dung
            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String pattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate msgLike = cb.like(cb.lower(root.get("message")), pattern);
                predicates.add(cb.or(titleLike, msgLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private User validateAndGetUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private AppNotificationResponse mapToNotificationResponse(AppNotification notif) {
        return AppNotificationResponse.builder()
                .id(notif.getId())
                .notificationType(notif.getNotificationType())
                .notificationCategory(resolveCategory(notif.getNotificationType()))
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

    private String resolveCategory(String type) {
        if (type == null) return "KHÁC";
        return switch (type) {
            case NotificationTypeConstant.INVOICE_ERROR, NotificationTypeConstant.INVOICE_RANGE_LOW -> "HÓA ĐƠN ĐIỆN TỬ";
            case NotificationTypeConstant.DEBT_DUE, NotificationTypeConstant.DEBT_OVERDUE -> "CÔNG NỢ";
            case NotificationTypeConstant.LOW_STOCK_WARNING -> "KHO HÀNG";
            case NotificationTypeConstant.REVENUE_THRESHOLD_WARNING, NotificationTypeConstant.REVENUE_THRESHOLD_EXCEEDED,
                 NotificationTypeConstant.TAX_DECLARATION_REMINDER, NotificationTypeConstant.TAX_DECLARATION_OVERDUE -> "THUẾ & DOANH THU";
            case NotificationTypeConstant.BACKUP_VERIFICATION_FAILED, NotificationTypeConstant.ABNORMAL_ACTIVITY -> "HỆ THỐNG & BẢO MẬT";
            default -> "CHUNG";
        };
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        NumberFormat nf = NumberFormat.getInstance(Locale.forLanguageTag("vi-VN"));
        return nf.format(amount);
    }

    // =========================================================================
    // Predefined Settings Metadata
    // =========================================================================

    private record NotificationConfigItem(
            String type,
            String title,
            String description,
            String category,
            boolean isMandatory
    ) {}

    private static final List<NotificationConfigItem> PREDEFINED_SETTINGS = List.of(
            new NotificationConfigItem(
                    NotificationTypeConstant.INVOICE_ERROR,
                    "Hóa đơn gửi lỗi",
                    "Cảnh báo khi hóa đơn điện tử gửi cơ quan thuế bị lỗi hoặc từ chối",
                    "HÓA ĐƠN ĐIỆN TỬ",
                    true
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.DEBT_DUE,
                    "Công nợ đến hạn",
                    "Nhắc nhở khoản nợ khách hàng sắp đến hạn thanh toán",
                    "CÔNG NỢ",
                    false
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.DEBT_OVERDUE,
                    "Công nợ quá hạn",
                    "Cảnh báo khoản nợ của khách hàng đã quá hạn thanh toán",
                    "CÔNG NỢ",
                    false
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.LOW_STOCK_WARNING,
                    "Tồn kho tối thiểu",
                    "Cảnh báo mặt hàng tồn kho chạm hoặc dưới mức tối thiểu",
                    "KHO HÀNG",
                    false
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.REVENUE_THRESHOLD_WARNING,
                    "Cảnh báo ngưỡng doanh thu",
                    "Cảnh báo doanh thu năm sắp chạm ngưỡng 1 tỷ đồng bắt buộc áp dụng HĐĐT",
                    "THUẾ & DOANH THU",
                    false
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.TAX_DECLARATION_REMINDER,
                    "Nhắc nộp tờ khai thuế",
                    "Nhắc lịch nộp tờ khai thuế môn bài, GTGT, TNCN theo kỳ",
                    "THUẾ & DOANH THU",
                    false
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.BACKUP_VERIFICATION_FAILED,
                    "Sự cố kiểm chứng sao lưu",
                    "Cảnh báo khi quá trình chạy thử phục hồi bản sao lưu thất bại",
                    "HỆ THỐNG & BẢO MẬT",
                    false
            ),
            new NotificationConfigItem(
                    NotificationTypeConstant.INVOICE_RANGE_LOW,
                    "Sắp hết dải số hóa đơn",
                    "Cảnh báo số lượng hóa đơn trong dải số sắp hết",
                    "HÓA ĐƠN ĐIỆN TỬ",
                    false
            )
    );
}
