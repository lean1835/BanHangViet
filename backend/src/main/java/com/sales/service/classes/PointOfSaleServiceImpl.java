package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.PointOfSaleRequest;
import com.sales.dto.response.PointOfSaleResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.PointOfSaleService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PointOfSaleServiceImpl implements PointOfSaleService {

    private final PointOfSaleRepository pointOfSaleRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkOwnerRole(User user) {
        if (user.getRole() == null || !"VT-01".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void checkViewPermission(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        String roleCode = user.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-02".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private BusinessHousehold getValidHousehold(User user) {
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        return household;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PointOfSaleResponse createPointOfSale(String currentUsername, PointOfSaleRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        String trimmedName = request.getName() != null ? request.getName().trim() : "";
        if (!StringUtils.hasText(trimmedName)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // Kiểm tra trùng tên điểm bán trong hộ
        if (pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndDeletedAtIsNull(household.getId(), trimmedName)) {
            throw new AppException(ErrorCode.POS_NAME_ALREADY_EXISTS);
        }

        // Tạo hoặc kiểm tra mã điểm bán
        String posCode = request.getPosCode() != null ? request.getPosCode().trim() : "";
        if (!StringUtils.hasText(posCode)) {
            long currentCount = pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull(household.getId());
            posCode = String.format("POS-%02d", currentCount + 1);
            // Đảm bảo không trùng posCode tự sinh
            int suffix = 1;
            while (pointOfSaleRepository.existsByHouseholdIdAndPosCodeIgnoreCaseAndDeletedAtIsNull(household.getId(), posCode)) {
                posCode = String.format("POS-%02d", currentCount + 1 + suffix++);
            }
        } else {
            if (pointOfSaleRepository.existsByHouseholdIdAndPosCodeIgnoreCaseAndDeletedAtIsNull(household.getId(), posCode)) {
                throw new AppException(ErrorCode.POS_CODE_ALREADY_EXISTS);
            }
        }

        // Kiểm tra ký hiệu hóa đơn riêng (nếu có)
        String invoiceSymbol = request.getInvoiceSymbol() != null ? request.getInvoiceSymbol().trim() : null;
        if (StringUtils.hasText(invoiceSymbol)) {
            if (pointOfSaleRepository.existsByHouseholdIdAndInvoiceSymbolIgnoreCaseAndDeletedAtIsNull(household.getId(), invoiceSymbol)) {
                throw new AppException(ErrorCode.POS_INVOICE_SYMBOL_EXISTS);
            }
        } else {
            invoiceSymbol = null;
        }

        // Xử lý cờ mặc định
        long totalPosCount = pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull(household.getId());
        boolean isDefault = (totalPosCount == 0) || Boolean.TRUE.equals(request.getIsDefault());

        if (isDefault && totalPosCount > 0) {
            pointOfSaleRepository.resetAllDefaults(household.getId());
        }

        String trimmedAddress = request.getAddress() != null ? request.getAddress().trim() : "";
        if (!StringUtils.hasText(trimmedAddress)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        PointOfSale pointOfSale = PointOfSale.builder()
                .household(household)
                .posCode(posCode)
                .name(trimmedName)
                .address(trimmedAddress)
                .phoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null)
                .invoiceSymbol(invoiceSymbol)
                .isDefault(isDefault)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        PointOfSale saved = pointOfSaleRepository.save(pointOfSale);

        logActivity(household, currentUser, "CREATE_POINT_OF_SALE", saved.getId(), null, buildPosLogMap(saved));

        log.info("Tạo mới điểm bán thành công: id={}, posCode={}, name={}, householdId={}",
                saved.getId(), saved.getPosCode(), saved.getName(), household.getId());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PointOfSaleResponse updatePointOfSale(String currentUsername, String posId, PointOfSaleRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));

        // Lưu giá trị cũ trước khi thay đổi entity
        Map<String, Object> oldValue = buildPosLogMap(pos);

        String trimmedName = request.getName() != null ? request.getName().trim() : "";
        if (!StringUtils.hasText(trimmedName)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        String trimmedAddress = request.getAddress() != null ? request.getAddress().trim() : "";
        if (!StringUtils.hasText(trimmedAddress)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // Kiểm tra trùng tên với điểm bán khác của hộ
        if (pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndIdNotAndDeletedAtIsNull(household.getId(), trimmedName, pos.getId())) {
            throw new AppException(ErrorCode.POS_NAME_ALREADY_EXISTS);
        }

        // Kiểm tra mã điểm bán nếu sửa
        String posCode = request.getPosCode() != null ? request.getPosCode().trim() : pos.getPosCode();
        if (StringUtils.hasText(posCode)) {
            if (pointOfSaleRepository.existsByHouseholdIdAndPosCodeIgnoreCaseAndIdNotAndDeletedAtIsNull(household.getId(), posCode, pos.getId())) {
                throw new AppException(ErrorCode.POS_CODE_ALREADY_EXISTS);
            }
            pos.setPosCode(posCode);
        }

        // Kiểm tra ký hiệu hóa đơn riêng nếu sửa
        String invoiceSymbol = request.getInvoiceSymbol() != null ? request.getInvoiceSymbol().trim() : null;
        if (StringUtils.hasText(invoiceSymbol)) {
            if (pointOfSaleRepository.existsByHouseholdIdAndInvoiceSymbolIgnoreCaseAndIdNotAndDeletedAtIsNull(household.getId(), invoiceSymbol, pos.getId())) {
                throw new AppException(ErrorCode.POS_INVOICE_SYMBOL_EXISTS);
            }
            pos.setInvoiceSymbol(invoiceSymbol);
        } else {
            pos.setInvoiceSymbol(null);
        }

        // Ràng buộc điểm mặc định & trạng thái hoạt động
        boolean requestedDefault = Boolean.TRUE.equals(request.getIsDefault());
        boolean requestedActive = request.getIsActive() != null ? request.getIsActive() : pos.getIsActive();

        if (requestedDefault && !requestedActive) {
            throw new AppException(ErrorCode.CANNOT_SET_INACTIVE_POS_AS_DEFAULT);
        }

        if (Boolean.TRUE.equals(pos.getIsDefault())) {
            if (!requestedActive) {
                throw new AppException(ErrorCode.CANNOT_DEACTIVATE_DEFAULT_POS);
            }
            if (!requestedDefault) {
                // Không cho tự tắt cờ default của điểm bán mặc định
                throw new AppException(ErrorCode.CANNOT_DEACTIVATE_DEFAULT_POS);
            }
        } else {
            if (requestedDefault) {
                pointOfSaleRepository.resetDefaultExcept(household.getId(), pos.getId());
                pos.setIsDefault(true);
            }
        }

        pos.setName(trimmedName);
        pos.setAddress(trimmedAddress);
        pos.setPhoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null);
        pos.setIsActive(requestedActive);

        PointOfSale updated = pointOfSaleRepository.save(pos);

        logActivity(household, currentUser, "UPDATE_POINT_OF_SALE", updated.getId(), oldValue, buildPosLogMap(updated));

        log.info("Cập nhật điểm bán thành công: id={}, name={}", updated.getId(), updated.getName());

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PointOfSaleResponse getPointOfSaleById(String currentUsername, String posId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));

        return mapToResponse(pos);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PointOfSaleResponse> getAllPointsOfSale(String currentUsername, String keyword, Boolean isActive, Pageable pageable) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        Specification<PointOfSale> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), household.getId()));
            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

            if (isActive != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActive"), isActive));
            }

            if (StringUtils.hasText(keyword)) {
                String searchPattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate codePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("posCode")), searchPattern);
                Predicate addressPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("address")), searchPattern);
                Predicate symbolPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceSymbol")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, codePredicate, addressPredicate, symbolPredicate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return pointOfSaleRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointOfSaleResponse> getActivePointsOfSale(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        return pointOfSaleRepository.findAllByHouseholdIdAndIsActiveTrueAndDeletedAtIsNull(household.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PointOfSaleResponse setDefaultPointOfSale(String currentUsername, String posId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));

        if (Boolean.FALSE.equals(pos.getIsActive())) {
            throw new AppException(ErrorCode.CANNOT_SET_INACTIVE_POS_AS_DEFAULT);
        }

        if (Boolean.TRUE.equals(pos.getIsDefault())) {
            return mapToResponse(pos);
        }

        Map<String, Object> oldValue = buildPosLogMap(pos);

        pointOfSaleRepository.resetDefaultExcept(household.getId(), pos.getId());
        pos.setIsDefault(true);
        PointOfSale saved = pointOfSaleRepository.save(pos);

        logActivity(household, currentUser, "SET_DEFAULT_POINT_OF_SALE", saved.getId(), oldValue, buildPosLogMap(saved));

        log.info("Đặt điểm bán mặc định thành công: id={}, name={}", saved.getId(), saved.getName());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePointOfSale(String currentUsername, String posId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));

        if (Boolean.TRUE.equals(pos.getIsDefault())) {
            throw new AppException(ErrorCode.CANNOT_DELETE_DEFAULT_POS);
        }

        Map<String, Object> oldValue = buildPosLogMap(pos);

        pos.setDeletedAt(LocalDateTime.now());
        pos.setIsActive(false);
        PointOfSale saved = pointOfSaleRepository.save(pos);

        logActivity(household, currentUser, "DELETE_POINT_OF_SALE", saved.getId(), oldValue, buildPosLogMap(saved));

        log.info("Xóa (soft-delete) điểm bán thành công: id={}, name={}", saved.getId(), saved.getName());
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(
                    household, actor, action, "points_of_sale", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho điểm bán", e);
        }
    }

    private Map<String, Object> buildPosLogMap(PointOfSale pos) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", pos.getId());
        map.put("posCode", pos.getPosCode());
        map.put("name", pos.getName());
        map.put("address", pos.getAddress());
        map.put("phoneNumber", pos.getPhoneNumber());
        map.put("invoiceSymbol", pos.getInvoiceSymbol());
        map.put("isDefault", pos.getIsDefault());
        map.put("isActive", pos.getIsActive());
        map.put("deletedAt", pos.getDeletedAt());
        return map;
    }

    private PointOfSaleResponse mapToResponse(PointOfSale pos) {
        return PointOfSaleResponse.builder()
                .id(pos.getId())
                .householdId(pos.getHousehold() != null ? pos.getHousehold().getId() : null)
                .posCode(pos.getPosCode())
                .name(pos.getName())
                .address(pos.getAddress())
                .phoneNumber(pos.getPhoneNumber())
                .invoiceSymbol(pos.getInvoiceSymbol())
                .isDefault(pos.getIsDefault())
                .isActive(pos.getIsActive())
                .createdAt(pos.getCreatedAt())
                .updatedAt(pos.getUpdatedAt())
                .build();
    }
}
