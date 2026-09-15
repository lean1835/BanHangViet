package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateSupplierReturnItemRequest;
import com.sales.dto.request.CreateSupplierReturnRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.SupplierDebtService;
import com.sales.service.interfaces.SupplierReturnService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierReturnServiceImpl implements SupplierReturnService {

    private static final String RETURN_PREFIX = "TH-NCC-";
    private static final String LOG_ACTION_CREATE_RETURN = "CREATE_SUPPLIER_RETURN";
    private static final String LOG_TARGET_TABLE = "supplier_returns";

    private final UserRepository userRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final ProductRepository productRepository;
    private final SupplierReturnRepository supplierReturnRepository;
    private final SupplierReturnItemRepository supplierReturnItemRepository;
    private final SupplierDebtService supplierDebtService;
    private final ActivityLogHelper activityLogHelper;
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

    private void validateStoreOwnerRole(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_RETURN_SUPPLIER);
        }
        String roleCode = user.getRole().getCode();
        String roleName = user.getRole().getName();
        boolean isOwner = "VT-01".equals(roleCode) || "ROLE_VT-01".equals(roleCode) || "VT-01".equalsIgnoreCase(roleName);
        if (!isOwner) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_RETURN_SUPPLIER);
        }
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(
                    household, actor, action, LOG_TARGET_TABLE, targetId, oldStr, newStr, clientIp, userAgent
            );
        } catch (Exception e) {
            log.error("Failed to write activity log for supplier return", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ReceiptReturnableCheckResponse checkReceiptReturnable(String currentUsername, String receiptId) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        GoodsReceipt receipt = goodsReceiptRepository.findByIdAndHouseholdId(receiptId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOODS_RECEIPT_NOT_FOUND));

        List<GoodsReceiptDetail> details = goodsReceiptDetailRepository.findByReceiptId(receiptId);
        List<String> detailIds = details.stream().map(GoodsReceiptDetail::getId).collect(Collectors.toList());

        Map<String, BigDecimal> returnedQtyMap = new HashMap<>();
        if (!detailIds.isEmpty()) {
            List<SupplierReturnItemRepository.ReceiptDetailReturnedProjection> returnedList =
                    supplierReturnItemRepository.sumQuantityReturnedByDetailIds(detailIds);
            for (SupplierReturnItemRepository.ReceiptDetailReturnedProjection proj : returnedList) {
                returnedQtyMap.put(proj.getDetailId(), proj.getTotalReturned());
            }
        }

        List<ReceiptReturnableItemResponse> items = new ArrayList<>();
        for (GoodsReceiptDetail detail : details) {
            Product product = detail.getProduct();
            BigDecimal importedQty = detail.getQuantity() != null ? detail.getQuantity() : BigDecimal.ZERO;
            BigDecimal previouslyReturned = returnedQtyMap.getOrDefault(detail.getId(), BigDecimal.ZERO);
            BigDecimal remainingReturnable = importedQty.subtract(previouslyReturned);
            if (remainingReturnable.compareTo(BigDecimal.ZERO) < 0) {
                remainingReturnable = BigDecimal.ZERO;
            }

            BigDecimal currentStock = (product != null && product.getStockQuantity() != null)
                    ? product.getStockQuantity() : BigDecimal.ZERO;

            BigDecimal conversionFactor = detail.getConversionFactor() != null ? detail.getConversionFactor() : BigDecimal.ONE;
            BigDecimal currentStockInReceiptUnit = conversionFactor.compareTo(BigDecimal.ZERO) > 0
                    ? currentStock.divide(conversionFactor, 3, RoundingMode.HALF_UP)
                    : currentStock;

            BigDecimal maxAllowed = remainingReturnable.min(currentStockInReceiptUnit);
            if (maxAllowed.compareTo(BigDecimal.ZERO) < 0) {
                maxAllowed = BigDecimal.ZERO;
            }

            items.add(ReceiptReturnableItemResponse.builder()
                    .receiptDetailId(detail.getId())
                    .productId(product != null ? product.getId() : null)
                    .productCode(product != null ? (product.getSku() != null ? product.getSku() : product.getBarcode()) : null)
                    .productName(product != null ? product.getName() : null)
                    .unitName(detail.getUnitName() != null ? detail.getUnitName() : (product != null ? product.getUnit() : null))
                    .importedQuantity(importedQty)
                    .previouslyReturnedQuantity(previouslyReturned)
                    .remainingReturnableQuantity(remainingReturnable)
                    .currentStockQuantity(currentStock)
                    .maxAllowedReturnQuantity(maxAllowed)
                    .purchasePrice(detail.getPurchasePrice())
                    .conversionFactor(conversionFactor)
                    .basePurchasePrice(detail.getBasePurchasePrice() != null ? detail.getBasePurchasePrice() : detail.getPurchasePrice())
                    .build());
        }

        Supplier supplier = receipt.getSupplier();

        return ReceiptReturnableCheckResponse.builder()
                .receiptId(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
                .receivedAt(receipt.getReceivedAt())
                .supplierId(supplier != null ? supplier.getId() : null)
                .supplierName(supplier != null ? supplier.getName() : null)
                .supplierPhone(supplier != null ? supplier.getPhoneNumber() : null)
                .supplierCurrentDebt(supplier != null ? supplier.getCurrentDebt() : BigDecimal.ZERO)
                .receiptTotalAmount(receipt.getTotalAmount())
                .items(items)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SupplierReturnResponse createSupplierReturn(String currentUsername, CreateSupplierReturnRequest request) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        validateStoreOwnerRole(currentUser);
        BusinessHousehold household = currentUser.getHousehold();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_SUPPLIER_RETURN_ITEMS);
        }

        // Check duplicate items in request
        long uniqueDetailCount = request.getItems().stream()
                .map(CreateSupplierReturnItemRequest::getReceiptDetailId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        if (uniqueDetailCount < request.getItems().size()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        GoodsReceipt receipt = goodsReceiptRepository.findByIdAndHouseholdId(request.getReceiptId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOODS_RECEIPT_NOT_FOUND));

        List<GoodsReceiptDetail> receiptDetails = goodsReceiptDetailRepository.findByReceiptId(receipt.getId());
        Map<String, GoodsReceiptDetail> detailMap = receiptDetails.stream()
                .collect(Collectors.toMap(GoodsReceiptDetail::getId, d -> d));

        // Generate return number
        String returnNumber = request.getReturnNumber();
        if (!StringUtils.hasText(returnNumber)) {
            String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
            String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            returnNumber = RETURN_PREFIX + datePart + "-" + randomPart;
        } else {
            if (supplierReturnRepository.existsByReturnNumber(returnNumber)) {
                throw new AppException(ErrorCode.SUPPLIER_RETURN_NUMBER_EXISTS);
            }
        }

        LocalDateTime returnDate = request.getReturnDate() != null ? request.getReturnDate() : LocalDateTime.now();

        BigDecimal totalReturnAmount = BigDecimal.ZERO;
        List<SupplierReturnItem> itemsToSave = new ArrayList<>();
        Map<String, Product> productsToUpdate = new HashMap<>();

        List<String> detailIds = request.getItems().stream()
                .map(CreateSupplierReturnItemRequest::getReceiptDetailId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<String, BigDecimal> returnedQtyMap = new HashMap<>();
        if (!detailIds.isEmpty()) {
            List<SupplierReturnItemRepository.ReceiptDetailReturnedProjection> returnedList =
                    supplierReturnItemRepository.sumQuantityReturnedByDetailIds(detailIds);
            for (SupplierReturnItemRepository.ReceiptDetailReturnedProjection proj : returnedList) {
                returnedQtyMap.put(proj.getDetailId(), proj.getTotalReturned());
            }
        }

        for (CreateSupplierReturnItemRequest itemReq : request.getItems()) {
            GoodsReceiptDetail detail = detailMap.get(itemReq.getReceiptDetailId());
            if (detail == null) {
                throw new AppException(ErrorCode.RECEIPT_DETAIL_NOT_FOUND_IN_RECEIPT);
            }

            BigDecimal returnQty = itemReq.getQuantity();
            if (returnQty == null || returnQty.compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            // Check against previous returns (AC-02)
            BigDecimal previouslyReturned = returnedQtyMap.getOrDefault(detail.getId(), BigDecimal.ZERO);
            BigDecimal importedQty = detail.getQuantity() != null ? detail.getQuantity() : BigDecimal.ZERO;
            BigDecimal remainingReturnable = importedQty.subtract(previouslyReturned);

            if (returnQty.compareTo(remainingReturnable) > 0) {
                log.warn("Mặt hàng {} yêu cầu trả {} vượt quá số lượng còn lại có thể trả {} (AC-02)",
                        detail.getProduct().getName(), returnQty, remainingReturnable);
                throw new AppException(ErrorCode.EXCEEDED_SUPPLIER_RETURNABLE_QUANTITY);
            }

            Product product = productsToUpdate.getOrDefault(detail.getProduct().getId(), detail.getProduct());

            BigDecimal conversionFactor = detail.getConversionFactor() != null ? detail.getConversionFactor() : BigDecimal.ONE;
            BigDecimal returnBaseQty = returnQty.multiply(conversionFactor);
            BigDecimal basePurchasePrice = detail.getBasePurchasePrice() != null ? detail.getBasePurchasePrice() : detail.getPurchasePrice();

            // Check stock quantity (QTN-24)
            BigDecimal currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
            if (returnBaseQty.compareTo(currentStock) > 0) {
                log.warn("Mặt hàng {} yêu cầu trả cơ sở {} vượt quá tồn kho hiện tại {} (QTN-24)",
                        product.getName(), returnBaseQty, currentStock);
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK_FOR_RETURN);
            }

            BigDecimal subtotal = returnQty.multiply(detail.getPurchasePrice()).setScale(2, RoundingMode.HALF_UP);
            totalReturnAmount = totalReturnAmount.add(subtotal);

            SupplierReturnItem returnItem = SupplierReturnItem.builder()
                    .receiptDetail(detail)
                    .product(product)
                    .quantity(returnQty)
                    .purchasePrice(detail.getPurchasePrice())
                    .unitConversionId(detail.getUnitConversionId())
                    .unitName(detail.getUnitName())
                    .conversionFactor(conversionFactor)
                    .baseQuantity(returnBaseQty)
                    .basePurchasePrice(basePurchasePrice)
                    .subtotal(subtotal)
                    .itemReason(itemReq.getItemReason())
                    .build();

            itemsToSave.add(returnItem);

            // Recalculate weighted average cost (QTN-23) and update stock quantity (QTN-24)
            BigDecimal currentCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
            BigDecimal newStock = currentStock.subtract(returnBaseQty);

            BigDecimal newCost = currentCost;
            if (newStock.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal oldTotalVal = currentStock.multiply(currentCost);
                BigDecimal returnTotalVal = returnBaseQty.multiply(basePurchasePrice);
                BigDecimal newTotalVal = oldTotalVal.subtract(returnTotalVal);
                if (newTotalVal.compareTo(BigDecimal.ZERO) > 0) {
                    newCost = newTotalVal.divide(newStock, 2, RoundingMode.HALF_UP);
                }
            }

            product.setStockQuantity(newStock);
            product.setCostPrice(newCost);
            productsToUpdate.put(product.getId(), product);
        }

        SupplierReturn supplierReturn = SupplierReturn.builder()
                .household(household)
                .receipt(receipt)
                .supplier(receipt.getSupplier())
                .createdByUser(currentUser)
                .returnNumber(returnNumber)
                .returnDate(returnDate)
                .reason(request.getReason())
                .notes(request.getNotes())
                .totalReturnAmount(totalReturnAmount)
                .build();

        supplierReturn = supplierReturnRepository.save(supplierReturn);

        for (SupplierReturnItem item : itemsToSave) {
            item.setSupplierReturn(supplierReturn);
        }

        supplierReturnItemRepository.saveAll(itemsToSave);
        productRepository.saveAll(productsToUpdate.values());

        // Khấu trừ công nợ nhà cung cấp
        Supplier supplier = receipt.getSupplier();
        if (supplier != null && totalReturnAmount.compareTo(BigDecimal.ZERO) > 0) {
            supplierDebtService.recordSupplierReturnDebtReduction(
                    household, supplier, receipt, totalReturnAmount, returnNumber, currentUser
            );
        }

        logActivity(household, currentUser, LOG_ACTION_CREATE_RETURN, supplierReturn.getId(), null, buildReturnLogMap(supplierReturn, itemsToSave));

        return mapToResponse(supplierReturn, itemsToSave.size());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupplierReturnResponse> getSupplierReturns(
            String currentUsername,
            String supplierId,
            LocalDate fromDate,
            LocalDate toDate,
            String keyword,
            int page,
            int size
    ) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<SupplierReturn> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("household").get("id"), household.getId()));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (StringUtils.hasText(supplierId)) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("returnDate"), fromDate.atStartOfDay()));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("returnDate"), toDate.atTime(LocalTime.MAX)));
            }

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate returnNumPredicate = cb.like(cb.lower(root.get("returnNumber")), pattern);
                Predicate receiptNumPredicate = cb.like(cb.lower(root.get("receipt").get("receiptNumber")), pattern);
                predicates.add(cb.or(returnNumPredicate, receiptNumPredicate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<SupplierReturn> returnPage = supplierReturnRepository.findAll(spec, pageable);

        List<SupplierReturnResponse> content = returnPage.getContent().stream()
                .map(sr -> mapToResponse(sr, sr.getItems() != null ? sr.getItems().size() : 0))
                .collect(Collectors.toList());

        return PageResponse.<SupplierReturnResponse>builder()
                .content(content)
                .pageNumber(returnPage.getNumber())
                .pageSize(returnPage.getSize())
                .totalElements(returnPage.getTotalElements())
                .totalPages(returnPage.getTotalPages())
                .last(returnPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierReturnDetailResponse getSupplierReturnById(String currentUsername, String id) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        SupplierReturn supplierReturn = supplierReturnRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_RETURN_NOT_FOUND));

        GoodsReceipt receipt = supplierReturn.getReceipt();
        Supplier supplier = supplierReturn.getSupplier();

        List<SupplierReturnItemResponse> itemResponses = supplierReturn.getItems().stream()
                .map(item -> SupplierReturnItemResponse.builder()
                        .id(item.getId())
                        .receiptDetailId(item.getReceiptDetail() != null ? item.getReceiptDetail().getId() : null)
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productCode(item.getProduct() != null ? (item.getProduct().getSku() != null ? item.getProduct().getSku() : item.getProduct().getBarcode()) : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                        .unitName(item.getUnitName())
                        .quantity(item.getQuantity())
                        .purchasePrice(item.getPurchasePrice())
                        .conversionFactor(item.getConversionFactor())
                        .baseQuantity(item.getBaseQuantity())
                        .basePurchasePrice(item.getBasePurchasePrice())
                        .subtotal(item.getSubtotal())
                        .itemReason(item.getItemReason())
                        .newCostPrice(item.getProduct() != null ? item.getProduct().getCostPrice() : null)
                        .newStockQuantity(item.getProduct() != null ? item.getProduct().getStockQuantity() : null)
                        .build())
                .collect(Collectors.toList());

        return SupplierReturnDetailResponse.builder()
                .id(supplierReturn.getId())
                .returnNumber(supplierReturn.getReturnNumber())
                .receiptId(receipt != null ? receipt.getId() : null)
                .receiptNumber(receipt != null ? receipt.getReceiptNumber() : null)
                .receiptReceivedAt(receipt != null ? receipt.getReceivedAt() : null)
                .supplierId(supplier != null ? supplier.getId() : null)
                .supplierName(supplier != null ? supplier.getName() : null)
                .supplierPhone(supplier != null ? supplier.getPhoneNumber() : null)
                .supplierDebtReduced(supplierReturn.getTotalReturnAmount())
                .totalReturnAmount(supplierReturn.getTotalReturnAmount())
                .reason(supplierReturn.getReason())
                .notes(supplierReturn.getNotes())
                .returnDate(supplierReturn.getReturnDate())
                .createdByUserId(supplierReturn.getCreatedByUser() != null ? supplierReturn.getCreatedByUser().getId() : null)
                .createdByUserName(supplierReturn.getCreatedByUser() != null ? supplierReturn.getCreatedByUser().getFullName() : null)
                .items(itemResponses)
                .createdAt(supplierReturn.getCreatedAt())
                .updatedAt(supplierReturn.getUpdatedAt())
                .build();
    }

    private SupplierReturnResponse mapToResponse(SupplierReturn sr, int itemCount) {
        return SupplierReturnResponse.builder()
                .id(sr.getId())
                .returnNumber(sr.getReturnNumber())
                .receiptId(sr.getReceipt() != null ? sr.getReceipt().getId() : null)
                .receiptNumber(sr.getReceipt() != null ? sr.getReceipt().getReceiptNumber() : null)
                .supplierId(sr.getSupplier() != null ? sr.getSupplier().getId() : null)
                .supplierName(sr.getSupplier() != null ? sr.getSupplier().getName() : null)
                .totalReturnAmount(sr.getTotalReturnAmount())
                .reason(sr.getReason())
                .notes(sr.getNotes())
                .returnDate(sr.getReturnDate())
                .createdByUserId(sr.getCreatedByUser() != null ? sr.getCreatedByUser().getId() : null)
                .createdByUserName(sr.getCreatedByUser() != null ? sr.getCreatedByUser().getFullName() : null)
                .createdAt(sr.getCreatedAt())
                .totalItems(itemCount)
                .build();
    }

    private Map<String, Object> buildReturnLogMap(SupplierReturn sr, List<SupplierReturnItem> items) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", sr.getId());
        map.put("returnNumber", sr.getReturnNumber());
        map.put("receiptId", sr.getReceipt() != null ? sr.getReceipt().getId() : null);
        map.put("supplierId", sr.getSupplier() != null ? sr.getSupplier().getId() : null);
        map.put("totalReturnAmount", sr.getTotalReturnAmount());
        map.put("reason", sr.getReason());
        map.put("notes", sr.getNotes());
        map.put("returnDate", sr.getReturnDate());

        List<Map<String, Object>> itemMaps = items.stream().map(i -> {
            Map<String, Object> iMap = new HashMap<>();
            iMap.put("productId", i.getProduct() != null ? i.getProduct().getId() : null);
            iMap.put("quantity", i.getQuantity());
            iMap.put("baseQuantity", i.getBaseQuantity());
            iMap.put("purchasePrice", i.getPurchasePrice());
            iMap.put("subtotal", i.getSubtotal());
            return iMap;
        }).collect(Collectors.toList());

        map.put("items", itemMaps);
        return map;
    }
}
