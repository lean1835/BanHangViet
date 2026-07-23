package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.TaxRateRequest;
import com.viet.sales.dto.response.TaxRateResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.TaxRate;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.TaxRateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.TaxRateService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxRateServiceImpl implements TaxRateService {

    private final TaxRateRepository taxRateRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private BusinessHousehold validateUserAndHousehold(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);

        // Chủ hộ (VT-01) hoặc Kế toán (VT-03)
        String roleCode = currentUser.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return household;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxRateResponse> getAllTaxRates(String currentUsername) {
        BusinessHousehold household = validateUserAndHousehold(currentUsername);
        List<TaxRate> taxRates = taxRateRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId());
        return taxRates.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxRateResponse createTaxRate(String currentUsername, TaxRateRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = validateUserAndHousehold(currentUsername);

        validateTaxRateRequest(request, household.getId(), null);

        TaxRate taxRate = TaxRate.builder()
                .household(household)
                .name(request.getName().trim())
                .ratePercentage(request.getRatePercentage())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        TaxRate saved = taxRateRepository.save(taxRate);

        logActivity(household, currentUser, "CREATE_TAX_RATE", saved.getId(), null, buildTaxRateLogMap(saved));

        log.info("Tạo mức thuế suất thành công: name={}, rate={}%", saved.getName(), saved.getRatePercentage());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxRateResponse updateTaxRate(String currentUsername, String id, TaxRateRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = validateUserAndHousehold(currentUsername);

        TaxRate taxRate = taxRateRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_RATE_NOT_FOUND));

        validateTaxRateRequest(request, household.getId(), id);

        Map<String, Object> oldValue = buildTaxRateLogMap(taxRate);

        taxRate.setName(request.getName().trim());
        taxRate.setRatePercentage(request.getRatePercentage());
        if (request.getIsActive() != null) {
            taxRate.setIsActive(request.getIsActive());
        }

        TaxRate saved = taxRateRepository.save(taxRate);

        logActivity(household, currentUser, "UPDATE_TAX_RATE", saved.getId(), oldValue, buildTaxRateLogMap(saved));

        log.info("Cập nhật mức thuế suất id={}: name={}, rate={}%", saved.getId(), saved.getName(), saved.getRatePercentage());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaxRateResponse toggleTaxRateStatus(String currentUsername, String id, Boolean isActive) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = validateUserAndHousehold(currentUsername);

        TaxRate taxRate = taxRateRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_RATE_NOT_FOUND));

        Map<String, Object> oldValue = buildTaxRateLogMap(taxRate);

        taxRate.setIsActive(isActive != null ? isActive : !taxRate.getIsActive());

        TaxRate saved = taxRateRepository.save(taxRate);

        logActivity(household, currentUser, "TOGGLE_TAX_RATE_STATUS", saved.getId(), oldValue, buildTaxRateLogMap(saved));

        log.info("Cập nhật trạng thái mức thuế suất id={}: isActive={}", saved.getId(), saved.getIsActive());

        return mapToResponse(saved);
    }

    private void validateTaxRateRequest(TaxRateRequest request, String householdId, String excludeId) {
        // Kiểm tra tỷ lệ từ 0.00% đến 100.00%
        if (request.getRatePercentage() == null 
                || request.getRatePercentage().compareTo(BigDecimal.ZERO) < 0 
                || request.getRatePercentage().compareTo(new BigDecimal("100.00")) > 0) {
            throw new AppException(ErrorCode.INVALID_TAX_RATE_PERCENTAGE);
        }

        // Kiểm tra trùng tên thuế suất trong cùng hộ kinh doanh
        String name = request.getName().trim();
        boolean exists = excludeId == null 
                ? taxRateRepository.existsByHouseholdIdAndName(householdId, name)
                : taxRateRepository.existsByHouseholdIdAndNameAndIdNot(householdId, name, excludeId);

        if (exists) {
            throw new AppException(ErrorCode.TAX_RATE_ALREADY_EXISTS);
        }
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
                    .targetTable("tax_rates")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho thuế suất", e);
        }
    }

    private Map<String, Object> buildTaxRateLogMap(TaxRate taxRate) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", taxRate.getId());
        map.put("name", taxRate.getName());
        map.put("ratePercentage", taxRate.getRatePercentage());
        map.put("isActive", taxRate.getIsActive());
        return map;
    }

    private TaxRateResponse mapToResponse(TaxRate taxRate) {
        return TaxRateResponse.builder()
                .id(taxRate.getId())
                .householdId(taxRate.getHousehold().getId())
                .name(taxRate.getName())
                .ratePercentage(taxRate.getRatePercentage())
                .isActive(taxRate.getIsActive())
                .createdAt(taxRate.getCreatedAt())
                .updatedAt(taxRate.getUpdatedAt())
                .build();
    }
}
