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
import com.sales.entity.InvoiceNumberRange;
import com.sales.repository.InvoiceNumberRangeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceTemplateServiceImpl implements InvoiceTemplateService {

    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final UserRepository userRepository;
    private final InvoiceNumberRangeRepository invoiceNumberRangeRepository;

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

        ensureRangeExistsForConfiguredTemplate(household, template.getInvoicePattern(), template.getInvoiceSymbol());

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

        // Tự động đảm bảo có dải số trong lịch sử dải số đã khai báo với số hiện tại bắt đầu từ 0 và trạng thái Đang sử dụng (ACTIVE)
        ensureRangeExistsForConfiguredTemplate(household, saved.getInvoicePattern(), saved.getInvoiceSymbol());

        return mapToResponse(saved);
    }

    private void ensureRangeExistsForConfiguredTemplate(BusinessHousehold household, String pattern, String symbol) {
        if (pattern == null || symbol == null || pattern.trim().isEmpty() || symbol.trim().isEmpty()) {
            return;
        }
        String cleanPattern = pattern.trim();
        String cleanSymbol = symbol.trim().toUpperCase();

        List<InvoiceNumberRange> existingRanges = invoiceNumberRangeRepository.findOverlappingRanges(
                household.getId(), cleanPattern, cleanSymbol);

        if (existingRanges.isEmpty()) {
            InvoiceNumberRange newRange = InvoiceNumberRange.builder()
                    .household(household)
                    .invoicePattern(cleanPattern)
                    .invoiceSymbol(cleanSymbol)
                    .startNumber(1)
                    .endNumber(100000)
                    .currentNumber(0)
                    .warningThreshold(50)
                    .status("ACTIVE")
                    .build();
            invoiceNumberRangeRepository.save(newRange);
            log.info("Tự động khởi tạo dải số mới khi cấu hình mẫu hóa đơn {}: Pattern={}, Symbol={}, Start=1, End=100000, Current=0",
                    household.getId(), cleanPattern, cleanSymbol);
        } else {
            // Nếu đã có dải số cho mẫu này, kích hoạt lại nếu chưa hết số
            for (InvoiceNumberRange r : existingRanges) {
                if (!"EXHAUSTED".equals(r.getStatus()) && r.getCurrentNumber() < r.getEndNumber()) {
                    r.setStatus("ACTIVE");
                    invoiceNumberRangeRepository.save(r);
                    break;
                }
            }
        }
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
