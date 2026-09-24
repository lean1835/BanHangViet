package com.sales.modules.platform.service.impl;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.platform.entity.HouseholdSubscription;
import com.sales.modules.platform.entity.HouseholdUsageStats;
import com.sales.modules.platform.entity.ServicePackage;
import com.sales.modules.platform.repository.HouseholdSubscriptionRepository;
import com.sales.modules.platform.repository.HouseholdUsageStatsRepository;
import com.sales.modules.platform.repository.ServicePackageRepository;
import com.sales.modules.pos.repository.PointOfSaleRepository;
import com.sales.common.constant.DatePatternConstant;
import com.sales.common.constant.SubscriptionStatus;
import com.sales.modules.platform.dto.request.AssignSubscriptionRequest;
import com.sales.modules.platform.dto.request.CreateServicePackageRequest;
import com.sales.modules.platform.dto.request.UpdateServicePackageRequest;
import com.sales.modules.platform.dto.response.HouseholdSubscriptionResponse;
import com.sales.modules.platform.dto.response.HouseholdUsageStatsResponse;
import com.sales.modules.platform.dto.response.ServicePackageResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.platform.service.ServicePackageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicePackageServiceImpl implements ServicePackageService {

    private final ServicePackageRepository packageRepository;
    private final HouseholdSubscriptionRepository subscriptionRepository;
    private final HouseholdUsageStatsRepository usageStatsRepository;
    private final BusinessHouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
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
            activityLogHelper.logActivityInNewTransaction(household, actor, action, "household_subscriptions", targetId, oldValue, newValue, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for subscription", e);
        }
    }

    private ServicePackageResponse mapPackageToResponse(ServicePackage pkg) {
        return ServicePackageResponse.builder()
                .id(pkg.getId())
                .code(pkg.getCode())
                .name(pkg.getName())
                .description(pkg.getDescription())
                .maxUsers(pkg.getMaxUsers())
                .maxPosPoints(pkg.getMaxPosPoints())
                .maxInvoicesPerMonth(pkg.getMaxInvoicesPerMonth())
                .dataRetentionDays(pkg.getDataRetentionDays())
                .price(pkg.getPrice())
                .isActive(pkg.getIsActive())
                .createdAt(pkg.getCreatedAt())
                .updatedAt(pkg.getUpdatedAt())
                .build();
    }

    private HouseholdSubscriptionResponse mapSubscriptionToResponse(HouseholdSubscription sub) {
        return HouseholdSubscriptionResponse.builder()
                .id(sub.getId())
                .householdId(sub.getHousehold().getId())
                .householdName(sub.getHousehold().getName())
                .packageId(sub.getServicePackage().getId())
                .packageCode(sub.getServicePackage().getCode())
                .packageName(sub.getServicePackage().getName())
                .maxUsers(sub.getServicePackage().getMaxUsers())
                .maxPosPoints(sub.getServicePackage().getMaxPosPoints())
                .maxInvoicesPerMonth(sub.getServicePackage().getMaxInvoicesPerMonth())
                .dataRetentionDays(sub.getServicePackage().getDataRetentionDays())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .status(sub.getStatus())
                .createdAt(sub.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServicePackageResponse> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(this::mapPackageToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ServicePackageResponse getPackageById(String id) {
        ServicePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND));
        return mapPackageToResponse(pkg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ServicePackageResponse createPackage(String currentUsername, CreateServicePackageRequest request) {
        if (packageRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new AppException(ErrorCode.SERVICE_PACKAGE_CODE_EXISTS);
        }

        ServicePackage pkg = ServicePackage.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .description(request.getDescription())
                .maxUsers(request.getMaxUsers())
                .maxPosPoints(request.getMaxPosPoints())
                .maxInvoicesPerMonth(request.getMaxInvoicesPerMonth())
                .dataRetentionDays(request.getDataRetentionDays())
                .price(request.getPrice())
                .isActive(true)
                .build();

        pkg = packageRepository.save(pkg);
        return mapPackageToResponse(pkg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ServicePackageResponse updatePackage(String currentUsername, String id, UpdateServicePackageRequest request) {
        ServicePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND));

        pkg.setName(request.getName().trim());
        pkg.setDescription(request.getDescription());
        pkg.setMaxUsers(request.getMaxUsers());
        pkg.setMaxPosPoints(request.getMaxPosPoints());
        pkg.setMaxInvoicesPerMonth(request.getMaxInvoicesPerMonth());
        pkg.setDataRetentionDays(request.getDataRetentionDays());
        pkg.setPrice(request.getPrice());
        if (request.getIsActive() != null) {
            pkg.setIsActive(request.getIsActive());
        }

        pkg = packageRepository.save(pkg);
        return mapPackageToResponse(pkg);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePackage(String currentUsername, String id) {
        ServicePackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND));

        if (subscriptionRepository.existsByServicePackageId(id)) {
            // Nếu đã có hộ kinh doanh sử dụng gói này, ngưng kích hoạt gói để bảo toàn toàn vẹn dữ liệu
            pkg.setIsActive(false);
            packageRepository.save(pkg);
        } else {
            packageRepository.delete(pkg);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public HouseholdSubscriptionResponse assignSubscription(
            String currentUsername, String householdId, AssignSubscriptionRequest request) {

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        User adminUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = householdRepository.findById(householdId)
                .orElseThrow(() -> new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND));

        ServicePackage pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND));

        if (!Boolean.TRUE.equals(pkg.getIsActive())) {
            throw new AppException(ErrorCode.SERVICE_PACKAGE_INACTIVE);
        }

        // Nếu hộ đã có subscription đang ACTIVE, expire nó
        Optional<HouseholdSubscription> currentSubOpt = subscriptionRepository
                .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, SubscriptionStatus.ACTIVE);
        currentSubOpt.ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
        });

        HouseholdSubscription newSub = HouseholdSubscription.builder()
                .household(household)
                .servicePackage(pkg)
                .assignedByUser(adminUser)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(SubscriptionStatus.ACTIVE)
                .build();

        newSub = subscriptionRepository.save(newSub);

        logActivity(household, adminUser, "ASSIGN_PACKAGE", newSub.getId(),
                currentSubOpt.map(s -> s.getServicePackage().getCode()).orElse("NONE"),
                pkg.getCode());

        return mapSubscriptionToResponse(newSub);
    }

    @Override
    @Transactional(readOnly = true)
    public HouseholdSubscriptionResponse getActiveSubscription(String householdId) {
        HouseholdSubscription sub = subscriptionRepository
                .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_PACKAGE_NOT_FOUND));

        return mapSubscriptionToResponse(sub);
    }

    @Override
    @Transactional(readOnly = true)
    public HouseholdUsageStatsResponse getUsageStats(String householdId) {
        BusinessHousehold household = householdRepository.findById(householdId)
                .orElseThrow(() -> new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND));

        Optional<HouseholdSubscription> subOpt = subscriptionRepository
                .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, SubscriptionStatus.ACTIVE);

        int maxUsers = subOpt.map(s -> s.getServicePackage().getMaxUsers()).orElse(5);
        int maxPos = subOpt.map(s -> s.getServicePackage().getMaxPosPoints()).orElse(2);
        int maxInvoices = subOpt.map(s -> s.getServicePackage().getMaxInvoicesPerMonth()).orElse(500);
        String pkgCode = subOpt.map(s -> s.getServicePackage().getCode()).orElse("DEFAULT");
        String pkgName = subOpt.map(s -> s.getServicePackage().getName()).orElse("Gói Mặc Định");
        LocalDate pkgEndDate = subOpt.map(HouseholdSubscription::getEndDate).orElse(null);

        long currentUsers = userRepository.countByHouseholdIdAndDeletedAtIsNull(householdId);
        long currentPos = pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull(householdId);

        String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern(DatePatternConstant.YEAR_MONTH));
        Optional<HouseholdUsageStats> statsOpt = usageStatsRepository.findByHouseholdIdAndMonthYear(householdId, currentMonth);

        int invoicesIssued = statsOpt.map(HouseholdUsageStats::getInvoicesIssuedCount).orElse(0);
        boolean isOverQuota = statsOpt.map(HouseholdUsageStats::getIsInvoiceOverQuota).orElse(invoicesIssued > maxInvoices);
        int overQuotaCount = statsOpt.map(HouseholdUsageStats::getOverQuotaInvoiceCount)
                .orElse(Math.max(0, invoicesIssued - maxInvoices));

        String warning = null;
        if (currentUsers >= maxUsers) {
            warning = "Hộ kinh doanh đã đạt giới hạn tối đa " + maxUsers + " người dùng của gói " + pkgName + ". Vui lòng nâng cấp gói để tiếp tục thêm nhân viên.";
        } else if (isOverQuota) {
            warning = "Hộ kinh doanh đã phát hành vượt " + overQuotaCount + " hóa đơn so với hạn mức " + maxInvoices + " hóa đơn/tháng của gói " + pkgName + ".";
        }

        return HouseholdUsageStatsResponse.builder()
                .householdId(household.getId())
                .householdName(household.getName())
                .monthYear(currentMonth)
                .packageCode(pkgCode)
                .packageName(pkgName)
                .packageEndDate(pkgEndDate)
                .currentUsers((int) currentUsers)
                .maxUsers(maxUsers)
                .isUserQuotaReached(currentUsers >= maxUsers)
                .currentPosPoints((int) currentPos)
                .maxPosPoints(maxPos)
                .isPosQuotaReached(currentPos >= maxPos)
                .invoicesIssuedThisMonth(invoicesIssued)
                .maxInvoicesPerMonth(maxInvoices)
                .isInvoiceOverQuota(isOverQuota)
                .overQuotaInvoiceCount(overQuotaCount)
                .warningMessage(warning)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HouseholdUsageStatsResponse getMySubscriptionUsage(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return getUsageStats(household.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public void validateUserQuota(String householdId) {
        Optional<HouseholdSubscription> subOpt = subscriptionRepository
                .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, SubscriptionStatus.ACTIVE);

        if (subOpt.isPresent()) {
            int maxUsers = subOpt.get().getServicePackage().getMaxUsers();
            long currentUsers = userRepository.countByHouseholdIdAndDeletedAtIsNull(householdId);
            if (currentUsers >= maxUsers) {
                // TC-02: Chặn thêm người dùng mới và gợi ý nâng gói
                throw new AppException(ErrorCode.PACKAGE_USER_LIMIT_EXCEEDED);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void validatePosQuota(String householdId) {
        Optional<HouseholdSubscription> subOpt = subscriptionRepository
                .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, SubscriptionStatus.ACTIVE);

        if (subOpt.isPresent()) {
            int maxPos = subOpt.get().getServicePackage().getMaxPosPoints();
            long currentPos = pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull(householdId);
            if (currentPos >= maxPos) {
                throw new AppException(ErrorCode.PACKAGE_POS_LIMIT_EXCEEDED);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recordInvoiceIssued(String householdId) {
        // RÀNG BUỘC PHÁP LÝ GAP 48 & QTN-01 (TC-03): TUYỆT ĐỐI KHÔNG CHẶN PHÁT HÀNH HÓA ĐƠN!
        try {
            BusinessHousehold household = householdRepository.findById(householdId).orElse(null);
            if (household == null) return;

            String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern(DatePatternConstant.YEAR_MONTH));
            HouseholdUsageStats stats = usageStatsRepository.findByHouseholdIdAndMonthYear(householdId, currentMonth)
                    .orElse(HouseholdUsageStats.builder()
                            .household(household)
                            .monthYear(currentMonth)
                            .currentUsersCount((int) userRepository.countByHouseholdIdAndDeletedAtIsNull(householdId))
                            .currentPosCount((int) pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull(householdId))
                            .invoicesIssuedCount(0)
                            .isInvoiceOverQuota(false)
                            .overQuotaInvoiceCount(0)
                            .build());

            stats.setInvoicesIssuedCount(stats.getInvoicesIssuedCount() + 1);

            Optional<HouseholdSubscription> subOpt = subscriptionRepository
                    .findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, SubscriptionStatus.ACTIVE);

            int maxInvoices = subOpt.map(s -> s.getServicePackage().getMaxInvoicesPerMonth()).orElse(500);

            if (stats.getInvoicesIssuedCount() > maxInvoices) {
                stats.setIsInvoiceOverQuota(true);
                stats.setOverQuotaInvoiceCount(stats.getInvoicesIssuedCount() - maxInvoices);
                log.warn("Household {} has exceeded invoice monthly quota ({}/{}). Over-quota count: {}",
                        householdId, stats.getInvoicesIssuedCount(), maxInvoices, stats.getOverQuotaInvoiceCount());
            }

            usageStatsRepository.save(stats);
        } catch (Exception e) {
            log.error("Failed to record invoice usage for household {}", householdId, e);
        }
    }
}
