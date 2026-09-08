package com.sales.service.classes;

import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.dto.response.InvoiceItemResponse;
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
import jakarta.persistence.criteria.Predicate;
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
import java.util.Collections;
import java.util.List;
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

    private static final int BATCH_SIZE = 100;

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
        return processAutoRetryInternal(null);
    }

    @Override
    public InvoiceAutoRetrySummaryResponse processManualAutoRetryForUser(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        if (currentUser.getHousehold() == null) {
            if (currentUser.getRole() != null && "VT-04".equals(currentUser.getRole().getCode())) {
                return processAutoRetryInternal(null);
            }
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return processAutoRetryInternal(currentUser.getHousehold().getId());
    }

    private InvoiceAutoRetrySummaryResponse processAutoRetryInternal(String householdId) {
        LocalDateTime now = LocalDateTime.now();
        Pageable pageable = PageRequest.of(0, BATCH_SIZE);

        List<EInvoice> eligibleInvoices = householdId != null
                ? eInvoiceRepository.findEligibleForAutoRetryByHousehold(householdId, now, pageable)
                : eInvoiceRepository.findEligibleForAutoRetry(now, pageable);

        List<String> issuedInvoiceIds = new ArrayList<>();
        List<String> manualProcessingInvoiceIds = new ArrayList<>();
        int failedCount = 0;

        log.info("Bắt đầu tiến trình gửi lại hóa đơn tự động (householdId={}). Số lượng xử lý: {}",
                householdId != null ? householdId : "ALL", eligibleInvoices.size());

        for (EInvoice invoice : eligibleInvoices) {
            try {
                RetryExecutionResult result = executeInvoiceRetry(invoice.getId(), now);
                if (result == RetryExecutionResult.SUCCESS) {
                    issuedInvoiceIds.add(invoice.getId());
                } else if (result == RetryExecutionResult.MANUAL_PROCESSING) {
                    manualProcessingInvoiceIds.add(invoice.getId());
                } else if (result == RetryExecutionResult.RETRYABLE_FAILED) {
                    failedCount++;
                }
            } catch (Exception e) {
                log.error("Ngoại lệ ngoài dự kiến khi xử lý gửi lại hóa đơn ID={}: {}", invoice.getId(), e.getMessage(), e);
                failedCount++;
            }
        }

        log.info("Hoàn tất tiến trình gửi lại hóa đơn: Tổng={}, Thành công={}, Chuyển thủ công={}, Lỗi thử lại={}",
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

    private enum RetryExecutionResult {
        SUCCESS,
        MANUAL_PROCESSING,
        RETRYABLE_FAILED,
        SKIPPED
    }

    private static class PrepareResult {
        final boolean proceed;
        final boolean movedToManual;
        final int currentRetryCount;
        final int maxAttempts;
        final int intervalMinutes;

        PrepareResult(boolean proceed, boolean movedToManual, int currentRetryCount, int maxAttempts, int intervalMinutes) {
            this.proceed = proceed;
            this.movedToManual = movedToManual;
            this.currentRetryCount = currentRetryCount;
            this.maxAttempts = maxAttempts;
            this.intervalMinutes = intervalMinutes;
        }

        static PrepareResult skipped() {
            return new PrepareResult(false, false, 0, 0, 0);
        }

        static PrepareResult manual() {
            return new PrepareResult(false, true, 0, 0, 0);
        }

        static PrepareResult ready(int currentRetryCount, int maxAttempts, int intervalMinutes) {
            return new PrepareResult(true, false, currentRetryCount, maxAttempts, intervalMinutes);
        }
    }

    /**
     * Tách nhỏ thành các Transaction độc lập:
     * 1. Pha chuẩn bị (check điều kiện, cập nhật trạng thái sang WAITING_TAX_CODE nếu hợp lệ).
     * 2. Pha gọi phê duyệt thuế bên ngoài (nếu ném exception cũng không làm rollback pha chuẩn bị).
     * 3. Pha hoàn tất hoặc xử lý lỗi sau khi gọi thuế trong transaction con độc lập.
     */
    private RetryExecutionResult executeInvoiceRetry(String invoiceId, LocalDateTime now) {
        // Pha 1: Chuẩn bị trong transaction Tx1
        PrepareResult prep = transactionTemplate.execute(status -> prepareInvoiceForRetry(invoiceId, now));
        if (prep == null || (!prep.proceed && !prep.movedToManual)) {
            return RetryExecutionResult.SKIPPED;
        }
        if (prep.movedToManual) {
            return RetryExecutionResult.MANUAL_PROCESSING;
        }

        // Pha 2: Gọi dịch vụ thuế
        boolean isSuccess = false;
        String errorMessage = null;
        String mockTaxCode = "CQT-AUTO-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        try {
            eInvoiceService.approveInvoiceByTax(null, invoiceId, mockTaxCode);
            isSuccess = true;
        } catch (Exception e) {
            errorMessage = e.getMessage() != null ? e.getMessage() : "Lỗi kết nối cơ quan thuế";
            log.info("Lần thử {} cho HĐĐT ID={} không thành công: {}", prep.currentRetryCount, invoiceId, errorMessage);
        }

        // Pha 3: Cập nhật kết quả trong transaction Tx2 độc lập
        final boolean success = isSuccess;
        final String err = errorMessage;
        return transactionTemplate.execute(status -> handleRetryResult(invoiceId, now, prep, success, err));
    }

    private PrepareResult prepareInvoiceForRetry(String invoiceId, LocalDateTime now) {
        EInvoice invoice = eInvoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null || "ISSUED".equals(invoice.getStatus()) || "CANCELED".equals(invoice.getStatus())) {
            return PrepareResult.skipped();
        }

        BusinessHouseholdSettings settings = getHouseholdSettings(invoice.getHousehold().getId());
        if (Boolean.FALSE.equals(settings.getAutoRetryEnabled())) {
            log.debug("Tự động gửi lại bị tắt cho hộ ID={}", invoice.getHousehold().getId());
            return PrepareResult.skipped();
        }

        int maxAttempts = settings.getMaxRetryAttempts() != null ? settings.getMaxRetryAttempts() : 3;
        int intervalMinutes = settings.getRetryIntervalMinutes() != null ? settings.getRetryIntervalMinutes() : 15;
        int deadlineHours = settings.getMaxRetryHoursDeadline() != null ? settings.getMaxRetryHoursDeadline() : 24;

        String oldStatus = invoice.getStatus();

        // Kiểm tra lỗi không thể thử lại (TC-02: không tăng retryCount khi gặp lỗi này)
        if (isNonRetryableError(invoice.getTaxAuthorityResponse())) {
            invoice.setStatus("MANUAL_PROCESSING");
            invoice.setErrorCategory("NON_RETRYABLE");
            invoice.setNextRetryAt(null);
            eInvoiceRepository.save(invoice);

            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(invoice)
                    .fromStatus(oldStatus)
                    .toStatus("MANUAL_PROCESSING")
                    .changedByUser(null)
                    .notes("Lỗi không thể tự động thử lại (" + invoice.getTaxAuthorityResponse() + "). Chuyển xử lý thủ công (TC-02).")
                    .build());

            log.warn("HĐĐT ID={} chuyển MANUAL_PROCESSING do lỗi dữ liệu không hợp lệ", invoice.getId());
            return PrepareResult.manual();
        }

        // Kiểm tra hạn chót thời gian hoặc số lần thử tối đa (TC-03)
        // Mốc thời gian bắt đầu chu kỳ thử lại căn cứ vào sentToTaxAt (lần gửi thuế gần nhất) hoặc createdAt
        LocalDateTime cycleStart = invoice.getSentToTaxAt() != null ? invoice.getSentToTaxAt() : invoice.getCreatedAt();
        boolean deadlineExceeded = cycleStart != null && cycleStart.plusHours(deadlineHours).isBefore(now);
        boolean maxAttemptsReached = invoice.getRetryCount() >= maxAttempts;

        if (deadlineExceeded || maxAttemptsReached) {
            invoice.setStatus("MANUAL_PROCESSING");
            invoice.setErrorCategory("DEADLINE_OR_MAX_RETRY_EXCEEDED");
            invoice.setNextRetryAt(null);
            eInvoiceRepository.save(invoice);

            String reason = deadlineExceeded ? "Quá hạn thời gian cho phép gửi lại (" + deadlineHours + " giờ)"
                                             : "Đã vượt quá số lần gửi lại tối đa (" + maxAttempts + " lần)";

            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(invoice)
                    .fromStatus(oldStatus)
                    .toStatus("MANUAL_PROCESSING")
                    .changedByUser(null)
                    .notes("Hệ thống dừng gửi tự động và chuyển sang xử lý thủ công (QTN-06). Lý do: " + reason)
                    .build());

            log.warn("HĐĐT ID={} chuyển MANUAL_PROCESSING do: {}", invoice.getId(), reason);
            return PrepareResult.manual();
        }

        // Đủ điều kiện thử lại: Tăng số lần thử, đưa trạng thái về WAITING_TAX_CODE để chuẩn bị gửi thuế
        int nextCount = invoice.getRetryCount() + 1;
        invoice.setRetryCount(nextCount);
        invoice.setLastRetryAt(now);
        invoice.setMaxRetryCount(maxAttempts);
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(now);

        eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(invoice)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(null)
                .notes("Hệ thống tự động thử lại gửi cơ quan thuế lần " + nextCount + "/" + maxAttempts)
                .build());

        return PrepareResult.ready(nextCount, maxAttempts, intervalMinutes);
    }

    private RetryExecutionResult handleRetryResult(
            String invoiceId,
            LocalDateTime now,
            PrepareResult prep,
            boolean isSuccess,
            String errorMessage) {

        EInvoice invoice = eInvoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null) {
            return RetryExecutionResult.SKIPPED;
        }

        // P0 Race condition protection: Nếu hóa đơn đã được cấp mã ISSUED từ luồng khác, không được đè về trạng thái lỗi
        if ("ISSUED".equals(invoice.getStatus())) {
            log.warn("HĐĐT ID={} đã ở trạng thái ISSUED, bỏ qua cập nhật lỗi từ tiến trình thử lại.", invoiceId);
            return RetryExecutionResult.SUCCESS;
        }

        if (isSuccess) {
            invoice.setNextRetryAt(null);
            invoice.setErrorCategory(null);
            eInvoiceRepository.save(invoice);
            log.info("Tự động gửi lại HĐĐT ID={} thành công. Mã CQT={}", invoice.getId(), invoice.getTaxAuthorityCode());
            return RetryExecutionResult.SUCCESS;
        }

        if (isNonRetryableError(errorMessage)) {
            invoice.setStatus("MANUAL_PROCESSING");
            invoice.setErrorCategory("NON_RETRYABLE");
            invoice.setNextRetryAt(null);
            invoice.setTaxAuthorityResponse(errorMessage);
            eInvoiceRepository.save(invoice);

            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(invoice)
                    .fromStatus("WAITING_TAX_CODE")
                    .toStatus("MANUAL_PROCESSING")
                    .changedByUser(null)
                    .notes("Thuế phản hồi lỗi dữ liệu không hợp lệ: " + errorMessage + ". Chuyển xử lý thủ công (TC-02).")
                    .build());

            return RetryExecutionResult.MANUAL_PROCESSING;
        } else {
            invoice.setStatus("SEND_ERROR");
            invoice.setErrorCategory("RETRYABLE");
            LocalDateTime nextTime = now.plusMinutes((long) prep.intervalMinutes * prep.currentRetryCount);
            invoice.setNextRetryAt(nextTime);
            invoice.setTaxAuthorityResponse(errorMessage != null ? errorMessage : "Cơ quan thuế bận hoặc lỗi kết nối.");
            eInvoiceRepository.save(invoice);

            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(invoice)
                    .fromStatus("WAITING_TAX_CODE")
                    .toStatus("SEND_ERROR")
                    .changedByUser(null)
                    .notes("Tự động thử lại lần " + prep.currentRetryCount + "/" + prep.maxAttempts + " thất bại. Lần thử tiếp theo: " + nextTime)
                    .build());

            return RetryExecutionResult.RETRYABLE_FAILED;
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

        // Phân quyền cho nhân viên bán hàng (VT-02): chỉ được gửi lại hóa đơn do chính mình tạo
        if (currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode())) {
            if (invoice.getCreatedByUser() != null && !currentUser.getId().equals(invoice.getCreatedByUser().getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        if (!"SEND_ERROR".equals(invoice.getStatus()) && !"MANUAL_PROCESSING".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        String oldStatus = invoice.getStatus();
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(LocalDateTime.now());
        invoice.setNextRetryAt(null);
        invoice.setTaxAuthorityResponse(null);
        invoice.setRetryCount(0);
        invoice.setErrorCategory(null);

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(currentUser)
                .notes("Người dùng " + currentUser.getUsername() + " yêu cầu gửi lại hóa đơn thủ công.")
                .build());

        log.info("Gửi lại thủ công HĐĐT ID={} bởi người dùng {}", invoiceId, currentUser.getUsername());
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getManualProcessingInvoices(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Specification<EInvoice> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("household").get("id"), householdId));
            predicates.add(cb.equal(root.get("status"), "MANUAL_PROCESSING"));
            predicates.add(cb.isNull(root.get("deletedAt")));

            // Phân quyền cho nhân viên bán hàng (VT-02): chỉ xem hóa đơn do chính mình tạo
            if (currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode())) {
                predicates.add(cb.equal(root.get("createdByUser").get("id"), currentUser.getId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);

        // Map trực tiếp từ Entity sang DTO, triệt tiêu N+1 Query và tránh ném 403 từ getInvoice
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(this::mapToInvoiceResponse)
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

    private InvoiceResponse mapToInvoiceResponse(EInvoice invoice) {
        List<InvoiceItemResponse> items = invoice.getItems() != null
                ? invoice.getItems().stream()
                        .map(item -> InvoiceItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                                .productName(item.getProductName())
                                .unit(item.getUnit())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .taxRatePercentage(item.getTaxRatePercentage())
                                .taxAmount(item.getTaxAmount())
                                .discountAmount(item.getDiscountAmount())
                                .promotionName(item.getPromotionName())
                                .subtotal(item.getSubtotal())
                                .createdAt(item.getCreatedAt())
                                .build())
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold() != null ? invoice.getHousehold().getId() : null)
                .householdName(invoice.getHousehold() != null ? invoice.getHousehold().getName() : null)
                .householdTaxCode(invoice.getHousehold() != null ? invoice.getHousehold().getTaxCode() : null)
                .householdAddress(invoice.getHousehold() != null ? invoice.getHousehold().getAddress() : null)
                .householdPhone(invoice.getHousehold() != null ? invoice.getHousehold().getPhoneNumber() : null)
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .orderNumber(invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null)
                .originalInvoiceId(invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null)
                .createdByUserId(invoice.getCreatedByUser() != null ? invoice.getCreatedByUser().getId() : null)
                .createdByUsername(invoice.getCreatedByUser() != null ? invoice.getCreatedByUser().getUsername() : null)
                .createdByFullName(invoice.getCreatedByUser() != null ? invoice.getCreatedByUser().getFullName() : null)
                .canceledByUserId(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getId() : null)
                .canceledByUsername(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getUsername() : null)
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .title(invoice.getTitle() != null ? invoice.getTitle() : "HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .footerNote(invoice.getFooterNote())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerPhone(invoice.getBuyerPhone())
                .buyerEmail(invoice.getBuyerEmail())
                .buyerAddress(invoice.getBuyerAddress())
                .totalAmountBeforeTax(invoice.getTotalAmountBeforeTax())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .finalAmount(invoice.getFinalAmount())
                .status(invoice.getStatus())
                .taxAuthorityCode(invoice.getTaxAuthorityCode())
                .taxAuthorityResponse(invoice.getTaxAuthorityResponse())
                .cancelReason(invoice.getCancelReason())
                .lookupCode(invoice.getLookupCode())
                .sentToTaxAt(invoice.getSentToTaxAt())
                .taxResponseAt(invoice.getTaxResponseAt())
                .canceledAt(invoice.getCanceledAt())
                .retryCount(invoice.getRetryCount())
                .maxRetryCount(invoice.getMaxRetryCount())
                .nextRetryAt(invoice.getNextRetryAt())
                .lastRetryAt(invoice.getLastRetryAt())
                .errorCategory(invoice.getErrorCategory())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .items(items)
                .build();
    }
}
