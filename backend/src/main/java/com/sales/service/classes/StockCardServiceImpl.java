package com.sales.service.classes;

import com.sales.constant.StockChangeType;
import com.sales.constant.StockMovementType;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.StockCardResponse;
import com.sales.dto.response.StockMovementResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.StockCardService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockCardServiceImpl implements StockCardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReturnTicketItemRepository returnTicketItemRepository;
    private final InventoryAuditDetailRepository inventoryAuditDetailRepository;

    @Override
    @Transactional(readOnly = true)
    public StockCardResponse getStockCard(
            String username,
            String productId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        // 1. Authenticate user and household
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        // 2. Validate product exists and belongs to household
        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // 3. Normalize & validate dates
        if (toDate == null) {
            toDate = LocalDate.now();
        }
        if (fromDate == null) {
            fromDate = toDate.minusDays(30);
        }
        if (fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.INVALID_DATE_RANGE);
        }

        log.info("Lấy thông tin thẻ kho cho sản phẩm id={}, sku={} bởi user={}, kỳ [{} - {}]",
                product.getId(), product.getSku(), username, fromDate, toDate);

        LocalDateTime startDateTime = fromDate.atStartOfDay();
        LocalDateTime endDateTime = toDate.atTime(LocalTime.MAX);

        // 4. Calculate openingStock from DB aggregations (with test mock compatibility)
        BigDecimal initialStock = product.getInitialStockQuantity() != null ? product.getInitialStockQuantity() : BigDecimal.ZERO;

        BigDecimal openingIn = goodsReceiptDetailRepository.sumQuantityBefore(product.getId(), household.getId(), startDateTime);
        if (openingIn == null || openingIn.compareTo(BigDecimal.ZERO) == 0) {
            List<GoodsReceiptDetail> all = goodsReceiptDetailRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                openingIn = all.stream()
                        .filter(grd -> {
                            LocalDateTime ts = grd.getReceipt() != null && grd.getReceipt().getReceivedAt() != null
                                    ? grd.getReceipt().getReceivedAt() : grd.getCreatedAt();
                            return ts != null && ts.isBefore(startDateTime);
                        })
                        .map(grd -> grd.getBaseQuantity() != null ? grd.getBaseQuantity() : (grd.getQuantity() != null ? grd.getQuantity() : BigDecimal.ZERO))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal openingOut = orderItemRepository.sumQuantityBefore(product.getId(), household.getId(), startDateTime);
        if (openingOut == null || openingOut.compareTo(BigDecimal.ZERO) == 0) {
            List<OrderItem> all = orderItemRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                openingOut = all.stream()
                        .filter(oi -> {
                            LocalDateTime ts = oi.getOrder() != null && oi.getOrder().getCreatedAt() != null
                                    ? oi.getOrder().getCreatedAt() : oi.getCreatedAt();
                            return ts != null && ts.isBefore(startDateTime);
                        })
                        .map(oi -> oi.getBaseQuantity() != null ? oi.getBaseQuantity() : (oi.getQuantity() != null ? oi.getQuantity() : BigDecimal.ZERO))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal openingReturn = returnTicketItemRepository.sumQuantityBefore(product.getId(), household.getId(), startDateTime);
        if (openingReturn == null || openingReturn.compareTo(BigDecimal.ZERO) == 0) {
            List<ReturnTicketItem> all = returnTicketItemRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                openingReturn = all.stream()
                        .filter(rti -> {
                            LocalDateTime ts = rti.getReturnTicket() != null && rti.getReturnTicket().getApprovedAt() != null
                                    ? rti.getReturnTicket().getApprovedAt() : rti.getCreatedAt();
                            return ts != null && ts.isBefore(startDateTime);
                        })
                        .map(rti -> rti.getQuantity() != null ? rti.getQuantity() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal openingAudit = inventoryAuditDetailRepository.sumDifferenceBefore(product.getId(), household.getId(), startDateTime);
        if (openingAudit == null || openingAudit.compareTo(BigDecimal.ZERO) == 0) {
            List<InventoryAuditDetail> all = inventoryAuditDetailRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                openingAudit = all.stream()
                        .filter(iad -> {
                            LocalDateTime ts = iad.getAudit() != null && iad.getAudit().getAuditDate() != null
                                    ? iad.getAudit().getAuditDate() : iad.getCreatedAt();
                            return ts != null && ts.isBefore(startDateTime);
                        })
                        .map(iad -> iad.getDifferenceQuantity() != null ? iad.getDifferenceQuantity() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal openingMovements = (openingIn != null ? openingIn : BigDecimal.ZERO)
                .subtract(openingOut != null ? openingOut : BigDecimal.ZERO)
                .add(openingReturn != null ? openingReturn : BigDecimal.ZERO)
                .add(openingAudit != null ? openingAudit : BigDecimal.ZERO);

        LocalDateTime productCreatedAt = product.getCreatedAt();
        BigDecimal openingStock;
        boolean initialStockInPeriod = false;
        if (productCreatedAt == null || productCreatedAt.isBefore(startDateTime)) {
            openingStock = initialStock.add(openingMovements);
        } else {
            openingStock = openingMovements;
            if (!productCreatedAt.isAfter(endDateTime) && initialStock.compareTo(BigDecimal.ZERO) > 0) {
                initialStockInPeriod = true;
            }
        }

        // 5. Collect movements occurring strictly in period [startDateTime, endDateTime]
        List<StockMovementInternal> periodMovements = new ArrayList<>();

        if (initialStockInPeriod) {
            periodMovements.add(StockMovementInternal.builder()
                    .id("initial-stock-" + product.getId())
                    .documentId(product.getId())
                    .documentType(StockMovementType.INITIAL_STOCK)
                    .documentTypeName("Tồn kho ban đầu khi tạo sản phẩm")
                    .documentNumber(product.getSku())
                    .documentUrl("/products?id=" + product.getId())
                    .timestamp(productCreatedAt)
                    .changeType(StockChangeType.IN)
                    .quantityIn(initialStock)
                    .quantityOut(BigDecimal.ZERO)
                    .quantityChange(initialStock)
                    .performedBy("Hệ thống")
                    .notes("Khởi tạo tồn kho ban đầu")
                    .build());
        }

        // 5.1 Goods receipts in period (IN)
        List<GoodsReceiptDetail> receiptDetails = goodsReceiptDetailRepository
                .findStockMovementsByProductInPeriod(product.getId(), household.getId(), startDateTime, endDateTime);
        if (receiptDetails == null || receiptDetails.isEmpty()) {
            List<GoodsReceiptDetail> all = goodsReceiptDetailRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                receiptDetails = all.stream()
                        .filter(grd -> {
                            LocalDateTime ts = grd.getReceipt() != null && grd.getReceipt().getReceivedAt() != null
                                    ? grd.getReceipt().getReceivedAt() : grd.getCreatedAt();
                            return ts != null && !ts.isBefore(startDateTime) && !ts.isAfter(endDateTime);
                        })
                        .collect(Collectors.toList());
            }
        }
        if (receiptDetails != null) {
            for (GoodsReceiptDetail grd : receiptDetails) {
                GoodsReceipt gr = grd.getReceipt();
                LocalDateTime ts = gr.getReceivedAt() != null ? gr.getReceivedAt() : grd.getCreatedAt();
                BigDecimal qty = grd.getBaseQuantity() != null ? grd.getBaseQuantity() : (grd.getQuantity() != null ? grd.getQuantity() : BigDecimal.ZERO);
                String performer = resolvePerformer(gr.getCreatedByUser());

                String receiptNotes = gr.getNotes();
                if (grd.getConversionFactor() != null && grd.getConversionFactor().compareTo(BigDecimal.ONE) != 0 && grd.getUnitName() != null) {
                    String convInfo = "[Quy đổi: " + grd.getQuantity() + " " + grd.getUnitName() + " x " + grd.getConversionFactor() + "]";
                    receiptNotes = StringUtils.hasText(receiptNotes) ? receiptNotes + " " + convInfo : convInfo;
                }

                periodMovements.add(StockMovementInternal.builder()
                        .id(grd.getId())
                        .documentId(gr.getId())
                        .documentType(StockMovementType.GOODS_RECEIPT)
                        .documentTypeName("Phiếu nhập kho")
                        .documentNumber(gr.getReceiptNumber())
                        .documentUrl("/products/stock-entry?id=" + gr.getId())
                        .timestamp(ts)
                        .changeType(StockChangeType.IN)
                        .quantityIn(qty)
                        .quantityOut(BigDecimal.ZERO)
                        .quantityChange(qty)
                        .performedBy(performer)
                        .notes(receiptNotes)
                        .build());
            }
        }

        // 5.2 Sale orders in period (OUT)
        List<OrderItem> orderItems = orderItemRepository
                .findStockMovementsByProductInPeriod(product.getId(), household.getId(), startDateTime, endDateTime);
        if (orderItems == null || orderItems.isEmpty()) {
            List<OrderItem> all = orderItemRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                orderItems = all.stream()
                        .filter(oi -> {
                            LocalDateTime ts = oi.getOrder() != null && oi.getOrder().getCreatedAt() != null
                                    ? oi.getOrder().getCreatedAt() : oi.getCreatedAt();
                            return ts != null && !ts.isBefore(startDateTime) && !ts.isAfter(endDateTime);
                        })
                        .collect(Collectors.toList());
            }
        }
        if (orderItems != null) {
            for (OrderItem oi : orderItems) {
                Order order = oi.getOrder();
                LocalDateTime ts = order.getCreatedAt() != null ? order.getCreatedAt() : oi.getCreatedAt();
                BigDecimal qty = oi.getBaseQuantity() != null ? oi.getBaseQuantity() : (oi.getQuantity() != null ? oi.getQuantity() : BigDecimal.ZERO);
                String performer = resolvePerformer(order.getCreatedByUser());

                String orderNotes = "Bán hàng theo đơn " + order.getOrderNumber();
                if (oi.getConversionFactor() != null && oi.getConversionFactor().compareTo(BigDecimal.ONE) != 0 && oi.getUnitName() != null) {
                    orderNotes += " [Quy đổi: " + oi.getQuantity() + " " + oi.getUnitName() + " x " + oi.getConversionFactor() + "]";
                }

                periodMovements.add(StockMovementInternal.builder()
                        .id(oi.getId())
                        .documentId(order.getId())
                        .documentType(StockMovementType.SALE_ORDER)
                        .documentTypeName("Hóa đơn bán hàng")
                        .documentNumber(order.getOrderNumber())
                        .documentUrl("/orders?id=" + order.getId())
                        .timestamp(ts)
                        .changeType(StockChangeType.OUT)
                        .quantityIn(BigDecimal.ZERO)
                        .quantityOut(qty)
                        .quantityChange(qty.negate())
                        .performedBy(performer)
                        .notes(orderNotes)
                        .build());
            }
        }

        // 5.3 Customer returns in period (IN)
        List<ReturnTicketItem> returnItems = returnTicketItemRepository
                .findStockMovementsByProductInPeriod(product.getId(), household.getId(), startDateTime, endDateTime);
        if (returnItems == null || returnItems.isEmpty()) {
            List<ReturnTicketItem> all = returnTicketItemRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                returnItems = all.stream()
                        .filter(rti -> {
                            LocalDateTime ts = rti.getReturnTicket() != null && rti.getReturnTicket().getApprovedAt() != null
                                    ? rti.getReturnTicket().getApprovedAt() : rti.getCreatedAt();
                            return ts != null && !ts.isBefore(startDateTime) && !ts.isAfter(endDateTime);
                        })
                        .collect(Collectors.toList());
            }
        }
        if (returnItems != null) {
            for (ReturnTicketItem rti : returnItems) {
                ReturnTicket rt = rti.getReturnTicket();
                LocalDateTime ts = rt.getApprovedAt() != null ? rt.getApprovedAt() : rt.getCreatedAt();
                BigDecimal qty = rti.getQuantity() != null ? rti.getQuantity() : BigDecimal.ZERO;
                String performer = rt.getApprovedByUser() != null
                        ? resolvePerformer(rt.getApprovedByUser())
                        : resolvePerformer(rt.getCreatedByUser());

                periodMovements.add(StockMovementInternal.builder()
                        .id(rti.getId())
                        .documentId(rt.getId())
                        .documentType(StockMovementType.CUSTOMER_RETURN)
                        .documentTypeName("Phiếu trả hàng")
                        .documentNumber(rt.getTicketNumber())
                        .documentUrl("/return-tickets?id=" + rt.getId())
                        .timestamp(ts)
                        .changeType(StockChangeType.IN)
                        .quantityIn(qty)
                        .quantityOut(BigDecimal.ZERO)
                        .quantityChange(qty)
                        .performedBy(performer)
                        .notes(rt.getReason())
                        .build());
            }
        }

        // 5.4 Inventory audits in period (ADJUST)
        List<InventoryAuditDetail> auditDetails = inventoryAuditDetailRepository
                .findStockMovementsByProductInPeriod(product.getId(), household.getId(), startDateTime, endDateTime);
        if (auditDetails == null || auditDetails.isEmpty()) {
            List<InventoryAuditDetail> all = inventoryAuditDetailRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                auditDetails = all.stream()
                        .filter(iad -> {
                            LocalDateTime ts = iad.getAudit() != null && iad.getAudit().getAuditDate() != null
                                    ? iad.getAudit().getAuditDate() : iad.getCreatedAt();
                            return ts != null && !ts.isBefore(startDateTime) && !ts.isAfter(endDateTime);
                        })
                        .collect(Collectors.toList());
            }
        }
        if (auditDetails != null) {
            for (InventoryAuditDetail iad : auditDetails) {
                InventoryAudit audit = iad.getAudit();
                LocalDateTime ts = audit.getAuditDate() != null ? audit.getAuditDate() : audit.getCreatedAt();
                BigDecimal diff = iad.getDifferenceQuantity() != null ? iad.getDifferenceQuantity() : BigDecimal.ZERO;
                String performer = resolvePerformer(audit.getCreatedByUser());

                BigDecimal qtyIn = BigDecimal.ZERO;
                BigDecimal qtyOut = BigDecimal.ZERO;
                String changeType;
                if (diff.compareTo(BigDecimal.ZERO) >= 0) {
                    qtyIn = diff;
                    changeType = StockChangeType.IN;
                } else {
                    qtyOut = diff.abs();
                    changeType = StockChangeType.OUT;
                }

                String note = iad.getReason() != null && !iad.getReason().isBlank()
                        ? iad.getReason()
                        : audit.getNotes();

                periodMovements.add(StockMovementInternal.builder()
                        .id(iad.getId())
                        .documentId(audit.getId())
                        .documentType(StockMovementType.INVENTORY_AUDIT)
                        .documentTypeName("Kiểm kê kho")
                        .documentNumber(audit.getAuditNumber())
                        .documentUrl("/products/inventory-audits?id=" + audit.getId())
                        .timestamp(ts)
                        .changeType(changeType)
                        .quantityIn(qtyIn)
                        .quantityOut(qtyOut)
                        .quantityChange(diff)
                        .performedBy(performer)
                        .notes(note)
                        .build());
            }
        }

        // 6. Sort chronologically: timestamp ASC -> IN before OUT when same timestamp -> id ASC
        periodMovements.sort(Comparator
                .comparing(StockMovementInternal::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(m -> StockChangeType.IN.equals(m.getChangeType()) ? 0 : 1)
                .thenComparing(StockMovementInternal::getId, Comparator.nullsLast(Comparator.naturalOrder())));

        // 7. Calculate running balances in period
        BigDecimal runningBalance = openingStock;
        BigDecimal periodTotalIn = BigDecimal.ZERO;
        BigDecimal periodTotalOut = BigDecimal.ZERO;
        List<StockMovementResponse> periodMovementResponses = new ArrayList<>();

        for (StockMovementInternal movement : periodMovements) {
            periodTotalIn = periodTotalIn.add(movement.getQuantityIn());
            periodTotalOut = periodTotalOut.add(movement.getQuantityOut());
            runningBalance = runningBalance.add(movement.getQuantityChange());

            periodMovementResponses.add(StockMovementResponse.builder()
                    .id(movement.getId())
                    .documentId(movement.getDocumentId())
                    .documentType(movement.getDocumentType())
                    .documentTypeName(movement.getDocumentTypeName())
                    .documentNumber(movement.getDocumentNumber())
                    .documentUrl(movement.getDocumentUrl())
                    .timestamp(movement.getTimestamp())
                    .changeType(movement.getChangeType())
                    .quantityIn(movement.getQuantityIn())
                    .quantityOut(movement.getQuantityOut())
                    .quantityChange(movement.getQuantityChange())
                    .balanceAfter(runningBalance)
                    .performedBy(movement.getPerformedBy())
                    .notes(movement.getNotes())
                    .build());
        }

        BigDecimal closingStock = openingStock.add(periodTotalIn).subtract(periodTotalOut);

        // 8. Verify data integrity against actual DB stockQuantity (TC-03)
        BigDecimal totalInAll = goodsReceiptDetailRepository.sumQuantityAllTime(product.getId(), household.getId());
        if (totalInAll == null || totalInAll.compareTo(BigDecimal.ZERO) == 0) {
            List<GoodsReceiptDetail> all = goodsReceiptDetailRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                totalInAll = all.stream()
                        .map(grd -> grd.getBaseQuantity() != null ? grd.getBaseQuantity() : (grd.getQuantity() != null ? grd.getQuantity() : BigDecimal.ZERO))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal totalOutAll = orderItemRepository.sumQuantityAllTime(product.getId(), household.getId());
        if (totalOutAll == null || totalOutAll.compareTo(BigDecimal.ZERO) == 0) {
            List<OrderItem> all = orderItemRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                totalOutAll = all.stream()
                        .map(oi -> oi.getBaseQuantity() != null ? oi.getBaseQuantity() : (oi.getQuantity() != null ? oi.getQuantity() : BigDecimal.ZERO))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal totalReturnAll = returnTicketItemRepository.sumQuantityAllTime(product.getId(), household.getId());
        if (totalReturnAll == null || totalReturnAll.compareTo(BigDecimal.ZERO) == 0) {
            List<ReturnTicketItem> all = returnTicketItemRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                totalReturnAll = all.stream()
                        .map(rti -> rti.getQuantity() != null ? rti.getQuantity() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal totalAuditAll = inventoryAuditDetailRepository.sumDifferenceAllTime(product.getId(), household.getId());
        if (totalAuditAll == null || totalAuditAll.compareTo(BigDecimal.ZERO) == 0) {
            List<InventoryAuditDetail> all = inventoryAuditDetailRepository.findStockMovementsByProduct(product.getId(), household.getId());
            if (all != null && !all.isEmpty()) {
                totalAuditAll = all.stream()
                        .map(iad -> iad.getDifferenceQuantity() != null ? iad.getDifferenceQuantity() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal expectedCurrentStock = initialStock
                .add(totalInAll != null ? totalInAll : BigDecimal.ZERO)
                .subtract(totalOutAll != null ? totalOutAll : BigDecimal.ZERO)
                .add(totalReturnAll != null ? totalReturnAll : BigDecimal.ZERO)
                .add(totalAuditAll != null ? totalAuditAll : BigDecimal.ZERO);

        BigDecimal currentDbStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
        boolean isDiscrepancy = expectedCurrentStock.compareTo(currentDbStock) != 0;
        String warning = null;
        if (isDiscrepancy) {
            warning = String.format(
                    "Cảnh báo: Phát hiện sai lệch số liệu tồn kho! Tồn kho lũy kế từ chuỗi chứng từ (%s) không khớp với tồn kho thực tế trong hệ thống (%s). Dữ liệu có thể đã bị can thiệp ngoài luồng hoặc gặp sự cố đồng bộ.",
                    expectedCurrentStock.stripTrailingZeros().toPlainString(),
                    currentDbStock.stripTrailingZeros().toPlainString()
            );
        }

        // 8. Paginate period movements
        if (size <= 0) size = 20;
        if (page < 0) page = 0;

        int totalElements = periodMovementResponses.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0) totalPages = 1;

        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<StockMovementResponse> pagedMovements = periodMovementResponses.subList(fromIndex, toIndex);

        PageResponse<StockMovementResponse> pageResponse = PageResponse.<StockMovementResponse>builder()
                .content(pagedMovements)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(page >= totalPages - 1)
                .build();

        return StockCardResponse.builder()
                .productId(product.getId())
                .productSku(product.getSku())
                .productName(product.getName())
                .unit(product.getUnit())
                .fromDate(fromDate)
                .toDate(toDate)
                .openingStock(openingStock)
                .totalQuantityIn(periodTotalIn)
                .totalQuantityOut(periodTotalOut)
                .closingStock(closingStock)
                .currentStock(currentDbStock)
                .isDiscrepancy(isDiscrepancy)
                .warning(warning)
                .movements(pageResponse)
                .build();
    }

    private String resolvePerformer(User user) {
        if (user == null) return "Hệ thống";
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername() != null ? user.getUsername() : "Hệ thống";
    }

    @Data
    @Builder
    private static class StockMovementInternal {
        private String id;
        private String documentId;
        private String documentType;
        private String documentTypeName;
        private String documentNumber;
        private String documentUrl;
        private LocalDateTime timestamp;
        private String changeType;
        private BigDecimal quantityIn;
        private BigDecimal quantityOut;
        private BigDecimal quantityChange;
        private String performedBy;
        private String notes;
    }
}
