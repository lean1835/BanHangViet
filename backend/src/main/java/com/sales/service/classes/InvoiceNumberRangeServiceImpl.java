package com.sales.service.classes;

import com.sales.dto.request.CreateInvoiceNumberRangeRequest;
import com.sales.dto.response.InvoiceNumberRangeResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.InvoiceNumberRange;
import com.sales.entity.InvoiceTemplate;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceNumberRangeRepository;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.InvoiceNumberRangeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceNumberRangeServiceImpl implements InvoiceNumberRangeService {

    private final InvoiceNumberRangeRepository rangeRepository;
    private final UserRepository userRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final BusinessHouseholdRepository householdRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;


    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkManagementRole(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        String roleCode = user.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceNumberRangeResponse createRange(String currentUsername, CreateInvoiceNumberRangeRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkManagementRole(currentUser);

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (request.getEndNumber() < request.getStartNumber()) {
            throw new AppException(ErrorCode.INVOICE_RANGE_INVALID);
        }

        // Validate overlapping ranges with same pattern and symbol (F-05)
        List<InvoiceNumberRange> overlapping = rangeRepository.findOverlappingRanges(
                household.getId(), request.getInvoicePattern(), request.getInvoiceSymbol());
        for (InvoiceNumberRange existing : overlapping) {
            if (request.getStartNumber() <= existing.getEndNumber() && request.getEndNumber() >= existing.getStartNumber()) {
                throw new AppException(ErrorCode.INVOICE_RANGE_OVERLAP);
            }
        }

        InvoiceNumberRange range = InvoiceNumberRange.builder()
                .household(household)
                .invoicePattern(request.getInvoicePattern())
                .invoiceSymbol(request.getInvoiceSymbol())
                .startNumber(request.getStartNumber())
                .endNumber(request.getEndNumber())
                .currentNumber(request.getStartNumber() - 1)
                .warningThreshold(request.getWarningThreshold())
                .status("ACTIVE")
                .build();

        InvoiceNumberRange saved = rangeRepository.save(range);
        log.info("Khai báo dải số HĐĐT mới cho hộ ID={}: Pattern={}, Symbol={}, Start={}, End={}",
                household.getId(), saved.getInvoicePattern(), saved.getInvoiceSymbol(),
                saved.getStartNumber(), saved.getEndNumber());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceNumberRangeResponse getActiveRange(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Optional<InvoiceTemplate> templateOpt = invoiceTemplateRepository.findByHouseholdId(household.getId());
        String configuredPattern = templateOpt.map(InvoiceTemplate::getInvoicePattern).map(String::trim).orElse(null);
        String configuredSymbol = templateOpt.map(InvoiceTemplate::getInvoiceSymbol).map(String::trim).orElse(null);

        if (configuredPattern != null && configuredSymbol != null) {
            List<InvoiceNumberRange> configuredRanges = rangeRepository.findActiveRangesForUpdate(
                    household.getId(), configuredPattern, configuredSymbol);
            if (!configuredRanges.isEmpty()) {
                return mapToResponse(configuredRanges.get(0), configuredPattern, configuredSymbol);
            }

            // Tự động khởi tạo dải số mới cho mẫu hóa đơn cấu hình nếu chưa có
            InvoiceNumberRange autoRange = InvoiceNumberRange.builder()
                    .household(household)
                    .invoicePattern(configuredPattern)
                    .invoiceSymbol(configuredSymbol)
                    .startNumber(1)
                    .endNumber(100000)
                    .currentNumber(0)
                    .warningThreshold(50)
                    .status("ACTIVE")
                    .build();
            InvoiceNumberRange saved = rangeRepository.save(autoRange);
            log.info("Tự động khởi tạo dải số mặc định cho mẫu cấu hình {}: Pattern={}, Symbol={}",
                    household.getId(), configuredPattern, configuredSymbol);
            return mapToResponse(saved, configuredPattern, configuredSymbol);
        }

        List<InvoiceNumberRange> ranges = rangeRepository.findActiveRangesByHouseholdId(household.getId());
        if (ranges.isEmpty()) {
            // Check if there are any ranges at all
            List<String> statuses = List.of("ACTIVE", "WARNING_LOW", "EXHAUSTED");
            InvoiceNumberRange range = rangeRepository
                    .findFirstByHouseholdIdAndStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(household.getId(), statuses)
                    .orElseThrow(() -> new AppException(ErrorCode.INVOICE_RANGE_NOT_FOUND));
            return mapToResponse(range, configuredPattern, configuredSymbol);
        }

        return mapToResponse(ranges.get(0), configuredPattern, configuredSymbol);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PageResponse<InvoiceNumberRangeResponse> getAllRanges(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Optional<InvoiceTemplate> templateOpt = invoiceTemplateRepository.findByHouseholdId(household.getId());
        String configuredPattern = templateOpt.map(InvoiceTemplate::getInvoicePattern).map(String::trim).orElse(null);
        String configuredSymbol = templateOpt.map(InvoiceTemplate::getInvoiceSymbol).map(String::trim).orElse(null);

        // Đảm bảo mẫu cấu hình luôn có dải số trong lịch sử dải số đã khai báo bắt đầu từ 0 và có trạng thái Đang sử dụng
        if (configuredPattern != null && configuredSymbol != null && !configuredPattern.isEmpty() && !configuredSymbol.isEmpty()) {
            List<InvoiceNumberRange> existingConfigured = rangeRepository.findOverlappingRanges(
                    household.getId(), configuredPattern, configuredSymbol);
            if (existingConfigured.isEmpty()) {
                InvoiceNumberRange autoRange = InvoiceNumberRange.builder()
                        .household(household)
                        .invoicePattern(configuredPattern)
                        .invoiceSymbol(configuredSymbol)
                        .startNumber(1)
                        .endNumber(100000)
                        .currentNumber(0)
                        .warningThreshold(50)
                        .status("ACTIVE")
                        .build();
                rangeRepository.save(autoRange);
                log.info("Tự động khởi tạo dải số cho mẫu hóa đơn cấu hình {}: Pattern={}, Symbol={}",
                        household.getId(), configuredPattern, configuredSymbol);
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InvoiceNumberRange> pageData = rangeRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId(), pageable);

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long countLast7Days = eInvoiceRepository.countByHouseholdIdAndCreatedAtAfter(household.getId(), sevenDaysAgo);
        double dailyRate = Math.round((countLast7Days / 7.0) * 100.0) / 100.0;

        List<InvoiceNumberRangeResponse> content = pageData.getContent().stream()
                .map(range -> mapToResponse(range, dailyRate, configuredPattern, configuredSymbol))
                .collect(Collectors.toList());

        return PageResponse.<InvoiceNumberRangeResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public String allocateNextInvoiceNumber(String householdId, String pattern, String symbol) {
        List<InvoiceNumberRange> ranges;
        if (pattern != null && symbol != null) {
            ranges = rangeRepository.findActiveRangesForUpdate(householdId, pattern, symbol);
        } else {
            ranges = rangeRepository.findActiveRangesForUpdate(householdId);
        }

        if (ranges == null || ranges.isEmpty()) {
            // Check if any range has EVER been declared for this household and pattern/symbol
            List<InvoiceNumberRange> allRanges = (pattern != null && symbol != null)
                    ? rangeRepository.findOverlappingRanges(householdId, pattern, symbol)
                    : rangeRepository.findActiveRangesByHouseholdId(householdId);

            if (allRanges != null && !allRanges.isEmpty()) {
                // Ranges existed but all are exhausted/inactive -> Genuinely exhausted (TC-03)
                throw new AppException(ErrorCode.INVOICE_RANGE_EXHAUSTED);
            }

            // If no range has ever existed at all (legacy data or initial bootstrap),
            // auto-provision initial default active range so invoice issuance/approval is never blocked
            String effectivePattern = pattern != null ? pattern : "1";
            String effectiveSymbol = symbol != null ? symbol : "C26TAA";

            Optional<String> maxNumOpt = eInvoiceRepository.findMaxInvoiceNumber(householdId, effectivePattern, effectiveSymbol);
            int currentMax = 0;
            if (maxNumOpt.isPresent() && maxNumOpt.get() != null) {
                try {
                    currentMax = Integer.parseInt(maxNumOpt.get());
                } catch (NumberFormatException ex) {
                    // Ignore
                }
            }

            Optional<BusinessHousehold> householdOpt = householdRepository != null
                    ? householdRepository.findById(householdId)
                    : Optional.empty();

            if (householdOpt.isPresent()) {
                InvoiceNumberRange autoRange = InvoiceNumberRange.builder()
                        .household(householdOpt.get())
                        .invoicePattern(effectivePattern)
                        .invoiceSymbol(effectiveSymbol)
                        .startNumber(1)
                        .endNumber(Math.max(100000, currentMax + 100000))
                        .currentNumber(currentMax)
                        .warningThreshold(50)
                        .status("ACTIVE")
                        .build();
                InvoiceNumberRange saved = rangeRepository.save(autoRange);
                ranges = List.of(saved);
                log.info("Tự động khởi tạo dải số hóa đơn mặc định cho hộ {}: Mẫu={}, Ký hiệu={}, Hiện tại={}",
                        householdId, effectivePattern, effectiveSymbol, currentMax);
            } else {
                throw new AppException(ErrorCode.INVOICE_RANGE_EXHAUSTED);
            }
        }

        InvoiceNumberRange range = null;
        for (InvoiceNumberRange r : ranges) {
            if (r.getCurrentNumber() < r.getEndNumber() && !"EXHAUSTED".equals(r.getStatus())) {
                range = r;
                break;
            }
        }

        if (range == null) {
            throw new AppException(ErrorCode.INVOICE_RANGE_EXHAUSTED);
        }

        int nextNumber = range.getCurrentNumber() + 1;
        range.setCurrentNumber(nextNumber);

        int remaining = range.getEndNumber() - nextNumber;
        if (remaining == 0) {
            range.setStatus("EXHAUSTED");
        } else if (remaining <= range.getWarningThreshold()) {
            range.setStatus("WARNING_LOW");
        } else {
            range.setStatus("ACTIVE");
        }

        rangeRepository.save(range);

        return String.format("%08d", nextNumber);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String allocateNextInvoiceNumber(String householdId) {
        return allocateNextInvoiceNumber(householdId, null, null);
    }

    private InvoiceNumberRangeResponse mapToResponse(InvoiceNumberRange range) {
        return mapToResponse(range, null, null);
    }

    private InvoiceNumberRangeResponse mapToResponse(InvoiceNumberRange range, String configuredPattern, String configuredSymbol) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long countLast7Days = eInvoiceRepository.countByHouseholdIdAndCreatedAtAfter(
                range.getHousehold().getId(), sevenDaysAgo);
        double dailyRate = Math.round((countLast7Days / 7.0) * 100.0) / 100.0;
        return mapToResponse(range, dailyRate, configuredPattern, configuredSymbol);
    }

    private InvoiceNumberRangeResponse mapToResponse(InvoiceNumberRange range, double dailyRate, String configuredPattern, String configuredSymbol) {
        int remaining = Math.max(0, range.getEndNumber() - range.getCurrentNumber());
        String status = range.getStatus();

        // Chỉ dải số trùng với mẫu hóa đơn cấu hình đang áp dụng mới có trạng thái Đang sử dụng (ACTIVE) hoặc Sắp hết số (WARNING_LOW)
        String rangePattern = range.getInvoicePattern() != null ? range.getInvoicePattern().trim() : "";
        String rangeSymbol = range.getInvoiceSymbol() != null ? range.getInvoiceSymbol().trim() : "";
        boolean isConfiguredTemplate = configuredPattern == null || configuredSymbol == null ||
                (configuredPattern.trim().equalsIgnoreCase(rangePattern) &&
                 configuredSymbol.trim().equalsIgnoreCase(rangeSymbol));

        if (remaining == 0) {
            status = "EXHAUSTED";
        } else if (!isConfiguredTemplate) {
            status = "INACTIVE"; // Không sử dụng (thuộc mẫu hóa đơn khác với mẫu đang cấu hình)
        } else if (remaining <= range.getWarningThreshold()) {
            status = "WARNING_LOW";
        } else {
            status = "ACTIVE";
        }

        String warningMessage = null;
        if ("EXHAUSTED".equals(status)) {
            warningMessage = "Dải số hóa đơn đã dùng hết (" + remaining + " số còn lại). Vui lòng khai báo dải mới!";
        } else if ("WARNING_LOW".equals(status)) {
            warningMessage = "Dải số hóa đơn sắp hết! Còn lại " + remaining + " số (dưới ngưỡng " + range.getWarningThreshold() + "). Vui lòng khai báo dải mới.";
        }

        return InvoiceNumberRangeResponse.builder()
                .id(range.getId())
                .householdId(range.getHousehold().getId())
                .invoicePattern(range.getInvoicePattern())
                .invoiceSymbol(range.getInvoiceSymbol())
                .startNumber(range.getStartNumber())
                .endNumber(range.getEndNumber())
                .currentNumber(range.getCurrentNumber())
                .remainingCount(remaining)
                .warningThreshold(range.getWarningThreshold())
                .dailyConsumptionRate(dailyRate)
                .status(status)
                .warningMessage(warningMessage)
                .createdAt(range.getCreatedAt())
                .updatedAt(range.getUpdatedAt())
                .build();
    }
}

