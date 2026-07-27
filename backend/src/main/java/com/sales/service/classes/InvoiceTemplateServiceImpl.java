package com.sales.service.classes;

import com.sales.dto.request.InvoiceTemplateRequest;
import com.sales.dto.response.InvoiceTemplateResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.InvoiceTemplate;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.InvoiceTemplateService;
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
    @Transactional(rollbackFor = Exception.class)
    public InvoiceTemplateResponse getTemplateByHousehold(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        InvoiceTemplate template = invoiceTemplateRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> invoiceTemplateRepository.save(InvoiceTemplate.builder()
                        .household(household)
                        .invoicePattern("1")
                        .invoiceSymbol("1C26TAA")
                        .title("HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                        .footerNote(
                                "Cảm ơn quý khách đã mua hàng! Hóa đơn điện tử khởi tạo từ máy tính tiền có mã của CQT.")
                        .build()));

        return mapToResponse(template);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceTemplateResponse updateTemplate(String currentUsername, InvoiceTemplateRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);

        // Chỉ vai trò VT-01 (Chủ hộ) hoặc VT-03 (Kế toán) được phép cập nhật cấu hình
        // mẫu
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
