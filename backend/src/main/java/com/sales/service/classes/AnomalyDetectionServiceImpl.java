package com.sales.service.classes;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import com.sales.dto.request.AnomalyAlertFilterRequest;
import com.sales.dto.request.ReviewAnomalyAlertRequest;
import com.sales.dto.request.UpdateAnomalyRuleRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.AnomalyDetectionService;
import com.sales.service.interfaces.AuditLogService;
import com.sales.specification.AnomalyAlertSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyDetectionServiceImpl implements AnomalyDetectionService {

    private final AnomalyAlertRepository anomalyAlertRepository;
    private final AnomalyRuleConfigRepository anomalyRuleConfigRepository;
    private final UserRepository userRepository;
    private final BusinessHouseholdRepository householdRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final OrderRepository orderRepository;
    private final InventoryAuditDetailRepository inventoryAuditDetailRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AuditLogService auditLogService;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnomalyAlertResponse> getAnomalyAlerts(String currentUsername, AnomalyAlertFilterRequest filter, String clientIp, String userAgent) {
        if (filter == null) {
            filter = new AnomalyAlertFilterRequest();
        }
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        Pageable pageable = PageRequest.of(
                Math.max(0, filter.getPage()),
                Math.max(1, filter.getSize() <= 0 ? 15 : filter.getSize()),
                Sort.by(Sort.Direction.DESC, "detectedAt")
        );

        String keyword = (filter.getKeyword() != null && !filter.getKeyword().isBlank()) ? filter.getKeyword().trim() : null;
        String actorUsername = (filter.getActorUsername() != null && !filter.getActorUsername().isBlank()) ? filter.getActorUsername().trim() : null;

        Page<AnomalyAlert> alertPage = anomalyAlertRepository.findFilteredAlerts(
                householdId,
                filter.getAlertType(),
                filter.getSeverity(),
                filter.getStatus(),
                actorUsername,
                keyword,
                filter.getStartDate(),
                filter.getEndDate(),
                pageable
        );

        List<AnomalyAlertResponse> content = alertPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        // Ghi nhật ký kiểm toán hành động tra cứu danh sách cảnh báo
        activityLogHelper.logActivityInNewTransaction(
                currentUser.getHousehold(),
                currentUser,
                "VIEW_ANOMALY_ALERTS",
                "anomaly_alerts",
                null,
                null,
                "Tra cứu danh sách cảnh báo thao tác bất thường",
                clientIp,
                userAgent
        );

        return PageResponse.<AnomalyAlertResponse>builder()
                .content(content)
                .pageNumber(alertPage.getNumber())
                .pageSize(alertPage.getSize())
                .totalElements(alertPage.getTotalElements())
                .totalPages(alertPage.getTotalPages())
                .last(alertPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AnomalyAlertSummaryResponse getSummary(String currentUsername, LocalDate evaluatedDate) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        LocalDate targetDate = (evaluatedDate != null) ? evaluatedDate : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.atTime(LocalTime.MAX);

        long total = (householdId != null) ? anomalyAlertRepository.countByHouseholdId(householdId) : anomalyAlertRepository.count();
        long pending = (householdId != null) ? anomalyAlertRepository.countByHouseholdIdAndStatus(householdId, AnomalyAlertStatus.PENDING) : 0;
        long reviewed = (householdId != null) ? anomalyAlertRepository.countByHouseholdIdAndStatus(householdId, AnomalyAlertStatus.REVIEWED) : 0;
        long dismissed = (householdId != null) ? anomalyAlertRepository.countByHouseholdIdAndStatus(householdId, AnomalyAlertStatus.DISMISSED) : 0;

        long critical = (householdId != null) ? anomalyAlertRepository.countByHouseholdIdAndSeverity(householdId, AnomalySeverity.CRITICAL) : 0;
        long warning = (householdId != null) ? anomalyAlertRepository.countByHouseholdIdAndSeverity(householdId, AnomalySeverity.WARNING) : 0;
        long info = (householdId != null) ? anomalyAlertRepository.countByHouseholdIdAndSeverity(householdId, AnomalySeverity.INFO) : 0;

        long dayCount = anomalyAlertRepository.countAnomaliesInDateRange(householdId, startOfDay, endOfDay);
        boolean isCleanDay = (dayCount == 0);

        Map<String, Long> alertsByType = new HashMap<>();
        for (AnomalyAlertType type : AnomalyAlertType.values()) {
            alertsByType.put(type.name(), 0L);
        }

        List<AnomalyAlert> dayAlerts = (householdId != null) ?
                anomalyAlertRepository.findByHouseholdIdAndDetectedAtBetweenOrderByDetectedAtDesc(householdId, startOfDay, endOfDay) :
                Collections.emptyList();

        for (AnomalyAlert a : dayAlerts) {
            alertsByType.put(a.getAlertType().name(), alertsByType.getOrDefault(a.getAlertType().name(), 0L) + 1);
        }

        return AnomalyAlertSummaryResponse.builder()
                .totalAlerts(total)
                .pendingAlerts(pending)
                .reviewedAlerts(reviewed)
                .dismissedAlerts(dismissed)
                .criticalAlerts(critical)
                .warningAlerts(warning)
                .infoAlerts(info)
                .isCleanDay(isCleanDay)
                .evaluatedDate(targetDate)
                .alertsByType(alertsByType)
                .lastScannedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AnomalyAlertResponse getAlertById(String currentUsername, String alertId) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        AnomalyAlert alert = findAlertOrThrow(alertId, currentUser);
        return mapToResponse(alert);
    }

    @Override
    @Transactional
    public ScanAnomalyResultResponse scanAnomalies(String currentUsername, LocalDate scanDate, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        LocalDate targetDate = (scanDate != null) ? scanDate : LocalDate.now();
        List<AnomalyAlert> newAlerts = performDetection(household, targetDate);

        // Lưu tất cả các cảnh báo mới phát hiện
        if (!newAlerts.isEmpty()) {
            anomalyAlertRepository.saveAll(newAlerts);
        }

        boolean isCleanDay = (newAlerts.isEmpty() && anomalyAlertRepository.countAnomaliesInDateRange(
                household.getId(),
                targetDate.atStartOfDay(),
                targetDate.atTime(LocalTime.MAX)
        ) == 0);

        String summaryMsg = isCleanDay ?
                "Ghi nhận ngày an toàn (ngày sạch), không có thao tác vượt ngưỡng bất thường nào trong ngày " + targetDate :
                "Phát hiện " + newAlerts.size() + " thao tác bất thường mới trong ngày " + targetDate;

        // Ghi nhật ký kiểm toán hành động quét
        activityLogHelper.logActivityInNewTransaction(
                household,
                currentUser,
                "SCAN_ANOMALIES",
                "anomaly_alerts",
                null,
                null,
                summaryMsg,
                clientIp,
                userAgent
        );

        List<AnomalyAlertResponse> responseList = newAlerts.stream().map(this::mapToResponse).toList();

        return ScanAnomalyResultResponse.builder()
                .scannedDate(targetDate)
                .newAlertsDetected(newAlerts.size())
                .isCleanDay(isCleanDay)
                .summaryMessage(summaryMsg)
                .newAlerts(responseList)
                .completedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public AnomalyAlertResponse reviewAlert(String currentUsername, String alertId, ReviewAnomalyAlertRequest request, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        if (request.getStatus() != AnomalyAlertStatus.REVIEWED && request.getStatus() != AnomalyAlertStatus.DISMISSED) {
            throw new AppException(ErrorCode.INVALID_ANOMALY_STATUS);
        }

        AnomalyAlert alert = findAlertOrThrow(alertId, currentUser);
        String oldStatus = alert.getStatus().name();

        alert.setStatus(request.getStatus());
        alert.setReviewedByUser(currentUser);
        alert.setReviewedAt(LocalDateTime.now());
        alert.setReviewNotes(request.getReviewNotes());

        AnomalyAlert saved = anomalyAlertRepository.save(alert);

        activityLogHelper.logActivityInNewTransaction(
                currentUser.getHousehold(),
                currentUser,
                "REVIEW_ANOMALY_ALERT",
                "anomaly_alerts",
                saved.getId(),
                "{\"status\":\"" + oldStatus + "\"}",
                "{\"status\":\"" + request.getStatus().name() + "\",\"notes\":\"" + (request.getReviewNotes() != null ? request.getReviewNotes() : "") + "\"}",
                clientIp,
                userAgent
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public List<AnomalyRuleConfigResponse> getRuleConfigs(String currentUsername) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        List<AnomalyRuleConfig> rules = getOrCreateDefaultRules(household);
        return rules.stream().map(this::mapToRuleResponse).toList();
    }

    @Override
    @Transactional
    public AnomalyRuleConfigResponse updateRuleConfig(String currentUsername, String ruleConfigId, UpdateAnomalyRuleRequest request, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        AnomalyRuleConfig ruleConfig = anomalyRuleConfigRepository.findByIdAndHouseholdId(ruleConfigId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ANOMALY_RULE_NOT_FOUND));

        String oldVal = "{\"threshold\":" + ruleConfig.getThresholdValue() + ",\"window\":" + ruleConfig.getTimeWindowMinutes() + ",\"enabled\":" + ruleConfig.getIsEnabled() + "}";

        ruleConfig.setThresholdValue(request.getThresholdValue());
        ruleConfig.setTimeWindowMinutes(request.getTimeWindowMinutes());
        ruleConfig.setSeverity(request.getSeverity());
        ruleConfig.setIsEnabled(request.getIsEnabled());

        AnomalyRuleConfig saved = anomalyRuleConfigRepository.save(ruleConfig);

        String newVal = "{\"threshold\":" + saved.getThresholdValue() + ",\"window\":" + saved.getTimeWindowMinutes() + ",\"enabled\":" + saved.getIsEnabled() + "}";

        activityLogHelper.logActivityInNewTransaction(
                household,
                currentUser,
                "UPDATE_ANOMALY_RULE",
                "anomaly_rule_configs",
                saved.getId(),
                oldVal,
                newVal,
                clientIp,
                userAgent
        );

        return mapToRuleResponse(saved);
    }

    @Override
    @Transactional
    public void performScheduledScan() {
        log.info("Bắt đầu chu kỳ quét phát hiện thao tác bất thường tự động...");
        List<BusinessHousehold> households = householdRepository.findAll();
        LocalDate today = LocalDate.now();

        for (BusinessHousehold hh : households) {
            try {
                List<AnomalyAlert> detected = performDetection(hh, today);
                if (!detected.isEmpty()) {
                    anomalyAlertRepository.saveAll(detected);
                    log.warn("Đã phát hiện và ghi nhận {} cảnh báo bất thường mới cho hộ kinh doanh {}", detected.size(), hh.getName());
                }
            } catch (Exception e) {
                log.error("Lỗi khi quét thao tác bất thường cho hộ {}", hh.getId(), e);
            }
        }
        log.info("Hoàn tất chu kỳ quét thao tác bất thường tự động.");
    }

    /**
     * Thực hiện kiểm tra tất cả các quy tắc phát hiện bất thường
     */
    private List<AnomalyAlert> performDetection(BusinessHousehold household, LocalDate targetDate) {
        List<AnomalyAlert> detected = new ArrayList<>();
        Map<AnomalyAlertType, AnomalyRuleConfig> ruleMap = getOrCreateDefaultRules(household).stream()
                .collect(Collectors.toMap(AnomalyRuleConfig::getRuleType, r -> r, (a, b) -> a));

        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.atTime(LocalTime.MAX);

        // 1. Quét Hủy nhiều hóa đơn trong thời gian ngắn (MASS_INVOICE_CANCEL)
        AnomalyRuleConfig cancelRule = ruleMap.get(AnomalyAlertType.MASS_INVOICE_CANCEL);
        if (cancelRule != null && Boolean.TRUE.equals(cancelRule.getIsEnabled())) {
            scanMassInvoiceCancellations(household, cancelRule, startOfDay, endOfDay, detected);
        }

        // 2. Quét Giảm giá đơn hàng bất thường (UNUSUAL_HIGH_DISCOUNT)
        AnomalyRuleConfig discountRule = ruleMap.get(AnomalyAlertType.UNUSUAL_HIGH_DISCOUNT);
        if (discountRule != null && Boolean.TRUE.equals(discountRule.getIsEnabled())) {
            scanUnusualHighDiscounts(household, discountRule, startOfDay, endOfDay, detected);
        }

        // 3. Quét Điều chỉnh tồn kho lớn (LARGE_INVENTORY_ADJUSTMENT)
        AnomalyRuleConfig inventoryRule = ruleMap.get(AnomalyAlertType.LARGE_INVENTORY_ADJUSTMENT);
        if (inventoryRule != null && Boolean.TRUE.equals(inventoryRule.getIsEnabled())) {
            scanLargeInventoryAdjustments(household, inventoryRule, startOfDay, endOfDay, detected);
        }

        // 4. Quét Tính toàn vẹn Hash Chain kiểm toán (AUDIT_CHAIN_BREACH)
        AnomalyRuleConfig auditChainRule = ruleMap.get(AnomalyAlertType.AUDIT_CHAIN_BREACH);
        if (auditChainRule != null && Boolean.TRUE.equals(auditChainRule.getIsEnabled())) {
            scanAuditChainBreach(household, auditChainRule, detected);
        }

        return detected;
    }

    /**
     * AC-01: Phát hiện một người dùng hủy N hóa đơn (mặc định 5 hóa đơn) trong vòng M phút (mặc định 10 phút)
     */
    private void scanMassInvoiceCancellations(BusinessHousehold household, AnomalyRuleConfig rule, LocalDateTime start, LocalDateTime end, List<AnomalyAlert> result) {
        List<EInvoice> canceledInvoices = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(),
                "CANCELED",
                start,
                end
        );

        if (canceledInvoices.isEmpty()) {
            return;
        }

        // Nhóm các hóa đơn đã hủy theo người hủy (canceledByUser)
        Map<User, List<EInvoice>> byUser = canceledInvoices.stream()
                .filter(inv -> inv.getCanceledByUser() != null)
                .collect(Collectors.groupingBy(EInvoice::getCanceledByUser));

        int thresholdCount = rule.getThresholdValue().intValue();
        int windowMinutes = rule.getTimeWindowMinutes();

        for (Map.Entry<User, List<EInvoice>> entry : byUser.entrySet()) {
            User actor = entry.getKey();
            List<EInvoice> userInvoices = entry.getValue();

            userInvoices.sort(Comparator.comparing(
                    inv -> inv.getCanceledAt() != null ? inv.getCanceledAt() : inv.getCreatedAt()
            ));

            // Thuật toán Sliding Window đếm số hóa đơn trong cửa sổ windowMinutes
            for (int i = 0; i < userInvoices.size(); i++) {
                LocalDateTime windowStart = userInvoices.get(i).getCanceledAt() != null ?
                        userInvoices.get(i).getCanceledAt() : userInvoices.get(i).getCreatedAt();
                LocalDateTime windowEnd = windowStart.plusMinutes(windowMinutes);

                List<EInvoice> windowInvoices = new ArrayList<>();
                for (int j = i; j < userInvoices.size(); j++) {
                    LocalDateTime t = userInvoices.get(j).getCanceledAt() != null ?
                            userInvoices.get(j).getCanceledAt() : userInvoices.get(j).getCreatedAt();
                    if (!t.isAfter(windowEnd)) {
                        windowInvoices.add(userInvoices.get(j));
                    } else {
                        break;
                    }
                }

                if (windowInvoices.size() >= thresholdCount) {
                    // Kiểm tra xem cảnh báo tương tự đã tồn tại trong khoảng thời gian này chưa
                    boolean alreadyAlerted = anomalyAlertRepository.existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween(
                            household.getId(),
                            AnomalyAlertType.MASS_INVOICE_CANCEL,
                            actor.getId(),
                            windowStart.minusMinutes(5),
                            windowEnd.plusMinutes(5)
                    );

                    if (!alreadyAlerted) {
                        List<Map<String, Object>> evidenceList = windowInvoices.stream().map(inv -> {
                            Map<String, Object> map = new HashMap<>();
                            map.put("invoiceId", inv.getId());
                            map.put("invoiceNumber", inv.getInvoiceNumber());
                            map.put("canceledAt", inv.getCanceledAt() != null ? inv.getCanceledAt().toString() : inv.getCreatedAt().toString());
                            map.put("cancelReason", inv.getCancelReason());
                            map.put("finalAmount", inv.getFinalAmount());
                            return map;
                        }).toList();

                        String evidenceJson = toJson(evidenceList);

                        AnomalyAlert alert = AnomalyAlert.builder()
                                .household(household)
                                .alertType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                                .severity(rule.getSeverity())
                                .title("Cảnh báo hủy hóa đơn hàng loạt (" + windowInvoices.size() + " hóa đơn trong " + windowMinutes + " phút)")
                                .description("Tài khoản " + actor.getUsername() + " (" + actor.getFullName() + ") đã hủy " +
                                        windowInvoices.size() + " hóa đơn liên tiếp trong vòng " + windowMinutes + " phút.")
                                .actorUser(actor)
                                .status(AnomalyAlertStatus.PENDING)
                                .evidenceData(evidenceJson)
                                .detectedAt(windowEnd)
                                .build();

                        result.add(alert);
                        i += windowInvoices.size() - 1; // Nhảy qua các hóa đơn đã gom cụm
                    }
                }
            }
        }
    }

    /**
     * Phát hiện đơn hàng có tỷ lệ giảm giá hoặc số tiền giảm giá lớn bất thường
     */
    private void scanUnusualHighDiscounts(BusinessHousehold household, AnomalyRuleConfig rule, LocalDateTime start, LocalDateTime end, List<AnomalyAlert> result) {
        List<Order> orders = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(),
                "COMPLETED",
                start,
                end
        );

        BigDecimal thresholdRate = rule.getThresholdValue(); // e.g. 30%

        for (Order order : orders) {
            BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;

            if (totalAmount.compareTo(BigDecimal.ZERO) > 0 && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal discountPercentage = discountAmount.divide(totalAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

                if (discountPercentage.compareTo(thresholdRate) >= 0) {
                    boolean alreadyAlerted = anomalyAlertRepository.existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween(
                            household.getId(),
                            AnomalyAlertType.UNUSUAL_HIGH_DISCOUNT,
                            order.getCreatedByUser() != null ? order.getCreatedByUser().getId() : null,
                            order.getCreatedAt().minusMinutes(5),
                            order.getCreatedAt().plusMinutes(5)
                    );

                    if (!alreadyAlerted) {
                        Map<String, Object> evidence = new HashMap<>();
                        evidence.put("orderId", order.getId());
                        evidence.put("orderNumber", order.getOrderNumber());
                        evidence.put("totalAmount", totalAmount);
                        evidence.put("discountAmount", discountAmount);
                        evidence.put("discountPercentage", discountPercentage.setScale(2, RoundingMode.HALF_UP));
                        evidence.put("createdAt", order.getCreatedAt().toString());

                        AnomalyAlert alert = AnomalyAlert.builder()
                                .household(household)
                                .alertType(AnomalyAlertType.UNUSUAL_HIGH_DISCOUNT)
                                .severity(rule.getSeverity())
                                .title("Đơn hàng " + order.getOrderNumber() + " có chiết khấu cao bất thường (" + discountPercentage.setScale(1, RoundingMode.HALF_UP) + "%)")
                                .description("Đơn hàng số " + order.getOrderNumber() + " áp dụng giảm giá " +
                                        discountPercentage.setScale(1, RoundingMode.HALF_UP) + "% (vượt ngưỡng cho phép " + thresholdRate + "%).")
                                .actorUser(order.getCreatedByUser())
                                .status(AnomalyAlertStatus.PENDING)
                                .evidenceData(toJson(evidence))
                                .detectedAt(order.getCreatedAt())
                                .build();

                        result.add(alert);
                    }
                }
            }
        }
    }

    /**
     * Phát hiện phiếu kiểm kê có chênh lệch tồn kho lớn vượt ngưỡng
     */
    private void scanLargeInventoryAdjustments(BusinessHousehold household, AnomalyRuleConfig rule, LocalDateTime start, LocalDateTime end, List<AnomalyAlert> result) {
        BigDecimal thresholdQty = rule.getThresholdValue(); // e.g. 50 sản phẩm

        List<InventoryAuditDetail> details = inventoryAuditDetailRepository.findDetailsForAnomalyScan(
                household.getId(),
                start,
                end
        );

        for (InventoryAuditDetail d : details) {
            BigDecimal diff = d.getDifferenceQuantity() != null ? d.getDifferenceQuantity().abs() : BigDecimal.ZERO;
            if (diff.compareTo(thresholdQty) >= 0) {
                User actor = d.getAudit() != null ? d.getAudit().getCreatedByUser() : null;
                boolean alreadyAlerted = anomalyAlertRepository.existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween(
                        household.getId(),
                        AnomalyAlertType.LARGE_INVENTORY_ADJUSTMENT,
                        actor != null ? actor.getId() : null,
                        d.getCreatedAt().minusMinutes(5),
                        d.getCreatedAt().plusMinutes(5)
                );

                if (!alreadyAlerted) {
                    Map<String, Object> evidence = new HashMap<>();
                    evidence.put("auditId", d.getAudit() != null ? d.getAudit().getId() : null);
                    evidence.put("auditNumber", d.getAudit() != null ? d.getAudit().getAuditNumber() : null);
                    evidence.put("productId", d.getProduct() != null ? d.getProduct().getId() : null);
                    evidence.put("productName", d.getProduct() != null ? d.getProduct().getName() : null);
                    evidence.put("systemQuantity", d.getSystemQuantity());
                    evidence.put("actualQuantity", d.getActualQuantity());
                    evidence.put("differenceQuantity", d.getDifferenceQuantity());
                    evidence.put("reason", d.getReason());

                    AnomalyAlert alert = AnomalyAlert.builder()
                            .household(household)
                            .alertType(AnomalyAlertType.LARGE_INVENTORY_ADJUSTMENT)
                            .severity(rule.getSeverity())
                            .title("Điều chỉnh kiểm kê chênh lệch lớn (" + diff + " sản phẩm) tại phiếu " + (d.getAudit() != null ? d.getAudit().getAuditNumber() : "N/A"))
                            .description("Mặt hàng " + (d.getProduct() != null ? d.getProduct().getName() : "N/A") +
                                    " có chênh lệch kiểm kê thực tế so với sổ sách là " + d.getDifferenceQuantity() + " sản phẩm.")
                            .actorUser(actor)
                            .status(AnomalyAlertStatus.PENDING)
                            .evidenceData(toJson(evidence))
                            .detectedAt(d.getCreatedAt())
                            .build();

                    result.add(alert);
                }
            }
        }
    }

    /**
     * Kiểm tra tính toàn vẹn chuỗi Hash Chain kiểm toán
     */
    private void scanAuditChainBreach(BusinessHousehold household, AnomalyRuleConfig rule, List<AnomalyAlert> result) {
        try {
            Optional<User> ownerOpt = userRepository.findFirstByHouseholdIdAndRoleCode(household.getId(), "VT-01");

            if (ownerOpt.isPresent()) {
                AuditIntegrityResponse integrity = auditLogService.verifyIntegrity(ownerOpt.get().getUsername());
                if (!integrity.isValid()) {
                    boolean alreadyAlerted = anomalyAlertRepository.existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween(
                            household.getId(),
                            AnomalyAlertType.AUDIT_CHAIN_BREACH,
                            null,
                            LocalDateTime.now().minusHours(1),
                            LocalDateTime.now()
                    );

                    if (!alreadyAlerted) {
                        Map<String, Object> evidence = new HashMap<>();
                        evidence.put("failureReason", integrity.getFailureReason());
                        evidence.put("corruptedSequenceNumber", integrity.getCorruptedSequenceNumber());
                        evidence.put("corruptedLogId", integrity.getCorruptedLogId());
                        evidence.put("verifiedAt", integrity.getVerifiedAt() != null ? integrity.getVerifiedAt().toString() : null);

                        AnomalyAlert alert = AnomalyAlert.builder()
                                .household(household)
                                .alertType(AnomalyAlertType.AUDIT_CHAIN_BREACH)
                                .severity(AnomalySeverity.CRITICAL)
                                .title("Cảnh báo khẩn cấp: Phát hiện đứt gãy tính toàn vẹn chuỗi kiểm toán Hash Chain")
                                .description(integrity.getFailureReason())
                                .actorUser(null)
                                .status(AnomalyAlertStatus.PENDING)
                                .evidenceData(toJson(evidence))
                                .detectedAt(LocalDateTime.now())
                                .build();

                        result.add(alert);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra tính toàn vẹn Hash Chain trong luồng quét bất thường", e);
        }
    }

    private List<AnomalyRuleConfig> getOrCreateDefaultRules(BusinessHousehold household) {
        List<AnomalyRuleConfig> existing = anomalyRuleConfigRepository.findByHouseholdIdOrderByCreatedAtAsc(household.getId());
        if (!existing.isEmpty()) {
            return existing;
        }

        List<AnomalyRuleConfig> defaults = List.of(
                AnomalyRuleConfig.builder()
                        .household(household)
                        .ruleType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                        .ruleName("Hủy nhiều hóa đơn liên tiếp trong thời gian ngắn")
                        .thresholdValue(BigDecimal.valueOf(5))
                        .timeWindowMinutes(10)
                        .severity(AnomalySeverity.CRITICAL)
                        .isEnabled(true)
                        .build(),
                AnomalyRuleConfig.builder()
                        .household(household)
                        .ruleType(AnomalyAlertType.UNUSUAL_HIGH_DISCOUNT)
                        .ruleName("Giảm giá đơn hàng vượt mức cho phép")
                        .thresholdValue(BigDecimal.valueOf(30.00))
                        .timeWindowMinutes(60)
                        .severity(AnomalySeverity.WARNING)
                        .isEnabled(true)
                        .build(),
                AnomalyRuleConfig.builder()
                        .household(household)
                        .ruleType(AnomalyAlertType.LARGE_INVENTORY_ADJUSTMENT)
                        .ruleName("Điều chỉnh số lượng kiểm kê kho chênh lệch lớn")
                        .thresholdValue(BigDecimal.valueOf(50.00))
                        .timeWindowMinutes(60)
                        .severity(AnomalySeverity.WARNING)
                        .isEnabled(true)
                        .build(),
                AnomalyRuleConfig.builder()
                        .household(household)
                        .ruleType(AnomalyAlertType.RAPID_FAILED_LOGINS)
                        .ruleName("Đăng nhập thất bại liên tiếp nhiều lần")
                        .thresholdValue(BigDecimal.valueOf(5))
                        .timeWindowMinutes(15)
                        .severity(AnomalySeverity.CRITICAL)
                        .isEnabled(true)
                        .build(),
                AnomalyRuleConfig.builder()
                        .household(household)
                        .ruleType(AnomalyAlertType.AUDIT_CHAIN_BREACH)
                        .ruleName("Can thiệp dữ liệu kiểm toán hoặc đứt gãy Hash Chain")
                        .thresholdValue(BigDecimal.valueOf(1))
                        .timeWindowMinutes(1)
                        .severity(AnomalySeverity.CRITICAL)
                        .isEnabled(true)
                        .build()
        );

        return anomalyRuleConfigRepository.saveAll(defaults);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateAccessRole(User user) {
        if (user == null || user.getRole() == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        String roleCode = user.getRole().getCode();
        String roleName = user.getRole().getName();

        // AC-03 & TC-03: Chỉ VT-01 (Chủ hộ) hoặc VT-04 (Admin) được truy cập. VT-02 (Nhân viên bán hàng) bị CHẶN.
        if (!"VT-01".equalsIgnoreCase(roleCode) && !"VT-04".equalsIgnoreCase(roleCode) &&
            !"Chủ hộ kinhdong".equalsIgnoreCase(roleName) && !"Chủ hộ kinh doanh".equalsIgnoreCase(roleName) &&
            !"Quản trị nền tảng".equalsIgnoreCase(roleName) && !"Quản trị hệ thống".equalsIgnoreCase(roleName)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private String getHouseholdIdForUser(User user) {
        if (user.getRole() != null &&
            ("VT-04".equalsIgnoreCase(user.getRole().getCode()) || "Quản trị nền tảng".equalsIgnoreCase(user.getRole().getName()))) {
            return null; // Admin được xem toàn hệ thống
        }
        return user.getHousehold() != null ? user.getHousehold().getId() : null;
    }

    private AnomalyAlert findAlertOrThrow(String alertId, User currentUser) {
        String householdId = getHouseholdIdForUser(currentUser);
        if (householdId != null) {
            return anomalyAlertRepository.findByIdAndHouseholdId(alertId, householdId)
                    .orElseThrow(() -> new AppException(ErrorCode.ANOMALY_ALERT_NOT_FOUND));
        }
        return anomalyAlertRepository.findById(alertId)
                .orElseThrow(() -> new AppException(ErrorCode.ANOMALY_ALERT_NOT_FOUND));
    }

    private AnomalyAlertResponse mapToResponse(AnomalyAlert alert) {
        return AnomalyAlertResponse.builder()
                .id(alert.getId())
                .householdId(alert.getHousehold() != null ? alert.getHousehold().getId() : null)
                .alertType(alert.getAlertType())
                .severity(alert.getSeverity())
                .title(alert.getTitle())
                .description(alert.getDescription())
                .actorUserId(alert.getActorUser() != null ? alert.getActorUser().getId() : null)
                .actorUsername(alert.getActorUser() != null ? alert.getActorUser().getUsername() : null)
                .actorFullName(alert.getActorUser() != null ? alert.getActorUser().getFullName() : null)
                .status(alert.getStatus())
                .evidenceData(alert.getEvidenceData())
                .detectedAt(alert.getDetectedAt())
                .reviewedByUserId(alert.getReviewedByUser() != null ? alert.getReviewedByUser().getId() : null)
                .reviewedByUsername(alert.getReviewedByUser() != null ? alert.getReviewedByUser().getUsername() : null)
                .reviewedByFullName(alert.getReviewedByUser() != null ? alert.getReviewedByUser().getFullName() : null)
                .reviewedAt(alert.getReviewedAt())
                .reviewNotes(alert.getReviewNotes())
                .createdAt(alert.getCreatedAt())
                .build();
    }

    private AnomalyRuleConfigResponse mapToRuleResponse(AnomalyRuleConfig rule) {
        return AnomalyRuleConfigResponse.builder()
                .id(rule.getId())
                .householdId(rule.getHousehold() != null ? rule.getHousehold().getId() : null)
                .ruleType(rule.getRuleType())
                .ruleName(rule.getRuleName())
                .thresholdValue(rule.getThresholdValue())
                .timeWindowMinutes(rule.getTimeWindowMinutes())
                .severity(rule.getSeverity())
                .isEnabled(rule.getIsEnabled())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
