package com.sales.service.classes;

import com.sales.dto.request.CreateInvoiceNumberRangeRequest;
import com.sales.dto.response.InvoiceNumberRangeResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.InvoiceNumberRange;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceNumberRangeRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceNumberRangeServiceImpl implements InvoiceNumberRangeService {

    private final InvoiceNumberRangeRepository rangeRepository;
    private final UserRepository userRepository;
    private final EInvoiceRepository eInvoiceRepository;

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

        // Deactivate previous active ranges if any
        List<InvoiceNumberRange> activeRanges = rangeRepository.findActiveRangesByHouseholdId(household.getId());
        for (InvoiceNumberRange oldRange : activeRanges) {
            if (!"EXHAUSTED".equals(oldRange.getStatus())) {
                oldRange.setStatus("INACTIVE");
                rangeRepository.save(oldRange);
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
    @Transactional(readOnly = true)
    public InvoiceNumberRangeResponse getActiveRange(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<InvoiceNumberRange> ranges = rangeRepository.findActiveRangesByHouseholdId(household.getId());
        if (ranges.isEmpty()) {
            // Check if there are any ranges at all
            List<String> statuses = List.of("ACTIVE", "WARNING_LOW", "EXHAUSTED");
            InvoiceNumberRange range = rangeRepository
                    .findFirstByHouseholdIdAndStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(household.getId(), statuses)
                    .orElseThrow(() -> new AppException(ErrorCode.INVOICE_RANGE_NOT_FOUND));
            return mapToResponse(range);
        }

        return mapToResponse(ranges.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceNumberRangeResponse> getAllRanges(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InvoiceNumberRange> pageData = rangeRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId(), pageable);

        List<InvoiceNumberRangeResponse> content = pageData.getContent().stream()
                .map(this::mapToResponse)
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
    public String allocateNextInvoiceNumber(String householdId) {
        List<InvoiceNumberRange> ranges = rangeRepository.findActiveRangesByHouseholdId(householdId);
        if (ranges.isEmpty()) {
            throw new AppException(ErrorCode.INVOICE_RANGE_EXHAUSTED);
        }

        InvoiceNumberRange range = ranges.get(0);
        if (range.getCurrentNumber() >= range.getEndNumber() || "EXHAUSTED".equals(range.getStatus())) {
            range.setStatus("EXHAUSTED");
            rangeRepository.save(range);
            throw new AppException(ErrorCode.INVOICE_RANGE_EXHAUSTED);
        }

        int nextNumber = range.getCurrentNumber() + 1;
        range.setCurrentNumber(nextNumber);

        int remaining = range.getEndNumber() - nextNumber;
        if (remaining == 0) {
            range.setStatus("EXHAUSTED");
        } else if (remaining <= range.getWarningThreshold()) {
            range.setStatus("WARNING_LOW");
        }

        rangeRepository.save(range);

        return String.format("%08d", nextNumber);
    }

    private InvoiceNumberRangeResponse mapToResponse(InvoiceNumberRange range) {
        int remaining = Math.max(0, range.getEndNumber() - range.getCurrentNumber());
        String status = range.getStatus();
        if (remaining == 0) {
            status = "EXHAUSTED";
        } else if (remaining <= range.getWarningThreshold() && !"EXHAUSTED".equals(status)) {
            status = "WARNING_LOW";
        }

        // Calculate average daily consumption over last 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long countLast7Days = eInvoiceRepository.countByHouseholdIdAndCreatedAtAfter(
                range.getHousehold().getId(), sevenDaysAgo);
        double dailyRate = Math.round((countLast7Days / 7.0) * 100.0) / 100.0;

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
