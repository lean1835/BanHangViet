package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateGoodsReceiptDetailRequest;
import com.sales.dto.request.CreateGoodsReceiptRequest;
import com.sales.dto.response.GoodsReceiptDetailInfoResponse;
import com.sales.dto.response.GoodsReceiptDetailResponse;
import com.sales.dto.response.GoodsReceiptResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.GoodsReceiptService;
import com.sales.service.interfaces.SupplierDebtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    private static final String RECEIPT_PREFIX = "NK-";
    private static final String LOG_ACTION_CREATE_RECEIPT = "CREATE_GOODS_RECEIPT";
    private static final String LOG_TARGET_TABLE = "goods_receipts";

    private final UserRepository userRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final ActivityLogRepository activityLogRepository;
    private final SupplierDebtService supplierDebtService;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User getAuthenticatedUserWithHousehold(String username) {
        User user = getAuthenticatedUser(username);
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return user;
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        String clientIp = request != null ? request.getRemoteAddr() : null;
        String userAgent = request != null ? request.getHeader("User-Agent") : null;

        String oldStr = null;
        String newStr = null;
        try {
            oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;
        } catch (Exception e) {
            log.error("Failed to serialize log values for goods receipt", e);
        }

        ActivityLog logRecord = ActivityLog.builder()
                .household(household)
                .user(actor)
                .action(action)
                .targetTable(LOG_TARGET_TABLE)
                .targetId(targetId)
                .oldValue(oldStr)
                .newValue(newStr)
                .clientIp(clientIp)
                .userAgent(userAgent)
                .build();

        activityLogRepository.save(logRecord);
    }

    private Map<String, Object> buildReceiptLogMap(GoodsReceipt receipt, List<GoodsReceiptDetail> details) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", receipt.getId());
        map.put("receiptNumber", receipt.getReceiptNumber());
        map.put("supplierId", receipt.getSupplier() != null ? receipt.getSupplier().getId() : null);
        map.put("supplierName", receipt.getSupplier() != null ? receipt.getSupplier().getName() : null);
        map.put("totalAmount", receipt.getTotalAmount());
        map.put("receivedAt", receipt.getReceivedAt());
        map.put("notes", receipt.getNotes());
        map.put("householdId", receipt.getHousehold() != null ? receipt.getHousehold().getId() : null);
        map.put("createdByUserId", receipt.getCreatedByUser() != null ? receipt.getCreatedByUser().getId() : null);

        List<Map<String, Object>> detailsMap = details.stream().map(d -> {
            Map<String, Object> dMap = new HashMap<>();
            dMap.put("productId", d.getProduct().getId());
            dMap.put("quantity", d.getQuantity());
            dMap.put("purchasePrice", d.getPurchasePrice());
            dMap.put("newCostPrice", d.getProduct().getCostPrice());
            return dMap;
        }).collect(Collectors.toList());

        map.put("details", detailsMap);
        return map;
    }

    private GoodsReceiptResponse mapToResponse(GoodsReceipt receipt) {
        return GoodsReceiptResponse.builder()
                .id(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
                .supplierId(receipt.getSupplier() != null ? receipt.getSupplier().getId() : null)
                .supplierName(receipt.getSupplier() != null ? receipt.getSupplier().getName() : null)
                .totalAmount(receipt.getTotalAmount())
                .receivedAt(receipt.getReceivedAt())
                .notes(receipt.getNotes())
                .createdByUserId(receipt.getCreatedByUser().getId())
                .createdByUserName(receipt.getCreatedByUser().getFullName())
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .build();
    }

    private GoodsReceiptDetailResponse mapDetailToResponse(GoodsReceiptDetail detail) {
        BigDecimal subtotal = detail.getQuantity() != null && detail.getPurchasePrice() != null
                ? detail.getQuantity().multiply(detail.getPurchasePrice()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return GoodsReceiptDetailResponse.builder()
                .id(detail.getId())
                .productId(detail.getProduct().getId())
                .productName(detail.getProduct().getName())
                .productSku(detail.getProduct().getSku())
                .quantity(detail.getQuantity())
                .purchasePrice(detail.getPurchasePrice())
                .subtotal(subtotal)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GoodsReceiptResponse createGoodsReceipt(String currentUsername, CreateGoodsReceiptRequest request) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        // Validate details
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_RECEIPT_DETAILS);
        }

        // Validate duplicate products in details
        long uniqueProductCount = request.getDetails().stream()
                .map(CreateGoodsReceiptDetailRequest::getProductId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        if (uniqueProductCount < request.getDetails().size()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // Validate supplier if provided
        Supplier supplier = null;
        if (StringUtils.hasText(request.getSupplierId())) {
            supplier = supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getSupplierId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));
        }

        // Extract product IDs and query all products in one batch
        List<String> productIds = request.getDetails().stream()
                .map(CreateGoodsReceiptDetailRequest::getProductId)
                .distinct()
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productIds, household.getId());
        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Validate that all products exist and belong to the household
        for (CreateGoodsReceiptDetailRequest detailRequest : request.getDetails()) {
            if (!productMap.containsKey(detailRequest.getProductId())) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
        }

        // Check for selling below cost warning (purchasePrice > product.price)
        boolean containsSellingBelowCost = request.getDetails().stream().anyMatch(d -> {
            Product p = productMap.get(d.getProductId());
            return p != null && d.getPurchasePrice() != null && p.getPrice() != null
                    && d.getPurchasePrice().compareTo(p.getPrice()) > 0;
        });

        if (containsSellingBelowCost && !Boolean.TRUE.equals(request.getConfirmSellingBelowCost())) {
            throw new AppException(ErrorCode.SELLING_BELOW_COST_WARNING);
        }

        // Generate receipt number if not provided
        String receiptNumber = request.getReceiptNumber();
        if (!StringUtils.hasText(receiptNumber)) {
            receiptNumber = RECEIPT_PREFIX + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        } else {
            // Check global duplicate receipt number
            if (goodsReceiptRepository.existsByReceiptNumber(receiptNumber)) {
                throw new AppException(ErrorCode.RECEIPT_NUMBER_EXISTS);
            }
        }

        LocalDateTime receivedAt = request.getReceivedAt() != null ? request.getReceivedAt() : LocalDateTime.now();

        // Calculate total amount for the receipt by summing rounded item subtotals
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateGoodsReceiptDetailRequest detailReq : request.getDetails()) {
            if (detailReq.getQuantity() != null && detailReq.getPurchasePrice() != null) {
                BigDecimal itemSubtotal = detailReq.getQuantity()
                        .multiply(detailReq.getPurchasePrice())
                        .setScale(2, RoundingMode.HALF_UP);
                totalAmount = totalAmount.add(itemSubtotal);
            }
        }

        GoodsReceipt receipt = GoodsReceipt.builder()
                .household(household)
                .supplier(supplier)
                .createdByUser(currentUser)
                .receiptNumber(receiptNumber)
                .totalAmount(totalAmount)
                .receivedAt(receivedAt)
                .notes(request.getNotes())
                .build();

        receipt = goodsReceiptRepository.save(receipt);

        List<GoodsReceiptDetail> detailsToSave = new ArrayList<>();
        for (CreateGoodsReceiptDetailRequest detailRequest : request.getDetails()) {
            Product product = productMap.get(detailRequest.getProductId());

            GoodsReceiptDetail detail = GoodsReceiptDetail.builder()
                    .receipt(receipt)
                    .product(product)
                    .quantity(detailRequest.getQuantity())
                    .purchasePrice(detailRequest.getPurchasePrice())
                    .build();

            detailsToSave.add(detail);

            // Calculate moving average cost price (QTN-23) & update stock quantity
            BigDecimal currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
            BigDecimal currentCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
            BigDecimal importQty = detailRequest.getQuantity();
            BigDecimal importPrice = detailRequest.getPurchasePrice();

            BigDecimal newCost;
            BigDecimal combinedQty = currentStock.add(importQty);
            if (currentStock.compareTo(BigDecimal.ZERO) > 0 && combinedQty.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentTotalVal = currentStock.multiply(currentCost);
                BigDecimal importTotalVal = importQty.multiply(importPrice);
                BigDecimal combinedVal = currentTotalVal.add(importTotalVal);
                newCost = combinedVal.divide(combinedQty, 2, RoundingMode.HALF_UP);
            } else {
                newCost = importPrice.setScale(2, RoundingMode.HALF_UP);
            }

            product.setCostPrice(newCost);
            product.setStockQuantity(currentStock.add(importQty));
        }

        // Batch save details and products
        List<GoodsReceiptDetail> savedDetails = goodsReceiptDetailRepository.saveAll(detailsToSave);
        productRepository.saveAll(productMap.values());

        if (supplier != null) {
            supplierDebtService.recordGoodsReceiptDebt(household, supplier, receipt, currentUser);
        }

        logActivity(household, currentUser, LOG_ACTION_CREATE_RECEIPT, receipt.getId(), null, buildReceiptLogMap(receipt, savedDetails));

        return mapToResponse(receipt);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GoodsReceiptResponse> getGoodsReceipts(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GoodsReceipt> receiptPage = goodsReceiptRepository.findByHouseholdId(household.getId(), pageable);

        List<GoodsReceiptResponse> content = receiptPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<GoodsReceiptResponse>builder()
                .content(content)
                .pageNumber(receiptPage.getNumber())
                .pageSize(receiptPage.getSize())
                .totalElements(receiptPage.getTotalElements())
                .totalPages(receiptPage.getTotalPages())
                .last(receiptPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public GoodsReceiptDetailInfoResponse getGoodsReceiptById(String currentUsername, String id) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        GoodsReceipt receipt = goodsReceiptRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOODS_RECEIPT_NOT_FOUND));

        List<GoodsReceiptDetail> details = goodsReceiptDetailRepository.findByReceiptId(id);
        List<GoodsReceiptDetailResponse> detailResponses = details.stream()
                .map(this::mapDetailToResponse)
                .collect(Collectors.toList());

        return GoodsReceiptDetailInfoResponse.builder()
                .id(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
                .supplierId(receipt.getSupplier() != null ? receipt.getSupplier().getId() : null)
                .supplierName(receipt.getSupplier() != null ? receipt.getSupplier().getName() : null)
                .totalAmount(receipt.getTotalAmount())
                .receivedAt(receipt.getReceivedAt())
                .notes(receipt.getNotes())
                .createdByUserId(receipt.getCreatedByUser().getId())
                .createdByUserName(receipt.getCreatedByUser().getFullName())
                .details(detailResponses)
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .build();
    }
}

