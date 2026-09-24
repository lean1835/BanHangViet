package com.sales.modules.platform.service.impl;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.entity.UserSession;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.auth.repository.UserSessionRepository;
import com.sales.modules.platform.entity.HouseholdSubscription;
import com.sales.modules.platform.entity.HouseholdUsageStats;
import com.sales.modules.platform.entity.ServicePackage;
import com.sales.modules.platform.repository.HouseholdSubscriptionRepository;
import com.sales.modules.platform.repository.HouseholdUsageStatsRepository;
import com.sales.common.constant.DatePatternConstant;
import com.sales.common.constant.HouseholdStatus;
import com.sales.common.constant.SubscriptionStatus;
import com.sales.modules.auth.dto.request.LockHouseholdRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.platform.dto.response.PlatformHouseholdSummaryResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.platform.service.PlatformHouseholdService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformHouseholdServiceImpl implements PlatformHouseholdService {

    private final BusinessHouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final HouseholdSubscriptionRepository subscriptionRepository;
    private final HouseholdUsageStatsRepository usageStatsRepository;
    private final ActivityLogHelper activityLogHelper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, String oldValue, String newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;
            activityLogHelper.logActivity(household, actor, action, "business_households", targetId, oldValue, newValue, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for platform household", e);
        }
    }

    private PlatformHouseholdSummaryResponse mapToSummary(BusinessHousehold household) {
        long userCount = userRepository.countByHouseholdIdAndDeletedAtIsNull(household.getId());

        List<UserSession> sessions = userSessionRepository.findActiveSessionsByHouseholdId(household.getId());
        LocalDateTime lastActive = sessions.isEmpty() ? null : sessions.get(0).getLastActiveAt();

        Optional<HouseholdSubscription> subOpt = subscriptionRepository
                .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(household.getId(), SubscriptionStatus.ACTIVE);
        String packageName = subOpt.map(s -> s.getServicePackage().getName()).orElse("Chưa gán gói");
        String packageCode = subOpt.map(s -> s.getServicePackage().getCode()).orElse(null);
        LocalDate packageEndDate = subOpt.map(HouseholdSubscription::getEndDate).orElse(null);
        Integer maxUsers = subOpt.map(s -> s.getServicePackage().getMaxUsers()).orElse(5);
        Integer maxInvoices = subOpt.map(s -> s.getServicePackage().getMaxInvoicesPerMonth()).orElse(500);

        String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern(DatePatternConstant.YEAR_MONTH));
        Optional<HouseholdUsageStats> statsOpt = usageStatsRepository.findByHouseholdIdAndMonthYear(household.getId(), currentMonth);
        Integer invoiceCount = statsOpt.map(HouseholdUsageStats::getInvoicesIssuedCount).orElse(0);

        return PlatformHouseholdSummaryResponse.builder()
                .id(household.getId())
                .taxCode(household.getTaxCode())
                .name(household.getName())
                .address(household.getAddress())
                .phoneNumber(household.getPhoneNumber())
                .representativeName(household.getRepresentativeName())
                .status(household.getStatus())
                .lockReason(household.getLockReason())
                .lockedAt(household.getLockedAt())
                .userCount(userCount)
                .lastActiveAt(lastActive)
                .currentPackageCode(packageCode)
                .currentPackageName(packageName)
                .packageEndDate(packageEndDate)
                .maxUsers(maxUsers)
                .maxInvoicesMonth(maxInvoices)
                .invoiceCountMonth(invoiceCount)
                .createdAt(household.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PlatformHouseholdSummaryResponse> getHouseholds(
            String currentUsername, String search, String statusStr, int page, int size) {

        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "createdAt"));
        HouseholdStatus statusFilter = null;
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                statusFilter = HouseholdStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        String keyword = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        // Custom specification or simple query
        Page<BusinessHousehold> householdPage;
        if (keyword != null && statusFilter != null) {
            householdPage = householdRepository.searchByNameOrTaxCodeAndStatus(keyword, statusFilter, pageable);
        } else if (keyword != null) {
            householdPage = householdRepository.findByNameContainingIgnoreCaseOrTaxCodeContainingIgnoreCase(keyword, keyword, pageable);
        } else if (statusFilter != null) {
            householdPage = householdRepository.findByStatus(statusFilter, pageable);
        } else {
            householdPage = householdRepository.findAll(pageable);
        }

        List<BusinessHousehold> households = householdPage.getContent();
        List<PlatformHouseholdSummaryResponse> items;

        if (households.isEmpty()) {
            items = java.util.Collections.emptyList();
        } else {
            List<String> householdIds = households.stream().map(BusinessHousehold::getId).collect(Collectors.toList());

            // 1. Batch count users
            java.util.Map<String, Long> userCountMap = new java.util.HashMap<>();
            List<Object[]> userCounts = userRepository.countUsersByHouseholdIds(householdIds);
            for (Object[] row : userCounts) {
                userCountMap.put((String) row[0], ((Number) row[1]).longValue());
            }

            // 2. Batch fetch last active
            java.util.Map<String, LocalDateTime> lastActiveMap = new java.util.HashMap<>();
            List<Object[]> lastActives = userSessionRepository.findLatestActiveAtByHouseholdIds(householdIds);
            for (Object[] row : lastActives) {
                lastActiveMap.put((String) row[0], (LocalDateTime) row[1]);
            }

            // 3. Batch fetch active subscriptions
            java.util.Map<String, HouseholdSubscription> subMap = new java.util.HashMap<>();
            List<HouseholdSubscription> subscriptions = subscriptionRepository
                    .findByHouseholdIdInAndStatusOrderByCreatedAtDesc(householdIds, SubscriptionStatus.ACTIVE);
            for (HouseholdSubscription sub : subscriptions) {
                if (sub.getHousehold() != null && sub.getServicePackage() != null) {
                    subMap.putIfAbsent(sub.getHousehold().getId(), sub);
                }
            }

            // 4. Batch fetch usage stats for current month
            String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern(DatePatternConstant.YEAR_MONTH));
            java.util.Map<String, Integer> invoiceCountMap = new java.util.HashMap<>();
            List<HouseholdUsageStats> statsList = usageStatsRepository.findByHouseholdIdInAndMonthYear(householdIds, currentMonth);
            for (HouseholdUsageStats stats : statsList) {
                if (stats.getHousehold() != null) {
                    invoiceCountMap.put(stats.getHousehold().getId(), stats.getInvoicesIssuedCount());
                }
            }

            items = households.stream()
                    .map(h -> {
                        HouseholdSubscription activeSub = subMap.get(h.getId());
                        ServicePackage pkg = activeSub != null ? activeSub.getServicePackage() : null;
                        String packageName = pkg != null ? pkg.getName() : "Chưa gán gói";
                        String packageCode = pkg != null ? pkg.getCode() : null;
                        LocalDate packageEndDate = activeSub != null ? activeSub.getEndDate() : null;
                        Integer maxUsers = pkg != null ? pkg.getMaxUsers() : 5;
                        Integer maxInvoices = pkg != null ? pkg.getMaxInvoicesPerMonth() : 500;
                        Integer invoiceCount = invoiceCountMap.getOrDefault(h.getId(), 0);

                        return PlatformHouseholdSummaryResponse.builder()
                                .id(h.getId())
                                .taxCode(h.getTaxCode())
                                .name(h.getName())
                                .address(h.getAddress())
                                .phoneNumber(h.getPhoneNumber())
                                .representativeName(h.getRepresentativeName())
                                .status(h.getStatus())
                                .lockReason(h.getLockReason())
                                .lockedAt(h.getLockedAt())
                                .userCount(userCountMap.getOrDefault(h.getId(), 0L))
                                .lastActiveAt(lastActiveMap.get(h.getId()))
                                .currentPackageCode(packageCode)
                                .currentPackageName(packageName)
                                .packageEndDate(packageEndDate)
                                .maxUsers(maxUsers)
                                .maxInvoicesMonth(maxInvoices)
                                .invoiceCountMonth(invoiceCount)
                                .createdAt(h.getCreatedAt())
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        return PageResponse.<PlatformHouseholdSummaryResponse>builder()
                .content(items)
                .pageNumber(householdPage.getNumber())
                .pageSize(householdPage.getSize())
                .totalElements(householdPage.getTotalElements())
                .totalPages(householdPage.getTotalPages())
                .last(householdPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformHouseholdSummaryResponse getHouseholdDetail(String currentUsername, String householdId) {
        BusinessHousehold household = householdRepository.findById(householdId)
                .orElseThrow(() -> new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND));

        return mapToSummary(household);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformHouseholdSummaryResponse lockHousehold(String currentUsername, String householdId, LockHouseholdRequest request) {
        User adminUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = householdRepository.findById(householdId)
                .orElseThrow(() -> new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND));

        if (request == null || request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.LOCK_REASON_REQUIRED);
        }

        String reason = request.getReason().trim();
        household.setStatus(HouseholdStatus.LOCKED);
        household.setLockReason(reason);
        household.setLockedAt(LocalDateTime.now());
        household.setLockedByUserId(adminUser.getId());

        household = householdRepository.save(household);

        // QTN-25 & TC-01: Chặn đăng nhập và thu hồi tất cả active sessions của hộ ngay lập tức
        userSessionRepository.revokeAllActiveSessionsForHousehold(
                household.getId(),
                LocalDateTime.now(),
                adminUser,
                "Hộ kinh doanh đã bị khóa bởi Quản trị nền tảng: " + reason);

        logActivity(household, adminUser, "LOCK_HOUSEHOLD", household.getId(), "ACTIVE", "LOCKED: " + reason);

        return mapToSummary(household);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PlatformHouseholdSummaryResponse unlockHousehold(String currentUsername, String householdId) {
        User adminUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = householdRepository.findById(householdId)
                .orElseThrow(() -> new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND));

        String oldReason = household.getLockReason();
        household.setStatus(HouseholdStatus.ACTIVE);
        household.setLockReason(null);
        household.setLockedAt(null);
        household.setLockedByUserId(null);

        household = householdRepository.save(household);

        logActivity(household, adminUser, "UNLOCK_HOUSEHOLD", household.getId(), "LOCKED: " + oldReason, "ACTIVE");

        return mapToSummary(household);
    }
}
