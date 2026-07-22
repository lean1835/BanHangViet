package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceItemRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.response.EInvoiceItemResponse;
import com.viet.sales.dto.response.EInvoiceResponse;
import com.viet.sales.dto.response.InvoiceStatusLogResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.EInvoiceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.specification.EInvoiceSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EInvoiceServiceImpl implements EInvoiceService {

    private final UserRepository userRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final EInvoiceItemRepository eInvoiceItemRepository;
    private final InvoiceStatusLogRepository invoiceStatusLogRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
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
                    .targetTable("e_invoices")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log for invoice", e);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EInvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId, CreateAdjustmentInvoiceRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        String role = user.getRole().getCode();

        // Quyền hạn chính: Chỉ chủ hộ kinh doanh (VT-01) hoặc Kế toán (VT-03) được phép
        if (!"VT-01".equals(role) && !"VT-03".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();

        // 1. Tìm hóa đơn gốc
        EInvoice original = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(originalInvoiceId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // 2. Kiểm tra hóa đơn gốc đã được cấp mã chưa (trạng thái phải là ISSUED)
        if (!"ISSUED".equals(original.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_ISSUED);
        }

        // 3. Kiểm tra hóa đơn gốc đã bị điều chỉnh hoặc hủy trước đó chưa
        // Nếu đã ở trạng thái ADJUSTED hoặc CANCELED thì không được điều chỉnh tiếp
        if ("ADJUSTED".equals(original.getStatus()) || "CANCELED".equals(original.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_ADJUSTED_OR_CANCELED);
        }

        // 4. Kiểm tra xem dữ liệu điều chỉnh có khác so với gốc hay không
        boolean hasChange = checkDataDifference(original, request);
        if (!hasChange) {
            throw new AppException(ErrorCode.INVOICE_ADJUSTMENT_NO_CHANGE);
        }

        // 5. Tính toán các khoản tiền cho hóa đơn điều chỉnh mới
        BigDecimal totalAmountBeforeTax = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = BigDecimal.ZERO;

        List<EInvoiceItem> newItems = new ArrayList<>();

        // N+1 Query Avoidance: Batch load products if productIds are provided
        List<String> productIds = request.getItems().stream()
                .map(CreateAdjustmentInvoiceItemRequest::getProductId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<String, Product> productMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            productRepository.findAllById(productIds).forEach(p -> productMap.put(p.getId(), p));
        }

        for (CreateAdjustmentInvoiceItemRequest itemReq : request.getItems()) {
            BigDecimal quantity = itemReq.getQuantity();
            BigDecimal unitPrice = itemReq.getUnitPrice();
            BigDecimal discountAmt = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal taxRate = itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage() : BigDecimal.ZERO;

            BigDecimal itemAmount = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxableAmount = itemAmount.subtract(discountAmt).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxAmount = taxableAmount.multiply(taxRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotal = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

            totalAmountBeforeTax = totalAmountBeforeTax.add(taxableAmount);
            totalTaxAmount = totalTaxAmount.add(taxAmount);
            totalDiscountAmount = totalDiscountAmount.add(discountAmt);
            finalAmount = finalAmount.add(subtotal);

            Product product = itemReq.getProductId() != null ? productMap.get(itemReq.getProductId()) : null;

            EInvoiceItem newItem = EInvoiceItem.builder()
                    .product(product)
                    .productName(itemReq.getProductName())
                    .unit(itemReq.getUnit())
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmount)
                    .discountAmount(discountAmt)
                    .subtotal(subtotal)
                    .build();

            newItems.add(newItem);
        }

        // 6. Tạo hóa đơn điều chỉnh mới
        String lookupCode = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        
        EInvoice adjustmentInvoice = EInvoice.builder()
                .household(household)
                .order(original.getOrder())
                .originalInvoice(original)
                .createdByUser(user)
                .invoicePattern(original.getInvoicePattern())
                .invoiceSymbol(original.getInvoiceSymbol())
                .buyerName(request.getBuyerName() != null ? request.getBuyerName() : original.getBuyerName())
                .buyerTaxCode(request.getBuyerTaxCode() != null ? request.getBuyerTaxCode() : original.getBuyerTaxCode())
                .buyerAddress(request.getBuyerAddress() != null ? request.getBuyerAddress() : original.getBuyerAddress())
                .buyerPhone(request.getBuyerPhone() != null ? request.getBuyerPhone() : original.getBuyerPhone())
                .buyerEmail(request.getBuyerEmail() != null ? request.getBuyerEmail() : original.getBuyerEmail())
                .totalAmountBeforeTax(totalAmountBeforeTax)
                .taxAmount(totalTaxAmount)
                .discountAmount(totalDiscountAmount)
                .finalAmount(finalAmount)
                .status("DRAFT")
                .lookupCode(lookupCode)
                .build();

        for (EInvoiceItem item : newItems) {
            item.setInvoice(adjustmentInvoice);
        }
        adjustmentInvoice.setItems(newItems);

        // Lưu hóa đơn điều chỉnh vào CSDL
        EInvoice savedAdjustment = eInvoiceRepository.save(adjustmentInvoice);

        // 7. Cập nhật hóa đơn gốc sang trạng thái ADJUSTED
        String oldStatus = original.getStatus();
        original.setStatus("ADJUSTED");
        eInvoiceRepository.save(original);

        // 8. Ghi log trạng thái hóa đơn
        // Log cho hóa đơn gốc
        InvoiceStatusLog originalLog = InvoiceStatusLog.builder()
                .invoice(original)
                .fromStatus(oldStatus)
                .toStatus("ADJUSTED")
                .changedByUser(user)
                .notes("Bị điều chỉnh bởi hóa đơn ID: " + savedAdjustment.getId() + ". Lý do: " + request.getAdjustmentReason())
                .build();
        invoiceStatusLogRepository.save(originalLog);

        // Log cho hóa đơn điều chỉnh mới
        InvoiceStatusLog adjustmentLog = InvoiceStatusLog.builder()
                .invoice(savedAdjustment)
                .fromStatus("NONE")
                .toStatus("DRAFT")
                .changedByUser(user)
                .notes("Khởi tạo hóa đơn điều chỉnh. Lý do điều chỉnh: " + request.getAdjustmentReason())
                .build();
        invoiceStatusLogRepository.save(adjustmentLog);

        // 9. Ghi nhật ký hệ thống
        logActivity(household, user, "ADJUST_INVOICE", original.getId(), buildInvoiceLogMap(original), buildInvoiceLogMap(savedAdjustment));

        return mapToResponse(savedAdjustment);
    }

    @Override
    @Transactional(readOnly = true)
    public EInvoiceResponse getInvoiceById(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem hóa đơn do chính mình tạo
        if ("VT-02".equals(user.getRole().getCode())) {
            if (!invoice.getCreatedByUser().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        return mapToResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        // Kiểm tra hóa đơn tồn tại và thuộc hộ kinh doanh
        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem log trạng thái hóa đơn của chính mình
        if ("VT-02".equals(user.getRole().getCode())) {
            if (!invoice.getCreatedByUser().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        List<InvoiceStatusLog> logs = invoiceStatusLogRepository.findByInvoiceIdOrderByCreatedAtAsc(invoice.getId());
        return logs.stream().map(log -> InvoiceStatusLogResponse.builder()
                .id(log.getId())
                .invoiceId(log.getInvoice().getId())
                .fromStatus(log.getFromStatus())
                .toStatus(log.getToStatus())
                .changedByUserId(log.getChangedByUser().getId())
                .changedByFullName(log.getChangedByUser().getFullName())
                .notes(log.getNotes())
                .createdAt(log.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EInvoiceResponse> getInvoices(
            String currentUsername,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String search,
            int page,
            int size) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ thấy hóa đơn của chính mình, VT-01/03 thấy toàn bộ hộ kinh doanh
        String createdByUserId = null;
        if ("VT-02".equals(user.getRole().getCode())) {
            createdByUserId = user.getId();
        }

        Specification<EInvoice> spec = EInvoiceSpecification.filterInvoices(
                household.getId(),
                createdByUserId,
                startDate,
                endDate,
                status,
                search
        );

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EInvoice> invoicePage = eInvoiceRepository.findAll(spec, pageable);

        List<EInvoiceResponse> content = invoicePage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<EInvoiceResponse>builder()
                .content(content)
                .pageNumber(invoicePage.getNumber())
                .pageSize(invoicePage.getSize())
                .totalElements(invoicePage.getTotalElements())
                .totalPages(invoicePage.getTotalPages())
                .last(invoicePage.isLast())
                .build();
    }

    private boolean checkDataDifference(EInvoice original, CreateAdjustmentInvoiceRequest request) {
        // Kiểm tra thông tin người mua
        if (!Objects.equals(original.getBuyerName(), request.getBuyerName())) return true;
        if (!Objects.equals(original.getBuyerTaxCode(), request.getBuyerTaxCode())) return true;
        if (!Objects.equals(original.getBuyerAddress(), request.getBuyerAddress())) return true;
        if (!Objects.equals(original.getBuyerPhone(), request.getBuyerPhone())) return true;
        if (!Objects.equals(original.getBuyerEmail(), request.getBuyerEmail())) return true;

        // Kiểm tra danh sách hàng hóa
        List<EInvoiceItem> originalItems = original.getItems();
        List<CreateAdjustmentInvoiceItemRequest> reqItems = request.getItems();

        if (originalItems.size() != reqItems.size()) return true;

        // So sánh từng cặp sản phẩm (để đơn giản và chính xác, chúng ta sort theo productId hoặc productName nếu productId null)
        List<EInvoiceItem> sortedOriginal = new ArrayList<>(originalItems);
        sortedOriginal.sort(Comparator.comparing(item -> item.getProductName() + "_" + (item.getProduct() != null ? item.getProduct().getId() : "")));

        List<CreateAdjustmentInvoiceItemRequest> sortedReq = new ArrayList<>(reqItems);
        sortedReq.sort(Comparator.comparing(item -> item.getProductName() + "_" + (item.getProductId() != null ? item.getProductId() : "")));

        for (int i = 0; i < sortedOriginal.size(); i++) {
            EInvoiceItem origItem = sortedOriginal.get(i);
            CreateAdjustmentInvoiceItemRequest reqItem = sortedReq.get(i);

            String origProdId = origItem.getProduct() != null ? origItem.getProduct().getId() : null;
            String reqProdId = reqItem.getProductId();
            if (!Objects.equals(origProdId, reqProdId)) return true;
            if (!Objects.equals(origItem.getProductName(), reqItem.getProductName())) return true;
            if (!Objects.equals(origItem.getUnit(), reqItem.getUnit())) return true;
            if (origItem.getQuantity().compareTo(reqItem.getQuantity()) != 0) return true;
            if (origItem.getUnitPrice().compareTo(reqItem.getUnitPrice()) != 0) return true;
            if (origItem.getTaxRatePercentage().compareTo(reqItem.getTaxRatePercentage()) != 0) return true;
            
            BigDecimal reqDiscount = reqItem.getDiscountAmount() != null ? reqItem.getDiscountAmount() : BigDecimal.ZERO;
            if (origItem.getDiscountAmount().compareTo(reqDiscount) != 0) return true;
        }

        return false;
    }

    private Map<String, Object> buildInvoiceLogMap(EInvoice invoice) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", invoice.getId());
        map.put("invoiceNumber", invoice.getInvoiceNumber());
        map.put("buyerName", invoice.getBuyerName());
        map.put("finalAmount", invoice.getFinalAmount());
        map.put("status", invoice.getStatus());
        map.put("originalInvoiceId", invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null);
        return map;
    }

    private EInvoiceResponse mapToResponse(EInvoice invoice) {
        List<EInvoiceItemResponse> itemResponses = invoice.getItems().stream().map(item -> EInvoiceItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .unit(item.getUnit())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .taxRatePercentage(item.getTaxRatePercentage())
                .taxAmount(item.getTaxAmount())
                .discountAmount(item.getDiscountAmount())
                .subtotal(item.getSubtotal())
                .createdAt(item.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return EInvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold().getId())
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .originalInvoiceId(invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null)
                .createdByUserId(invoice.getCreatedByUser().getId())
                .createdByFullName(invoice.getCreatedByUser().getFullName())
                .canceledByUserId(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getId() : null)
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerAddress(invoice.getBuyerAddress())
                .buyerPhone(invoice.getBuyerPhone())
                .buyerEmail(invoice.getBuyerEmail())
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
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .items(itemResponses)
                .build();
    }
}
