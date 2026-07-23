package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.UpdateHouseholdRequest;
import com.viet.sales.dto.response.HouseholdResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.BusinessHouseholdRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.HouseholdService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class HouseholdServiceImpl implements HouseholdService {

    private final BusinessHouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    private static final Pattern TAX_CODE_PATTERN = Pattern.compile("^[0-9]{10}(-[0-9]{3})?$");

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public HouseholdResponse getMyHousehold(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        
        // Kiểm tra vai trò chủ hộ kinh doanh (VT-01)
        if (!"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        return mapToResponse(household);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public HouseholdResponse updateMyHousehold(String currentUsername, UpdateHouseholdRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);

        // Kiểm tra vai trò chủ hộ kinh doanh (VT-01)
        if (!"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // Validate MST định dạng 10 hoặc 13 chữ số
        if (request.getTaxCode() == null || !TAX_CODE_PATTERN.matcher(request.getTaxCode().trim()).matches()) {
            throw new AppException(ErrorCode.INVALID_TAX_CODE);
        }

        Map<String, Object> oldValue = buildHouseholdLogMap(household);

        household.setName(request.getName().trim());
        household.setTaxCode(request.getTaxCode().trim());
        household.setAddress(request.getAddress().trim());
        household.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getRepresentativeName() != null) {
            household.setRepresentativeName(request.getRepresentativeName().trim());
        }

        BusinessHousehold saved = householdRepository.save(household);

        logActivity(household, currentUser, "UPDATE_HOUSEHOLD", saved.getId(), oldValue, buildHouseholdLogMap(saved));

        log.info("Cập nhật thông tin hộ kinh doanh thành công cho householdId={}", saved.getId());

        return mapToResponse(saved);
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable("business_households")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho cập nhật hộ kinh doanh", e);
        }
    }

    private Map<String, Object> buildHouseholdLogMap(BusinessHousehold household) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", household.getId());
        map.put("name", household.getName());
        map.put("taxCode", household.getTaxCode());
        map.put("address", household.getAddress());
        map.put("phoneNumber", household.getPhoneNumber());
        map.put("representativeName", household.getRepresentativeName());
        return map;
    }

    private HouseholdResponse mapToResponse(BusinessHousehold household) {
        return HouseholdResponse.builder()
                .id(household.getId())
                .taxCode(household.getTaxCode())
                .name(household.getName())
                .address(household.getAddress())
                .phoneNumber(household.getPhoneNumber())
                .representativeName(household.getRepresentativeName())
                .revenueThresholdEnabled(household.getRevenueThresholdEnabled())
                .createdAt(household.getCreatedAt())
                .updatedAt(household.getUpdatedAt())
                .build();
    }
}
