package com.sales.service.classes;

import com.sales.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.dto.response.AutoRetrySettingsResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.BusinessHouseholdSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessHouseholdSettingsServiceImpl implements BusinessHouseholdSettingsService {

    private final UserRepository userRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private BusinessHouseholdSettings getOrCreateSettingsEntity(BusinessHousehold household) {
        return settingsRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> settingsRepository.save(BusinessHouseholdSettings.builder()
                        .household(household)
                        .autoRetryEnabled(true)
                        .maxRetryAttempts(3)
                        .retryIntervalMinutes(15)
                        .maxRetryHoursDeadline(24)
                        .build()));
    }

    private AutoRetrySettingsResponse mapToResponse(BusinessHouseholdSettings settings) {
        return AutoRetrySettingsResponse.builder()
                .id(settings.getId())
                .householdId(settings.getHousehold().getId())
                .autoRetryEnabled(settings.getAutoRetryEnabled())
                .maxRetryAttempts(settings.getMaxRetryAttempts())
                .retryIntervalMinutes(settings.getRetryIntervalMinutes())
                .maxRetryHoursDeadline(settings.getMaxRetryHoursDeadline())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AutoRetrySettingsResponse getSettings(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        BusinessHouseholdSettings settings = settingsRepository.findByHouseholdId(household.getId())
                .orElse(null);
        if (settings == null) {
            return AutoRetrySettingsResponse.builder()
                    .id(null)
                    .householdId(household.getId())
                    .autoRetryEnabled(true)
                    .maxRetryAttempts(3)
                    .retryIntervalMinutes(15)
                    .maxRetryHoursDeadline(24)
                    .updatedAt(null)
                    .build();
        }
        return mapToResponse(settings);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AutoRetrySettingsResponse updateSettings(String currentUsername, UpdateAutoRetrySettingsRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        String role = user.getRole() != null ? user.getRole().getCode() : "";
        if (!"VT-01".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHouseholdSettings settings = getOrCreateSettingsEntity(household);

        Map<String, Object> oldVal = new HashMap<>();
        oldVal.put("autoRetryEnabled", settings.getAutoRetryEnabled());
        oldVal.put("maxRetryAttempts", settings.getMaxRetryAttempts());
        oldVal.put("retryIntervalMinutes", settings.getRetryIntervalMinutes());
        oldVal.put("maxRetryHoursDeadline", settings.getMaxRetryHoursDeadline());

        settings.setAutoRetryEnabled(request.getAutoRetryEnabled());
        settings.setMaxRetryAttempts(request.getMaxRetryAttempts());
        settings.setRetryIntervalMinutes(request.getRetryIntervalMinutes());
        settings.setMaxRetryHoursDeadline(request.getMaxRetryHoursDeadline());

        BusinessHouseholdSettings saved = settingsRepository.save(settings);

        Map<String, Object> newVal = new HashMap<>();
        newVal.put("autoRetryEnabled", saved.getAutoRetryEnabled());
        newVal.put("maxRetryAttempts", saved.getMaxRetryAttempts());
        newVal.put("retryIntervalMinutes", saved.getRetryIntervalMinutes());
        newVal.put("maxRetryHoursDeadline", saved.getMaxRetryHoursDeadline());

        try {
            String oldStr = objectMapper.writeValueAsString(oldVal);
            String newStr = objectMapper.writeValueAsString(newVal);
            activityLogHelper.logActivityInNewTransaction(
                    household, user, "UPDATE_HOUSEHOLD_SETTINGS", "business_household_settings",
                    saved.getId(), oldStr, newStr, null, null);
        } catch (Exception e) {
            log.error("Không thể ghi activity log khi cập nhật cấu hình hộ kinh doanh", e);
        }

        log.info("Cập nhật cấu hình tự động gửi lại hóa đơn cho hộ ID={}: maxAttempts={}, interval={}m, deadline={}h",
                household.getId(), saved.getMaxRetryAttempts(), saved.getRetryIntervalMinutes(), saved.getMaxRetryHoursDeadline());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessHouseholdSettings getEntityByHouseholdId(String householdId) {
        return settingsRepository.findByHouseholdId(householdId)
                .orElse(null);
    }
}
