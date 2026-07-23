package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.InvoiceTemplateRequest;
import com.viet.sales.dto.response.InvoiceTemplateResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.InvoiceTemplate;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.InvoiceTemplateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.InvoiceTemplateService;
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
public class InvoiceTemplateServiceImpl implements InvoiceTemplateService {

    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    private static final Pattern INVOICE_SYMBOL_PATTERN = Pattern.compile("^[1-2]?[CK][0-9]{2}[A-Z]{2,3}$");

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceTemplateResponse getTemplateByHousehold(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        InvoiceTemplate template = invoiceTemplateRepository.findByHouseholdId(household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_TEMPLATE_NOT_FOUND));

        return mapToResponse(template);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceTemplateResponse updateTemplate(String currentUsername, InvoiceTemplateRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        
        // Chỉ vai trò VT-01 (Chủ hộ) hoặc VT-03 (Kế toán) được phép cập nhật cấu hình mẫu
        String roleCode = currentUser.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Validate ký hiệu hóa đơn theo Thông tư 78
        if (request.getInvoiceSymbol() == null || !INVOICE_SYMBOL_PATTERN.matcher(request.getInvoiceSymbol().trim()).matches()) {
            throw new AppException(ErrorCode.INVALID_INVOICE_SYMBOL);
        }

        InvoiceTemplate template = invoiceTemplateRepository.findByHouseholdId(household.getId())
                .orElse(InvoiceTemplate.builder()
                        .household(household)
                        .build());

        Map<String, Object> oldValue = template.getId() != null ? buildTemplateLogMap(template) : null;

        template.setInvoicePattern(request.getInvoicePattern().trim());
        template.setInvoiceSymbol(request.getInvoiceSymbol().trim());
        template.setTitle(request.getTitle().trim());
        template.setFooterNote(request.getFooterNote() != null ? request.getFooterNote().trim() : null);

        InvoiceTemplate saved = invoiceTemplateRepository.save(template);

        logActivity(household, currentUser, "UPDATE_INVOICE_TEMPLATE", saved.getId(), oldValue, buildTemplateLogMap(saved));

        log.info("Cấu hình mẫu hóa đơn được cập nhật bởi user {}: Pattern={}, Symbol={}", 
                currentUsername, saved.getInvoicePattern(), saved.getInvoiceSymbol());

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
                    .targetTable("invoice_templates")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho cập nhật mẫu hóa đơn", e);
        }
    }

    private Map<String, Object> buildTemplateLogMap(InvoiceTemplate template) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", template.getId());
        map.put("invoicePattern", template.getInvoicePattern());
        map.put("invoiceSymbol", template.getInvoiceSymbol());
        map.put("title", template.getTitle());
        map.put("footerNote", template.getFooterNote());
        return map;
    }

    private InvoiceTemplateResponse mapToResponse(InvoiceTemplate template) {
        return InvoiceTemplateResponse.builder()
                .id(template.getId())
                .householdId(template.getHousehold().getId())
                .invoicePattern(template.getInvoicePattern())
                .invoiceSymbol(template.getInvoiceSymbol())
                .title(template.getTitle())
                .footerNote(template.getFooterNote())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
