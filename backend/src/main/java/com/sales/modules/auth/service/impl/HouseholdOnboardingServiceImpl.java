package com.sales.modules.auth.service.impl;
import com.sales.modules.auth.repository.BusinessHouseholdSettingsRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.invoice.repository.InvoiceNumberRangeRepository;
import com.sales.modules.invoice.repository.InvoiceTemplateRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.tax.repository.TaxRateRepository;
import com.sales.modules.auth.dto.response.OnboardingStatusResponse;
import com.sales.modules.auth.dto.response.OnboardingStatusResponse.OnboardingStepDetail;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.BusinessHouseholdSettings;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.auth.service.HouseholdOnboardingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HouseholdOnboardingServiceImpl implements HouseholdOnboardingService {

    private final UserRepository userRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final InvoiceNumberRangeRepository invoiceNumberRangeRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final TaxRateRepository taxRateRepository;
    private final ProductRepository productRepository;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private BusinessHouseholdSettings resolveSettings(BusinessHousehold household) {
        return settingsRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> BusinessHouseholdSettings.builder()
                        .household(household)
                        .isOnboardingCompleted(false)
                        .isOnboardingSkipped(false)
                        .returnDaysLimit(7)
                        .maxOfflineSyncHours(24)
                        .debtReminderDaysBefore(3)
                        .build());
    }

    private BusinessHouseholdSettings getOrCreateSettings(BusinessHousehold household) {
        return settingsRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> settingsRepository.save(BusinessHouseholdSettings.builder()
                        .household(household)
                        .isOnboardingCompleted(false)
                        .isOnboardingSkipped(false)
                        .returnDaysLimit(7)
                        .maxOfflineSyncHours(24)
                        .debtReminderDaysBefore(3)
                        .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingStatusResponse getOnboardingStatus(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHouseholdSettings settings = resolveSettings(household);

        // 1. Kiểm tra Bước 1: Thông tin hộ kinh doanh (Bắt buộc)
        boolean householdInfoCompleted = StringUtils.hasText(household.getName())
                && StringUtils.hasText(household.getTaxCode());

        // 2. Kiểm tra Bước 2: Ký hiệu & Mẫu số hóa đơn (Bắt buộc)
        boolean invoiceTemplateCompleted = !invoiceNumberRangeRepository.findActiveRangesByHouseholdId(household.getId()).isEmpty()
                || invoiceTemplateRepository.findByHouseholdId(household.getId()).isPresent();

        // 3. Kiểm tra Bước 3: Thuế suất áp dụng (Bắt buộc)
        boolean taxRateCompleted = taxRateRepository.existsByHouseholdIdAndIsActiveTrue(household.getId());

        // 4. Kiểm tra Bước 4: Thêm ít nhất 1 sản phẩm (Bắt buộc)
        boolean productCompleted = productRepository.countByHouseholdIdAndDeletedAtIsNull(household.getId()) > 0;

        // 5. Kiểm tra Bước 5: Tạo nhân viên bán hàng (Tùy chọn)
        boolean staffCompleted = userRepository.existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull(household.getId(), "VT-02");

        boolean allRequiredCompleted = householdInfoCompleted
                && invoiceTemplateCompleted
                && taxRateCompleted
                && productCompleted;

        boolean isCompleted = allRequiredCompleted || Boolean.TRUE.equals(settings.getIsOnboardingCompleted());

        List<OnboardingStepDetail> steps = new ArrayList<>();
        steps.add(OnboardingStepDetail.builder()
                .stepCode("HOUSEHOLD_INFO")
                .stepName("Hoàn thiện thông tin hộ")
                .isRequired(true)
                .isCompleted(householdInfoCompleted)
                .redirectUrl("/settings/household")
                .description("Cập nhật tên hộ, mã số thuế, số điện thoại và địa chỉ kinh doanh")
                .build());

        steps.add(OnboardingStepDetail.builder()
                .stepCode("INVOICE_TEMPLATE")
                .stepName("Khai báo ký hiệu và mẫu số hóa đơn")
                .isRequired(true)
                .isCompleted(invoiceTemplateCompleted)
                .redirectUrl("/settings/invoice-templates")
                .description("Thiết lập mẫu số và dải số ký hiệu hóa đơn theo quy chuẩn TT78")
                .build());

        steps.add(OnboardingStepDetail.builder()
                .stepCode("TAX_RATE")
                .stepName("Chọn mức thuế suất áp dụng")
                .isRequired(true)
                .isCompleted(taxRateCompleted)
                .redirectUrl("/settings/tax-rates")
                .description("Cấu hình danh mục mức thuế suất GTGT đang hiệu lực")
                .build());

        steps.add(OnboardingStepDetail.builder()
                .stepCode("PRODUCT")
                .stepName("Thêm ít nhất một mặt hàng")
                .isRequired(true)
                .isCompleted(productCompleted)
                .redirectUrl("/products/new")
                .description("Tạo mặt hàng đầu tiên để sẵn sàng tính tiền và xuất hóa đơn")
                .build());

        steps.add(OnboardingStepDetail.builder()
                .stepCode("STAFF")
                .stepName("Tạo tài khoản nhân viên")
                .isRequired(false)
                .isCompleted(staffCompleted)
                .redirectUrl("/settings/employees")
                .description("Tạo tài khoản thu ngân/nhân viên bán hàng nếu cửa hàng có người phụ giúp")
                .build());

        int remainingRequired = 0;
        if (!householdInfoCompleted) remainingRequired++;
        if (!invoiceTemplateCompleted) remainingRequired++;
        if (!taxRateCompleted) remainingRequired++;
        if (!productCompleted) remainingRequired++;

        return OnboardingStatusResponse.builder()
                .isCompleted(isCompleted)
                .isSkipped(Boolean.TRUE.equals(settings.getIsOnboardingSkipped()))
                .isReadyForInvoicing(allRequiredCompleted)
                .remainingRequiredSteps(remainingRequired)
                .steps(steps)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OnboardingStatusResponse skipOnboarding(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        String role = user.getRole() != null ? user.getRole().getCode() : "";
        if (!"VT-01".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHouseholdSettings settings = getOrCreateSettings(household);
        settings.setIsOnboardingSkipped(true);
        settingsRepository.save(settings);
        log.info("Chủ hộ id={} đã bấm bỏ qua trình hướng dẫn thiết lập lần đầu để vào bán hàng ngay", household.getId());

        return getOnboardingStatus(currentUsername);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OnboardingStatusResponse completeOnboarding(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        String role = user.getRole() != null ? user.getRole().getCode() : "";
        if (!"VT-01".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHouseholdSettings settings = getOrCreateSettings(household);
        OnboardingStatusResponse currentStatus = getOnboardingStatus(currentUsername);
        if (!currentStatus.isReadyForInvoicing()) {
            throw new AppException(ErrorCode.ONBOARDING_INCOMPLETE);
        }

        settings.setIsOnboardingCompleted(true);
        settingsRepository.save(settings);
        log.info("Hộ kinh doanh id={} đã hoàn tất 4 bước thiết lập ban đầu (Onboarding Completed)", household.getId());

        return getOnboardingStatus(currentUsername);
    }
}
