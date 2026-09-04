package com.sales.service.classes;

import com.sales.dto.request.CreateInventoryAuditDetailRequest;
import com.sales.dto.request.CreateInventoryAuditRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.InventoryAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAuditServiceImpl implements InventoryAuditService {

    private final InventoryAuditRepository inventoryAuditRepository;
    private final InventoryAuditDetailRepository inventoryAuditDetailRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public InventoryAuditResponse createInventoryAudit(String currentUsername, CreateInventoryAuditRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Phân quyền: Chỉ chủ hộ kinh doanh (VT-01) mới được phép kiểm kê và điều chỉnh tồn kho
        if (user.getRole() == null || !"VT-01".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_AUDIT);
        }

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_AUDIT_DETAILS);
        }

        // Kiểm tra trùng lặp mặt hàng trong cùng 1 phiếu kiểm kê
        Set<String> processedProductIds = new HashSet<>();
        for (CreateInventoryAuditDetailRequest detailReq : request.getDetails()) {
            if (!processedProductIds.add(detailReq.getProductId())) {
                throw new AppException(ErrorCode.DUPLICATE_PRODUCT_IN_AUDIT);
            }
        }

        // Sinh mã phiếu kiểm kê độc nhất
        String auditNumber = generateAuditNumber(household.getId());

        BigDecimal totalDiffQty = BigDecimal.ZERO;
        List<InventoryAuditDetail> auditDetails = new ArrayList<>();

        for (CreateInventoryAuditDetailRequest detailReq : request.getDetails()) {
            Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(detailReq.getProductId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

            BigDecimal systemQty = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
            BigDecimal actualQty = detailReq.getActualQuantity() != null ? detailReq.getActualQuantity() : BigDecimal.ZERO;
            BigDecimal diffQty = actualQty.subtract(systemQty);

            // QTN-24: Bắt buộc nhập lý do khi có chênh lệch tồn kho (difference != 0)
            if (diffQty.compareTo(BigDecimal.ZERO) != 0) {
                if (detailReq.getReason() == null || detailReq.getReason().trim().isEmpty()) {
                    throw new AppException(ErrorCode.DISCREPANCY_REASON_REQUIRED);
                }
            }

            // Cập nhật số lượng tồn kho sản phẩm về số lượng thực tế đếm được
            product.setStockQuantity(actualQty);
            productRepository.save(product);

            totalDiffQty = totalDiffQty.add(diffQty);

            InventoryAuditDetail detail = InventoryAuditDetail.builder()
                    .product(product)
                    .systemQuantity(systemQty)
                    .actualQuantity(actualQty)
                    .differenceQuantity(diffQty)
                    .reason(detailReq.getReason() != null ? detailReq.getReason().trim() : null)
                    .build();

            auditDetails.add(detail);
        }

        InventoryAudit audit = InventoryAudit.builder()
                .household(household)
                .createdByUser(user)
                .auditNumber(auditNumber)
                .auditDate(LocalDateTime.now())
                .status("COMPLETED")
                .totalItems(auditDetails.size())
                .totalDifferenceQty(totalDiffQty)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .build();

        InventoryAudit savedAudit = inventoryAuditRepository.save(audit);

        for (InventoryAuditDetail detail : auditDetails) {
            detail.setAudit(savedAudit);
            inventoryAuditDetailRepository.save(detail);
        }

        // Ghi nhật ký kiểm toán (Activity Log)
        String newValueJson = null;
        try {
            Map<String, Object> logMap = new HashMap<>();
            logMap.put("auditNumber", auditNumber);
            logMap.put("totalItems", savedAudit.getTotalItems());
            logMap.put("totalDifferenceQty", savedAudit.getTotalDifferenceQty());
            newValueJson = objectMapper.writeValueAsString(logMap);
        } catch (Exception e) {
            log.error("Lỗi serialize JSON log kiểm kê kho", e);
        }

        activityLogHelper.logActivityInNewTransaction(
                household, user, "KIEM_KE_KHO", "inventory_audits",
                savedAudit.getId(), null, newValueJson, null, null
        );

        return mapToAuditResponse(savedAudit);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryAuditResponse> getInventoryAudits(String currentUsername, int page, int size) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InventoryAudit> auditPage = inventoryAuditRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId(), pageable);

        List<InventoryAuditResponse> content = auditPage.getContent().stream()
                .map(this::mapToAuditResponse)
                .collect(Collectors.toList());

        return PageResponse.<InventoryAuditResponse>builder()
                .content(content)
                .pageNumber(auditPage.getNumber())
                .pageSize(auditPage.getSize())
                .totalElements(auditPage.getTotalElements())
                .totalPages(auditPage.getTotalPages())
                .last(auditPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryAuditDetailInfoResponse getInventoryAuditById(String currentUsername, String id) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        InventoryAudit audit = inventoryAuditRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVENTORY_AUDIT_NOT_FOUND));

        List<InventoryAuditDetail> details = inventoryAuditDetailRepository.findByAuditId(audit.getId());

        List<InventoryAuditDetailResponse> detailResponses = details.stream()
                .map(d -> InventoryAuditDetailResponse.builder()
                        .id(d.getId())
                        .productId(d.getProduct() != null ? d.getProduct().getId() : null)
                        .productSku(d.getProduct() != null ? d.getProduct().getSku() : null)
                        .productName(d.getProduct() != null ? d.getProduct().getName() : null)
                        .unit(d.getProduct() != null ? d.getProduct().getUnit() : null)
                        .systemQuantity(d.getSystemQuantity())
                        .actualQuantity(d.getActualQuantity())
                        .differenceQuantity(d.getDifferenceQuantity())
                        .reason(d.getReason())
                        .build())
                .collect(Collectors.toList());

        return InventoryAuditDetailInfoResponse.builder()
                .id(audit.getId())
                .auditNumber(audit.getAuditNumber())
                .auditDate(audit.getAuditDate())
                .status(audit.getStatus())
                .totalItems(audit.getTotalItems())
                .totalDifferenceQty(audit.getTotalDifferenceQty())
                .createdByUserId(audit.getCreatedByUser() != null ? audit.getCreatedByUser().getId() : null)
                .createdByUserName(audit.getCreatedByUser() != null ? audit.getCreatedByUser().getFullName() : null)
                .notes(audit.getNotes())
                .createdAt(audit.getCreatedAt())
                .details(detailResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PendingOrderCheckResponse checkPendingOrders(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        List<Order> creatingOrders = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "CREATING");

        boolean hasPending = !creatingOrders.isEmpty();
        List<String> orderNumbers = creatingOrders.stream().map(Order::getOrderNumber).collect(Collectors.toList());

        String warning = hasPending
                ? "Cửa hàng hiện có " + creatingOrders.size() + " đơn bán hàng đang tạo chưa hoàn tất (" + String.join(", ", orderNumbers) + "). Việc kiểm kê có thể gây lệch số đếm với thực tế."
                : "Không có đơn bán hàng dang dở.";

        return PendingOrderCheckResponse.builder()
                .hasPendingOrders(hasPending)
                .pendingOrderCount(creatingOrders.size())
                .pendingOrderNumbers(orderNumbers)
                .warningMessage(warning)
                .build();
    }

    private String generateAuditNumber(String householdId) {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = inventoryAuditRepository.countByHouseholdId(householdId) + 1;

        String auditNumber;
        do {
            auditNumber = String.format("KK-%s-%04d", dateStr, count++);
        } while (inventoryAuditRepository.existsByAuditNumber(auditNumber));

        return auditNumber;
    }

    private InventoryAuditResponse mapToAuditResponse(InventoryAudit audit) {
        return InventoryAuditResponse.builder()
                .id(audit.getId())
                .auditNumber(audit.getAuditNumber())
                .auditDate(audit.getAuditDate())
                .status(audit.getStatus())
                .totalItems(audit.getTotalItems())
                .totalDifferenceQty(audit.getTotalDifferenceQty())
                .createdByUserId(audit.getCreatedByUser() != null ? audit.getCreatedByUser().getId() : null)
                .createdByUserName(audit.getCreatedByUser() != null ? audit.getCreatedByUser().getFullName() : null)
                .notes(audit.getNotes())
                .createdAt(audit.getCreatedAt())
                .build();
    }
}
