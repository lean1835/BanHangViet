package com.sales.service.classes;

import com.sales.dto.request.CreateInvoiceErrorNoticeRequest;
import com.sales.dto.request.InvoiceErrorNoticeItemRequest;
import com.sales.dto.response.InvoiceErrorNoticeItemResponse;
import com.sales.dto.response.InvoiceErrorNoticeResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.EInvoice;
import com.sales.entity.InvoiceErrorNotice;
import com.sales.entity.InvoiceErrorNoticeItem;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceErrorNoticeItemRepository;
import com.sales.repository.InvoiceErrorNoticeRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.InvoiceErrorNoticeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceErrorNoticeServiceImpl implements InvoiceErrorNoticeService {

    private final InvoiceErrorNoticeRepository noticeRepository;
    private final InvoiceErrorNoticeItemRepository noticeItemRepository;
    private final EInvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getEligibleInvoicesForNotice(String username) {
        User user = getUserByUsername(username);
        BusinessHousehold household = user.getHousehold();

        List<EInvoice> eligible = invoiceRepository.findEligibleForErrorNotice(household.getId());
        return eligible.stream()
                .map(this::mapToInvoiceResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceErrorNoticeResponse createErrorNotice(String username, CreateInvoiceErrorNoticeRequest request) {
        User user = getUserByUsername(username);
        BusinessHousehold household = user.getHousehold();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_NOTICE_ITEMS);
        }

        String noticeCode = "04SS-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        InvoiceErrorNotice notice = InvoiceErrorNotice.builder()
                .household(household)
                .noticeCode(noticeCode)
                .noticeType("04/SS")
                .noticePlace(request.getNoticePlace() != null ? request.getNoticePlace() : household.getAddress())
                .taxAuthorityName(request.getTaxAuthorityName() != null ? request.getTaxAuthorityName() : "Cơ quan Thuế mô phỏng")
                .status("DRAFT")
                .createdByUser(user)
                .items(new ArrayList<>())
                .build();

        List<InvoiceErrorNoticeItem> noticeItems = new ArrayList<>();
        for (InvoiceErrorNoticeItemRequest itemReq : request.getItems()) {
            EInvoice invoice = invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(itemReq.getInvoiceId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

            // Check if status is CANCELED or ADJUSTED
            if (!"CANCELED".equals(invoice.getStatus()) && !"ADJUSTED".equals(invoice.getStatus())) {
                throw new AppException(ErrorCode.INVOICE_NOT_ELIGIBLE_FOR_ERROR_NOTICE);
            }

            // Check if invoice already belongs to an ACCEPTED notice (TC-02)
            if (Boolean.TRUE.equals(invoice.getIsErrorNotified()) || noticeRepository.isInvoiceInAcceptedNotice(invoice.getId())) {
                throw new AppException(ErrorCode.INVOICE_ALREADY_NOTICE_ACCEPTED);
            }

            InvoiceErrorNoticeItem item = InvoiceErrorNoticeItem.builder()
                    .notice(notice)
                    .invoice(invoice)
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .invoicePattern(invoice.getInvoicePattern())
                    .invoiceSymbol(invoice.getInvoiceSymbol())
                    .taxAuthorityCode(invoice.getTaxAuthorityCode())
                    .handlingType(itemReq.getHandlingType())
                    .reason(itemReq.getReason())
                    .build();

            noticeItems.add(item);
        }

        notice.setItems(noticeItems);
        InvoiceErrorNotice savedNotice = noticeRepository.save(notice);
        log.info("Created InvoiceErrorNotice [{}] with {} items by user [{}]", savedNotice.getNoticeCode(), noticeItems.size(), username);

        return mapToNoticeResponse(savedNotice);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceErrorNoticeResponse sendNoticeToTaxAuthority(String username, String noticeId) {
        User user = getUserByUsername(username);
        BusinessHousehold household = user.getHousehold();

        InvoiceErrorNotice notice = noticeRepository.findByIdAndHouseholdId(noticeId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));

        if (!"DRAFT".equals(notice.getStatus()) && !"REJECTED".equals(notice.getStatus())) {
            throw new AppException(ErrorCode.ERROR_NOTICE_CANNOT_SEND);
        }

        notice.setSentToTaxAt(LocalDateTime.now());
        notice.setStatus("WAITING_TAX_RESPONSE");

        // Simulate Tax Authority Response (TC-01 Success Flow)
        String cqtCode = "CQT-SS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        notice.setTaxAuthorityCode(cqtCode);
        notice.setTaxAuthorityResponse("Tiếp nhận thông báo hóa đơn sai sót Mẫu 04/SS-HĐĐT thành công");
        notice.setTaxResponseAt(LocalDateTime.now());
        notice.setStatus("ACCEPTED");

        // Mark invoices as notified (two-way association)
        if (notice.getItems() != null) {
            for (InvoiceErrorNoticeItem item : notice.getItems()) {
                EInvoice inv = item.getInvoice();
                if (inv != null) {
                    inv.setIsErrorNotified(true);
                    invoiceRepository.save(inv);
                }
            }
        }

        InvoiceErrorNotice saved = noticeRepository.save(notice);
        log.info("InvoiceErrorNotice [{}] ACCEPTED by simulated Tax Authority", saved.getNoticeCode());

        return mapToNoticeResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceErrorNoticeResponse getNotice(String username, String noticeId) {
        User user = getUserByUsername(username);
        InvoiceErrorNotice notice = noticeRepository.findByIdAndHouseholdId(noticeId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));
        return mapToNoticeResponse(notice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceErrorNoticeResponse> getNotices(String username, String status, int page, int size) {
        User user = getUserByUsername(username);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<InvoiceErrorNotice> noticePage;
        if (status != null && !status.trim().isEmpty()) {
            noticePage = noticeRepository.findByHouseholdIdAndStatus(user.getHousehold().getId(), status.trim(), pageable);
        } else {
            noticePage = noticeRepository.findByHouseholdId(user.getHousehold().getId(), pageable);
        }

        List<InvoiceErrorNoticeResponse> content = noticePage.getContent().stream()
                .map(this::mapToNoticeResponse)
                .collect(Collectors.toList());

        return PageResponse.<InvoiceErrorNoticeResponse>builder()
                .pageNumber(noticePage.getNumber())
                .pageSize(noticePage.getSize())
                .totalElements(noticePage.getTotalElements())
                .totalPages(noticePage.getTotalPages())
                .last(noticePage.isLast())
                .content(content)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceErrorNoticeResponse rejectNoticeByTaxAuthority(String username, String noticeId, String reason) {
        InvoiceErrorNotice notice;
        if (username != null) {
            User user = getUserByUsername(username);
            if (user.getRole() != null && "VT-05".equals(user.getRole().getCode())) {
                notice = noticeRepository.findById(noticeId)
                        .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));
            } else {
                notice = noticeRepository.findByIdAndHouseholdId(noticeId, user.getHousehold().getId())
                        .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));
            }
        } else {
            notice = noticeRepository.findById(noticeId)
                    .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));
        }

        notice.setStatus("REJECTED");
        notice.setTaxAuthorityCode(null);
        String rejectReason = (reason != null && !reason.trim().isEmpty())
                ? reason.trim()
                : "Cơ quan thuế từ chối tiếp nhận thông báo sai sót: Sai lệch thông tin hóa đơn";
        notice.setTaxAuthorityResponse(rejectReason);
        notice.setTaxResponseAt(LocalDateTime.now());

        // Invoices remain isErrorNotified = false because notice was rejected
        if (notice.getItems() != null) {
            for (InvoiceErrorNoticeItem item : notice.getItems()) {
                EInvoice inv = item.getInvoice();
                if (inv != null && Boolean.TRUE.equals(inv.getIsErrorNotified())) {
                    inv.setIsErrorNotified(false);
                    invoiceRepository.save(inv);
                }
            }
        }

        InvoiceErrorNotice saved = noticeRepository.save(notice);
        log.info("InvoiceErrorNotice [{}] REJECTED by Tax Authority: {}", saved.getNoticeCode(), rejectReason);
        return mapToNoticeResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceErrorNoticeResponse reopenNoticeToDraft(String username, String noticeId) {
        User user = getUserByUsername(username);
        InvoiceErrorNotice notice = noticeRepository.findByIdAndHouseholdId(noticeId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));

        if (!"REJECTED".equals(notice.getStatus())) {
            throw new AppException(ErrorCode.ERROR_NOTICE_CANNOT_REOPEN);
        }

        notice.setStatus("DRAFT");
        InvoiceErrorNotice saved = noticeRepository.save(notice);
        log.info("InvoiceErrorNotice [{}] reopened to DRAFT by user [{}]", saved.getNoticeCode(), username);
        return mapToNoticeResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceErrorNoticeResponse updateErrorNotice(String username, String noticeId, CreateInvoiceErrorNoticeRequest request) {
        User user = getUserByUsername(username);
        BusinessHousehold household = user.getHousehold();

        InvoiceErrorNotice notice = noticeRepository.findByIdAndHouseholdId(noticeId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ERROR_NOTICE_NOT_FOUND));

        if (!"DRAFT".equals(notice.getStatus()) && !"REJECTED".equals(notice.getStatus())) {
            throw new AppException(ErrorCode.ERROR_NOTICE_CANNOT_UPDATE);
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_NOTICE_ITEMS);
        }

        if (request.getNoticePlace() != null) {
            notice.setNoticePlace(request.getNoticePlace());
        }
        if (request.getTaxAuthorityName() != null) {
            notice.setTaxAuthorityName(request.getTaxAuthorityName());
        }

        // Clear existing items and build new ones
        notice.getItems().clear();

        List<InvoiceErrorNoticeItem> newItems = new ArrayList<>();
        for (InvoiceErrorNoticeItemRequest itemReq : request.getItems()) {
            EInvoice invoice = invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(itemReq.getInvoiceId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

            if (!"CANCELED".equals(invoice.getStatus()) && !"ADJUSTED".equals(invoice.getStatus())) {
                throw new AppException(ErrorCode.INVOICE_NOT_ELIGIBLE_FOR_ERROR_NOTICE);
            }

            if (Boolean.TRUE.equals(invoice.getIsErrorNotified()) || noticeRepository.isInvoiceInAcceptedNotice(invoice.getId())) {
                throw new AppException(ErrorCode.INVOICE_ALREADY_NOTICE_ACCEPTED);
            }

            InvoiceErrorNoticeItem item = InvoiceErrorNoticeItem.builder()
                    .notice(notice)
                    .invoice(invoice)
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .invoicePattern(invoice.getInvoicePattern())
                    .invoiceSymbol(invoice.getInvoiceSymbol())
                    .taxAuthorityCode(invoice.getTaxAuthorityCode())
                    .handlingType(itemReq.getHandlingType())
                    .reason(itemReq.getReason())
                    .build();

            newItems.add(item);
        }

        notice.getItems().addAll(newItems);
        notice.setStatus("DRAFT");

        InvoiceErrorNotice savedNotice = noticeRepository.save(notice);
        log.info("Updated InvoiceErrorNotice [{}] with {} items by user [{}]", savedNotice.getNoticeCode(), newItems.size(), username);
        return mapToNoticeResponse(savedNotice);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private InvoiceErrorNoticeResponse mapToNoticeResponse(InvoiceErrorNotice notice) {
        List<InvoiceErrorNoticeItemResponse> itemResponses = notice.getItems() != null ?
                notice.getItems().stream().map(item -> InvoiceErrorNoticeItemResponse.builder()
                        .id(item.getId())
                        .invoiceId(item.getInvoice() != null ? item.getInvoice().getId() : null)
                        .invoiceNumber(item.getInvoiceNumber())
                        .invoicePattern(item.getInvoicePattern())
                        .invoiceSymbol(item.getInvoiceSymbol())
                        .taxAuthorityCode(item.getTaxAuthorityCode())
                        .handlingType(item.getHandlingType())
                        .reason(item.getReason())
                        .createdAt(item.getCreatedAt())
                        .build()).collect(Collectors.toList()) : new ArrayList<>();

        return InvoiceErrorNoticeResponse.builder()
                .id(notice.getId())
                .noticeCode(notice.getNoticeCode())
                .noticeType(notice.getNoticeType())
                .noticePlace(notice.getNoticePlace())
                .taxAuthorityName(notice.getTaxAuthorityName())
                .status(notice.getStatus())
                .taxAuthorityCode(notice.getTaxAuthorityCode())
                .taxAuthorityResponse(notice.getTaxAuthorityResponse())
                .sentToTaxAt(notice.getSentToTaxAt())
                .taxResponseAt(notice.getTaxResponseAt())
                .createdByUserName(notice.getCreatedByUser() != null ? notice.getCreatedByUser().getFullName() : null)
                .createdAt(notice.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    private InvoiceResponse mapToInvoiceResponse(EInvoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .title(invoice.getTitle())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .totalAmountBeforeTax(invoice.getTotalAmountBeforeTax())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .finalAmount(invoice.getFinalAmount())
                .status(invoice.getStatus())
                .taxAuthorityCode(invoice.getTaxAuthorityCode())
                .cancelReason(invoice.getCancelReason())
                .lookupCode(invoice.getLookupCode())
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
