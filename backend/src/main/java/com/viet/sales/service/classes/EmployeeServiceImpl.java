package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateEmployeeRequest;
import com.viet.sales.dto.request.UpdateEmployeeRequest;
import com.viet.sales.dto.response.EmployeeResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.RoleRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final HttpServletRequest httpServletRequest;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            String clientIp = httpServletRequest != null ? httpServletRequest.getRemoteAddr() : null;
            String userAgent = httpServletRequest != null ? httpServletRequest.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable("users")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
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
        map.put("roleCode", user.getRole() != null ? user.getRole().getCode() : null);
        map.put("isActive", user.getIsActive());
        map.put("deletedAt", user.getDeletedAt());
        return map;
    }

    private EmployeeResponse mapToResponse(User user) {
        return EmployeeResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .roleCode(user.getRole().getCode())
                .roleName(user.getRole().getName())
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

        // List all users in the same household who have not been soft deleted, excluding the owner themselves
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

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        Role role = roleRepository.findByCode(request.getRoleCode())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User newEmployee = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .household(household)
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

        // Check cross-household security
        if (employee.getHousehold() == null || !employee.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Role role = roleRepository.findByCode(request.getRoleCode())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        Map<String, Object> oldValueMap = buildUserLogMap(employee);

        boolean oldActive = employee.getIsActive();

        employee.setFullName(request.getFullName());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setRole(role);
        employee.setIsActive(request.getIsActive());

        employee = userRepository.save(employee);

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

        // Check cross-household security
        if (employee.getHousehold() == null || !employee.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Map<String, Object> oldValueMap = buildUserLogMap(employee);

        // Soft delete
        employee.setDeletedAt(LocalDateTime.now());
        employee.setIsActive(false); // also deactivate upon deletion
        userRepository.save(employee);

        logActivity(household, currentUser, "DELETE_EMPLOYEE", employee.getId(), oldValueMap, buildUserLogMap(employee));
    }
}
