package com.sales.modules.auth.service.impl;
import com.sales.modules.audit.service.impl.ActivityLogHelper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.auth.dto.request.CreateEmployeeRequest;
import com.sales.modules.auth.dto.request.UpdateEmployeeRequest;
import com.sales.modules.auth.dto.response.EmployeeResponse;
import com.sales.common.constant.ShiftStatus;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.pos.entity.Shift;
import com.sales.modules.order.entity.Order;
import com.sales.modules.pos.entity.PointOfSale;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.common.constant.CashTransactionStatus;
import com.sales.common.constant.CashTransactionType;
import com.sales.modules.pos.entity.ShiftHandover;
import com.sales.modules.pos.repository.CashTransactionRepository;
import com.sales.modules.pos.repository.ShiftHandoverRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.pos.repository.ShiftRepository;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.pos.repository.PointOfSaleRepository;
import com.sales.modules.auth.service.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import com.sales.modules.auth.dto.request.AdminResetEmployeePasswordRequest;
import com.sales.modules.platform.service.ServicePackageService;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ActivityLogHelper activityLogHelper;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;
    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final CashTransactionRepository cashTransactionRepository;
    private final ShiftHandoverRepository shiftHandoverRepository;
    private final ServicePackageService servicePackageService;

    private void closeActiveShiftOfUser(User employee) {
        Optional<Shift> activeShiftOpt = shiftRepository.findByUserIdAndStatus(employee.getId(), ShiftStatus.OPEN);
        if (activeShiftOpt.isPresent()) {
            Shift shift = activeShiftOpt.get();

            List<Order> pendingOrders = orderRepository.findByShiftIdAndDeletedAtIsNull(shift.getId());
            for (Order order : pendingOrders) {
                if ("CREATING".equals(order.getStatus())) {
                    order.setStatus("CANCELED");
                    orderRepository.save(order);
                }
            }

            BigDecimal cashSales = orderRepository.sumCashSalesAmountByShiftId(shift.getId());
            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalExpense = BigDecimal.ZERO;
            if (cashTransactionRepository != null) {
                totalIncome = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                        shift.getId(), CashTransactionType.INCOME, CashTransactionStatus.APPROVED);
                totalExpense = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                        shift.getId(), CashTransactionType.EXPENSE, CashTransactionStatus.APPROVED);
            }
            BigDecimal expectedCash = shift.getOpeningCash()
                    .add(cashSales != null ? cashSales : BigDecimal.ZERO)
                    .add(totalIncome != null ? totalIncome : BigDecimal.ZERO)
                    .subtract(totalExpense != null ? totalExpense : BigDecimal.ZERO);

            if (shiftHandoverRepository != null) {
                List<ShiftHandover> prevHandovers = shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(shift.getId());
                if (prevHandovers != null && !prevHandovers.isEmpty()) {
                    BigDecimal totalHandoverDiff = prevHandovers.stream()
                            .map(ShiftHandover::getDifferenceAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    expectedCash = expectedCash.add(totalHandoverDiff);
                }
            }

            shift.setClosedAt(LocalDateTime.now());
            shift.setClosingCashExpected(expectedCash);
            shift.setClosingCashActual(expectedCash);
            shift.setDifferenceAmount(BigDecimal.ZERO);
            shift.setDifferenceReason("Hệ thống tự động đóng ca do khóa/xóa tài khoản nhân viên.");
            shift.setStatus(ShiftStatus.CLOSED);
            shiftRepository.save(shift);

            Map<String, Object> logMap = new HashMap<>();
            logMap.put("id", shift.getId());
            logMap.put("status", "CLOSED");
            logMap.put("closingCashExpected", expectedCash);
            logMap.put("closingCashActual", expectedCash);
            logMap.put("differenceAmount", BigDecimal.ZERO);
            logActivity(shift.getHousehold(), employee, "CLOSE_SHIFT", shift.getId(), null, logMap);
        }
    }

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "users", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log", e);
        }
    }

    private Map<String, Object> buildUserLogMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("fullName", user.getFullName());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("email", user.getEmail());
        map.put("roleCode", user.getRole() != null ? user.getRole().getCode() : null);
        map.put("pointOfSaleId", user.getPointOfSale() != null ? user.getPointOfSale().getId() : null);
        map.put("isActive", user.getIsActive());
        map.put("deletedAt", user.getDeletedAt());
        return map;
    }

    private EmployeeResponse mapToResponse(User user) {
        PointOfSale pos = user.getPointOfSale();
        return EmployeeResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .roleCode(user.getRole().getCode())
                .roleName(user.getRole().getName())
                .pointOfSaleId(pos != null ? pos.getId() : null)
                .pointOfSaleName(pos != null ? pos.getName() : null)
                .posCode(pos != null ? pos.getPosCode() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<User> employees = userRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId()).stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .collect(Collectors.toList());

        return employees.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EmployeeResponse createEmployee(String currentUsername, CreateEmployeeRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        servicePackageService.validateUserQuota(household.getId());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        if (!request.getRoleCode().equals("VT-02") && !request.getRoleCode().equals("VT-03")) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        Role role = roleRepository.findByCode(request.getRoleCode())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        PointOfSale pointOfSale = null;
        if (request.getPointOfSaleId() != null && !request.getPointOfSaleId().trim().isEmpty()) {
            pointOfSale = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getPointOfSaleId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));
        } else {
            pointOfSale = pointOfSaleRepository.findByHouseholdIdAndIsDefaultTrueAndDeletedAtIsNull(household.getId())
                    .orElse(null);
        }

        User newEmployee = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null)
                .role(role)
                .household(household)
                .pointOfSale(pointOfSale)
                .isActive(true)
                .build();

        newEmployee = userRepository.save(newEmployee);

        logActivity(household, currentUser, "CREATE_EMPLOYEE", newEmployee.getId(), null, buildUserLogMap(newEmployee));

        return mapToResponse(newEmployee);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(String currentUsername, String employeeId, UpdateEmployeeRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User employee = userRepository.findById(employeeId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (employee.getHousehold() == null || !employee.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (employeeId.equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (!request.getRoleCode().equals("VT-02") && !request.getRoleCode().equals("VT-03")) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        Role role = roleRepository.findByCode(request.getRoleCode())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        if (request.getPointOfSaleId() != null) {
            if (!request.getPointOfSaleId().trim().isEmpty()) {
                PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getPointOfSaleId(), household.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));
                employee.setPointOfSale(pos);
            } else {
                employee.setPointOfSale(null);
            }
        }

        Map<String, Object> oldValueMap = buildUserLogMap(employee);

        boolean oldActive = employee.getIsActive();

        employee.setFullName(request.getFullName());
        employee.setPhoneNumber(request.getPhoneNumber());
        if (request.getEmail() != null) {
            employee.setEmail(request.getEmail().trim().isEmpty() ? null : request.getEmail().trim());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            employee.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
            employee.setPasswordChangedAt(LocalDateTime.now());
            employee.setMustChangePassword(false);
        }
        employee.setRole(role);
        employee.setIsActive(request.getIsActive());

        if (oldActive && !request.getIsActive()) {
            closeActiveShiftOfUser(employee);
        }

        employee = userRepository.save(employee);

        if (cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(employee.getUsername());
        }

        String action = "UPDATE_EMPLOYEE";
        if (oldActive != request.getIsActive()) {
            action = request.getIsActive() ? "UNLOCK_EMPLOYEE" : "LOCK_EMPLOYEE";
        }

        logActivity(household, currentUser, action, employee.getId(), oldValueMap, buildUserLogMap(employee));

        return mapToResponse(employee);
    }

    @Override
    @Transactional
    public void deleteEmployee(String currentUsername, String employeeId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        User employee = userRepository.findById(employeeId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (employee.getHousehold() == null || !employee.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (employeeId.equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Map<String, Object> oldValueMap = buildUserLogMap(employee);

        closeActiveShiftOfUser(employee);

        employee.setDeletedAt(LocalDateTime.now());
        employee.setIsActive(false);
        userRepository.save(employee);

        if (cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(employee.getUsername());
        }

        logActivity(household, currentUser, "DELETE_EMPLOYEE", employee.getId(), oldValueMap, buildUserLogMap(employee));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetEmployeePassword(String currentUsername, String employeeId, AdminResetEmployeePasswordRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (currentUser.getRole() == null || !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        User employee = userRepository.findById(employeeId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (employee.getHousehold() == null || !employee.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        LocalDateTime now = LocalDateTime.now();
        employee.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        employee.setMustChangePassword(true);
        employee.setPasswordChangedAt(now);
        userRepository.save(employee);

        if (cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(employee.getUsername());
        }

        Map<String, Object> logDetail = new HashMap<>();
        logDetail.put("employeeId", employee.getId());
        logDetail.put("employeeUsername", employee.getUsername());
        logDetail.put("resetBy", currentUser.getUsername());

        logActivity(household, currentUser, "RESET_EMPLOYEE_PASSWORD", employee.getId(), null, logDetail);
    }
}
