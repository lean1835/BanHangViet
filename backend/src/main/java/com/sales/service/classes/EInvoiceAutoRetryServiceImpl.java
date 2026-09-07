package com.sales.service.classes;

import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.EInvoice;
import com.sales.entity.InvoiceStatusLog;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceStatusLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.EInvoiceAutoRetryService;
import com.sales.service.interfaces.EInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EInvoiceAutoRetryServiceImpl implements EInvoiceAutoRetryService {

    private final UserRepository userRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final InvoiceStatusLogRepository invoiceStatusLogRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final EInvoiceService eInvoiceService;
    private final TransactionTemplate transactionTemplate;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private BusinessHouseholdSettings getHouseholdSettings(String householdId) {
        return settingsRepository.findByHouseholdId(householdId)
                .orElseGet(() -> BusinessHouseholdSettings.builder()
                        .autoRetryEnabled(true)
                        .maxRetryAttempts(3)
                        .retryIntervalMinutes(15)
                        .maxRetryHoursDeadline(24)
                        .build());
    }

    private boolean isNonRetryableError(String taxResponse) {
        if (taxResponse == null) {
            return false;
        }
        String lower = taxResponse.toLowerCase();
        return lower.contains("sai mã số thuế") ||
               lower.contains("không hợp lệ") ||
               lower.contains("invalid_tax_code") ||
               lower.contains("pattern_mismatch") ||
               lower.contains("sai mẫu số") ||
               lower.contains("định dạng không đúng");
    }

    @Override
    public InvoiceAutoRetrySummaryResponse processScheduledAutoRetry() {
        LocalDateTime now = LocalDateTime.now();
        List<EInvoice> eligibleInvoices = eInvoiceRepository.findEligibleForAutoRetry(now);

        List<String> issuedInvoiceIds = new ArrayList<>();
        List<String> manualProcessingInvoiceIds = new ArrayList<>();
        int failedCount = 0;

        log.info("Bắt đầu tiến trình tự động gửi lại hóa đơn theo lịch. Tổng số lượng đủ điều kiện: {}", eligibleInvoices.size());

        for (EInvoice invoice : eligibleInvoices) {
            try {
                Boolean result = transactionTemplate.execute(status -> processInvoiceRetryInTransaction(invoice, now));
                if (Boolean.TRUE.equals(result)) {
                    issuedInvoiceIds.add(invoice.getId());
                } else if (Boolean.FALSE.equals(result)) {
                    manualProcessingInvoiceIds.add(invoice.getId());
                } else {
                    failedCount++;
                }
            } catch (Exception e) {
                log.error("Lỗi ngoại lệ khi xử lý tự động gửi lại hóa đơn ID={}: {}", invoice.getId(), e.getMessage(), e);
                failedCount++;
            }
        }

        log.info("Hoàn tất tiến trình tự động gửi lại hóa đơn: Tổng={}, Thành công={}, Chuyển thủ công={}, Lỗi thử lại={}",
                eligibleInvoices.size(), issuedInvoiceIds.size(), manualProcessingInvoiceIds.size(), failedCount);

        return InvoiceAutoRetrySummaryResponse.builder()
                .totalProcessed(eligibleInvoices.size())
                .successCount(issuedInvoiceIds.size())
                .failedCount(failedCount)
                .movedToManualCount(manualProcessingInvoiceIds.size())
                .issuedInvoiceIds(issuedInvoiceIds)
                .manualProcessingInvoiceIds(manualProcessingInvoiceIds)
                .build();
    }

    private Boolean processInvoiceRetryInTransaction(EInvoice invoice, LocalDateTime now) {
        EInvoice refreshedInvoice = eInvoiceRepository.findById(invoice.getId()).orElse(null);
        if (refreshedInvoice == null) {
            return null;
        }

        BusinessHouseholdSettings settings = getHouseholdSettings(refreshedInvoice.getHousehold().getId());
        if (Boolean.FALSE.equals(settings.getAutoRetryEnabled())) {
            log.debug("Tự động gửi lại bị tắt cho hộ ID={}", refreshedInvoice.getHousehold().getId());
            return null;
        }

        int maxAttempts = settings.getMaxRetryAttempts() != null ? settings.getMaxRetryAttempts() : 3;
        int intervalMinutes = settings.getRetryIntervalMinutes() != null ? settings.getRetryIntervalMinutes() : 15;
        int deadlineHours = settings.getMaxRetryHoursDeadline() != null ? settings.getMaxRetryHoursDeadline() : 24;

        boolean deadlineExceeded = refreshedInvoice.getCreatedAt().plusHours(deadlineHours).isBefore(now);
        boolean maxAttemptsReached = refreshedInvoice.getRetryCount() >= maxAttempts;

        if (deadlineExceeded || maxAttemptsReached) {
            String oldStatus = refreshedInvoice.getStatus();
            refreshedInvoice.setStatus("MANUAL_PROCESSING");
            refreshedInvoice.setErrorCategory("DEADLINE_OR_MAX_RETRY_EXCEEDED");
            refreshedInvoice.setNextRetryAt(null);
            eInvoiceRepository.save(refreshedInvoice);

            String reason = deadlineExceeded ? "Quá hạn thời gian cho phép gửi lại (" + deadlineHours + " giờ)"
                                             : "Đã vượt quá số lần gửi lại tối đa (" + maxAttempts + " lần)";

            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(refreshedInvoice)
                    .fromStatus(oldStatus)
                    .toStatus("MANUAL_PROCESSING")
                    .changedByUser(null)
                    .notes("Hệ thống dừng gửi tự động và chuyển sang xử lý thủ công (QTN-06). Lý do: " + reason)
                    .build());

            log.warn("Hóa đơn ID={} chuyển sang MANUAL_PROCESSING do: {}", refreshedInvoice.getId(), reason);
            return false;
        }

        // Tăng số lần thử
        int currentCount = refreshedInvoice.getRetryCount() + 1;
        refreshedInvoice.setRetryCount(currentCount);
        refreshedInvoice.setLastRetryAt(now);
        refreshedInvoice.setMaxRetryCount(maxAttempts);

        // Giả lập thử lại gửi cơ quan thuế
        boolean isSuccess = false;
        String responseMessage = null;

        // Phân tích nếu trước đó từng có lỗi không thể retry
        if (isNonRetryableError(refreshedInvoice.getTaxAuthorityResponse())) {
            refreshedInvoice.setStatus("MANUAL_PROCESSING");
            refreshedInvoice.setErrorCategory("NON_RETRYABLE");
            refreshedInvoice.setNextRetryAt(null);
            eInvoiceRepository.save(refreshedInvoice);

            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(refreshedInvoice)
                    .fromStatus(refreshedInvoice.getStatus())
                    .toStatus("MANUAL_PROCESSING")
                    .changedByUser(null)
                    .notes("Lỗi không thể tự động thử lại (" + refreshedInvoice.getTaxAuthorityResponse() + "). Chuyển xử lý thủ công.")
                    .build());

            return false;
        }

        // Thực hiện phê duyệt tự động từ mô phỏng Thuế
        try {
            eInvoiceService.approveInvoiceByTax(null, refreshedInvoice.getId(), "CQT-AUTO-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
            isSuccess = true;
        } catch (Exception e) {
            responseMessage = e.getMessage();
            log.info("Lần thử {} cho HĐĐT ID={} không thành công: {}", currentCount, refreshedInvoice.getId(), e.getMessage());
        }

        if (isSuccess) {
            EInvoice updated = eInvoiceRepository.findById(refreshedInvoice.getId()).orElse(refreshedInvoice);
            updated.setNextRetryAt(null);
            updated.setErrorCategory(null);
            eInvoiceRepository.save(updated);
            log.info("Tự động gửi lại HĐĐT ID={} thành công. Mã CQT={}", updated.getId(), updated.getTaxAuthorityCode());
            return true;
        } else {
            EInvoice updated = eInvoiceRepository.findById(refreshedInvoice.getId()).orElse(refreshedInvoice);
            if (isNonRetryableError(responseMessage)) {
                updated.setStatus("MANUAL_PROCESSING");
                updated.setErrorCategory("NON_RETRYABLE");
                updated.setNextRetryAt(null);
                updated.setTaxAuthorityResponse(responseMessage);
                eInvoiceRepository.save(updated);

                invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                        .invoice(updated)
                        .fromStatus("SEND_ERROR")
                        .toStatus("MANUAL_PROCESSING")
                        .changedByUser(null)
                        .notes("Thuế phản hồi lỗi dữ liệu không hợp lệ: " + responseMessage + ". Chuyển xử lý thủ công.")
                        .build());
                return false;
            } else {
                updated.setStatus("SEND_ERROR");
                updated.setErrorCategory("RETRYABLE");
                LocalDateTime nextTime = now.plusMinutes((long) intervalMinutes * currentCount);
                updated.setNextRetryAt(nextTime);
                updated.setTaxAuthorityResponse(responseMessage != null ? responseMessage : "Cơ quan thuế bận hoặc lỗi kết nối.");
                eInvoiceRepository.save(updated);

                invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                        .invoice(updated)
                        .fromStatus("WAITING_TAX_CODE")
                        .toStatus("SEND_ERROR")
                        .changedByUser(null)
                        .notes("Tự động thử lại lần " + currentCount + "/" + maxAttempts + " thất bại. Lần thử tiếp theo: " + nextTime)
                        .build());
                return null;
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse retryInvoiceSingle(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!currentUser.getHousehold().getId().equals(invoice.getHousehold().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (!"SEND_ERROR".equals(invoice.getStatus()) && !"MANUAL_PROCESSING".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        String oldStatus = invoice.getStatus();
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(LocalDateTime.now());
        invoice.setNextRetryAt(null);
        invoice.setTaxAuthorityResponse(null);

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(currentUser)
                .notes("Người dùng " + currentUser.getUsername() + " yêu cầu gửi lại hóa đơn thủ công.")
                .build());

        log.info("Gửi lại thủ công HĐĐT ID={} bởi người dùng {}", invoiceId, currentUser.getUsername());
        return eInvoiceService.getInvoice(currentUsername, saved.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getManualProcessingInvoices(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Specification<EInvoice> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("household").get("id"), householdId),
                cb.equal(root.get("status"), "MANUAL_PROCESSING"),
                cb.isNull(root.get("deletedAt"))
        );

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);

        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(inv -> eInvoiceService.getInvoice(currentUsername, inv.getId()))
                .collect(Collectors.toList());

        return PageResponse.<InvoiceResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }
}
