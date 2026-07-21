package com.viet.sales.service.classes;

import com.viet.sales.dto.request.InvoiceTemplateRequest;
import com.viet.sales.dto.response.InvoiceTemplateResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.InvoiceTemplate;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.InvoiceTemplateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.InvoiceTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceTemplateServiceImpl implements InvoiceTemplateService {

    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final UserRepository userRepository;

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

        InvoiceTemplate template = invoiceTemplateRepository.findByHouseholdId(household.getId())
                .orElse(InvoiceTemplate.builder()
                        .household(household)
                        .build());

        template.setInvoicePattern(request.getInvoicePattern());
        template.setInvoiceSymbol(request.getInvoiceSymbol());
        template.setTitle(request.getTitle());
        template.setFooterNote(request.getFooterNote());

        InvoiceTemplate saved = invoiceTemplateRepository.save(template);
        log.info("Cấu hình mẫu hóa đơn được cập nhật bởi user {}: Pattern={}, Symbol={}", 
                currentUsername, saved.getInvoicePattern(), saved.getInvoiceSymbol());

        return mapToResponse(saved);
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
