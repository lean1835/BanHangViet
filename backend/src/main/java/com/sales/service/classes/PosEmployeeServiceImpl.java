package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.AssignPosEmployeeRequest;
import com.sales.dto.response.PosEmployeeResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.PosEmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PosEmployeeServiceImpl implements PosEmployeeService {

    private final UserRepository userRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

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

    private PointOfSale getValidPointOfSale(String posId, String householdId) {
        return pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));
    }

    private PosEmployeeResponse mapToResponse(User user) {
        PointOfSale pos = user.getPointOfSale();
        return PosEmployeeResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .roleCode(user.getRole() != null ? user.getRole().getCode() : null)
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .pointOfSaleId(pos != null ? pos.getId() : null)
                .pointOfSaleName(pos != null ? pos.getName() : null)
                .posCode(pos != null ? pos.getPosCode() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
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
                    household, actor, action, "users_pos", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho gán nhân viên điểm bán", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<PosEmployeeResponse> getEmployeesByPos(String currentUsername, String posId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        // Kiểm tra điểm bán tồn tại trong hộ
        getValidPointOfSale(posId, household.getId());

        List<User> employees = userRepository.findByHouseholdIdAndPointOfSaleIdAndDeletedAtIsNull(household.getId(), posId);
        return employees.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<PosEmployeeResponse> assignEmployeesToPos(String currentUsername, String posId, AssignPosEmployeeRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = getValidPointOfSale(posId, household.getId());
        if (Boolean.FALSE.equals(pos.getIsActive())) {
            throw new AppException(ErrorCode.CANNOT_SET_INACTIVE_POS_AS_DEFAULT);
        }

        List<PosEmployeeResponse> updatedList = new ArrayList<>();

        for (String userId : request.getUserIds()) {
            User user = userRepository.findById(userId)
                    .filter(u -> u.getDeletedAt() == null)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Kiểm tra thuộc cùng hộ kinh doanh
            if (user.getHousehold() == null || !user.getHousehold().getId().equals(household.getId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            // Không gán điểm bán cố định cho chủ hộ
            if (user.getRole() != null && "VT-01".equals(user.getRole().getCode())) {
                throw new AppException(ErrorCode.CANNOT_ASSIGN_OWNER_TO_POS);
            }

            Map<String, Object> oldValue = new HashMap<>();
            oldValue.put("userId", user.getId());
            oldValue.put("username", user.getUsername());
            oldValue.put("oldPosId", user.getPointOfSale() != null ? user.getPointOfSale().getId() : null);

            user.setPointOfSale(pos);
            User savedUser = userRepository.save(user);

            // Xóa cache
            if (cacheManager.getCache("users") != null) {
                cacheManager.getCache("users").evict(user.getUsername());
            }

            Map<String, Object> newValue = new HashMap<>();
            newValue.put("userId", savedUser.getId());
            newValue.put("username", savedUser.getUsername());
            newValue.put("newPosId", pos.getId());
            newValue.put("posName", pos.getName());

            logActivity(household, currentUser, "ASSIGN_EMPLOYEE_TO_POS", savedUser.getId(), oldValue, newValue);
            updatedList.add(mapToResponse(savedUser));
        }

        log.info("Gán thành công {} nhân viên vào điểm bán {} ({})", updatedList.size(), pos.getName(), pos.getId());
        return updatedList;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unassignEmployeeFromPos(String currentUsername, String posId, String userId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        getValidPointOfSale(posId, household.getId());

        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getHousehold() == null || !user.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (user.getPointOfSale() != null && user.getPointOfSale().getId().equals(posId)) {
            Map<String, Object> oldValue = new HashMap<>();
            oldValue.put("userId", user.getId());
            oldValue.put("posId", posId);

            user.setPointOfSale(null);
            userRepository.save(user);

            if (cacheManager.getCache("users") != null) {
                cacheManager.getCache("users").evict(user.getUsername());
            }

            Map<String, Object> newValue = new HashMap<>();
            newValue.put("userId", user.getId());
            newValue.put("posId", null);

            logActivity(household, currentUser, "UNASSIGN_EMPLOYEE_FROM_POS", user.getId(), oldValue, newValue);
            log.info("Gỡ thành công nhân viên {} khỏi điểm bán {}", user.getUsername(), posId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PosEmployeeResponse getEmployeePos(String currentUsername, String userId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getHousehold() == null || !user.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return mapToResponse(user);
    }
}
