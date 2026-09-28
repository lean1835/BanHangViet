package com.sales.modules.inventory.service.impl;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.inventory.dto.response.InventoryValuationItemResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationReportResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationSummaryResponse;
import com.sales.modules.inventory.dto.response.MissingCostProductResponse;
import com.sales.modules.inventory.repository.GoodsReceiptDetailRepository;
import com.sales.modules.inventory.repository.InventoryAuditDetailRepository;
import com.sales.modules.order.repository.OrderItemRepository;
import com.sales.modules.order.repository.ReturnTicketItemRepository;
import com.sales.modules.product.dto.response.ProductGroupValuationResponse;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.supplier.repository.SupplierReturnItemRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.product.entity.Product;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.inventory.service.InventoryValuationReportService;
import com.sales.common.utils.InventoryValuationExcelBuilder;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryValuationReportServiceImpl implements InventoryValuationReportService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReturnTicketItemRepository returnTicketItemRepository;
    private final SupplierReturnItemRepository supplierReturnItemRepository;
    private final InventoryAuditDetailRepository inventoryAuditDetailRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUserWithHousehold(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return user;
    }

    private void validateRolePermission(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        String roleCode = user.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryValuationReportResponse getInventoryValuationReport(
            String currentUsername,
            LocalDate asOfDate,
            String groupId,
            String search,
            String sortBy,
            String sortDir
    ) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        validateRolePermission(currentUser);
        BusinessHousehold household = currentUser.getHousehold();

        if (asOfDate != null && asOfDate.isAfter(LocalDate.now())) {
            throw new AppException(ErrorCode.FUTURE_DATE_NOT_ALLOWED);
        }

        LocalDate targetDate = asOfDate != null ? asOfDate : LocalDate.now();
        boolean isHistorical = targetDate.isBefore(LocalDate.now());

        log.info("Lập báo cáo giá trị tồn kho theo giá vốn cho hộ {}, asOfDate={}, isHistorical={}",
                household.getName(), targetDate, isHistorical);

        String cleanGroupId = StringUtils.hasText(groupId) ? groupId.trim() : null;
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;
        List<Product> products = productRepository.findProductsForValuationReport(household.getId(), cleanGroupId, cleanSearch);

        Map<String, BigDecimal> stockMap = calculateStockQuantities(household, products, targetDate, isHistorical);

        Map<String, LocalDate> lastReceiptDateMap = fetchLatestReceiptDates(household, targetDate, isHistorical);

        List<InventoryValuationItemResponse> valuedItems = new ArrayList<>();
        List<MissingCostProductResponse> missingCostItems = new ArrayList<>();

        for (Product p : products) {
            BigDecimal stock = stockMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal costPrice = p.getCostPrice();

            String pGroupId = p.getGroup() != null ? p.getGroup().getId() : null;
            String pGroupName = p.getGroup() != null ? p.getGroup().getName() : "Chưa phân nhóm";

            if (costPrice == null || costPrice.compareTo(BigDecimal.ZERO) <= 0) {
                missingCostItems.add(MissingCostProductResponse.builder()
                        .productId(p.getId())
                        .sku(p.getSku())
                        .productName(p.getName())
                        .unit(p.getUnit())
                        .groupId(pGroupId)
                        .groupName(pGroupName)
                        .stockQuantity(stock)
                        .retailPrice(p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO)
                        .warningMessage("Chưa có giá vốn từ phiếu nhập (loại trừ khỏi tổng giá trị tồn kho)")
                        .build());
            } else {
                boolean isNegative = stock.compareTo(BigDecimal.ZERO) < 0;
                BigDecimal retailPrice = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;

                BigDecimal inventoryValue = BigDecimal.ZERO;
                BigDecimal retailValue = BigDecimal.ZERO;
                Long daysInStock = 0L;
                LocalDate lastReceipt = lastReceiptDateMap.get(p.getId());

                if (!isNegative) {
                    inventoryValue = stock.multiply(costPrice).setScale(2, RoundingMode.HALF_UP);
                    retailValue = stock.multiply(retailPrice).setScale(2, RoundingMode.HALF_UP);
                    daysInStock = calculateProductDaysInStock(p, targetDate, lastReceipt);
                }

                valuedItems.add(InventoryValuationItemResponse.builder()
                        .productId(p.getId())
                        .sku(p.getSku())
                        .productName(p.getName())
                        .unit(p.getUnit())
                        .groupId(pGroupId)
                        .groupName(pGroupName)
                        .stockQuantity(stock)
                        .costPrice(costPrice)
                        .inventoryValue(inventoryValue)
                        .retailPrice(retailPrice)
                        .retailValue(retailValue)
                        .lastImportDate(lastReceipt)
                        .daysInStock(daysInStock)
                        .isNegativeStock(isNegative)
                        .build());
            }
        }

        BigDecimal totalStock = valuedItems.stream()
                .map(InventoryValuationItemResponse::getStockQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal missingCostStock = missingCostItems.stream()
                .map(MissingCostProductResponse::getStockQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalValuation = valuedItems.stream()
                .map(InventoryValuationItemResponse::getInventoryValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRetail = valuedItems.stream()
                .map(InventoryValuationItemResponse::getRetailValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal potentialGrossProfit = totalRetail.subtract(totalValuation);
        BigDecimal potentialMargin = BigDecimal.ZERO;
        if (totalRetail.compareTo(BigDecimal.ZERO) > 0) {
            potentialMargin = potentialGrossProfit.multiply(BigDecimal.valueOf(100))
                    .divide(totalRetail, 2, RoundingMode.HALF_UP);
        }

        Long averageDaysInStock = calculateWeightedAverageDays(valuedItems, totalValuation);

        InventoryValuationSummaryResponse summary = InventoryValuationSummaryResponse.builder()
                .asOfDate(targetDate)
                .isHistorical(isHistorical)
                .totalProducts((long) products.size())
                .valuedProductsCount((long) valuedItems.size())
                .missingCostProductsCount((long) missingCostItems.size())
                .totalStockQuantity(totalStock)
                .missingCostStockQuantity(missingCostStock)
                .totalInventoryValue(totalValuation)
                .totalRetailValue(totalRetail)
                .potentialGrossProfit(potentialGrossProfit)
                .potentialProfitMargin(potentialMargin)
                .averageDaysInStock(averageDaysInStock)
                .build();

        List<ProductGroupValuationResponse> groupValuations = calculateGroupBreakdown(valuedItems, totalValuation);

        sortValuedItems(valuedItems, sortBy, sortDir);

        return InventoryValuationReportResponse.builder()
                .summary(summary)
                .groupValuations(groupValuations)
                .items(valuedItems)
                .missingCostItems(missingCostItems)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportInventoryValuationExcel(
            String currentUsername,
            LocalDate asOfDate,
            String groupId,
            String search
    ) {
        User currentUser = getAuthenticatedUserWithHousehold(currentUsername);
        validateRolePermission(currentUser);
        BusinessHousehold household = currentUser.getHousehold();

        InventoryValuationReportResponse report = getInventoryValuationReport(
                currentUsername, asOfDate, groupId, search, "inventoryValue", "desc");

        if (report.getSummary() == null || report.getSummary().getTotalProducts() == 0) {
            throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
        }

        try {
            byte[] excelBytes = InventoryValuationExcelBuilder.buildExcelWorkbook(household, report, currentUser.getFullName());

            logExportActivity(household, currentUser, asOfDate, report.getSummary().getTotalInventoryValue());

            return excelBytes;
        } catch (Exception e) {
            log.error("Lỗi khi xuất tệp bảng tính giá trị tồn kho", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private void logExportActivity(BusinessHousehold household, User actor, LocalDate asOfDate, BigDecimal totalValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            Map<String, Object> logDetails = new HashMap<>();
            logDetails.put("asOfDate", asOfDate != null ? asOfDate.toString() : LocalDate.now().toString());
            logDetails.put("totalInventoryValue", totalValue);
            logDetails.put("exportedAt", LocalDateTime.now().toString());

            String detailsJson;
            try {
                detailsJson = objectMapper.writeValueAsString(logDetails);
            } catch (Exception e) {
                detailsJson = logDetails.toString();
            }

            activityLogHelper.logActivityInNewTransaction(
                    household, actor, "EXPORT_INVENTORY_VALUATION_REPORT",
                    "reports", null, null, detailsJson, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Lỗi khi ghi nhật ký hoạt động xuất báo cáo", e);
        }
    }

    private Map<String, BigDecimal> calculateStockQuantities(
            BusinessHousehold household, List<Product> products, LocalDate targetDate, boolean isHistorical) {
        Map<String, BigDecimal> stockMap = new HashMap<>();

        if (!isHistorical) {
            for (Product p : products) {
                BigDecimal qty = p.getStockQuantity() != null ? p.getStockQuantity() : BigDecimal.ZERO;
                stockMap.put(p.getId(), qty);
            }
            return stockMap;
        }

        LocalDateTime endDateTime = targetDate.atTime(LocalTime.MAX);
        String householdId = household.getId();

        Map<String, BigDecimal> inMap = toMap(goodsReceiptDetailRepository.sumQuantityBeforeGroupedByProduct(householdId, endDateTime));
        Map<String, BigDecimal> outMap = toMap(orderItemRepository.sumQuantityBeforeGroupedByProduct(householdId, endDateTime));
        Map<String, BigDecimal> returnMap = toMap(returnTicketItemRepository.sumQuantityBeforeGroupedByProduct(householdId, endDateTime));
        Map<String, BigDecimal> supplierReturnMap = toMap(supplierReturnItemRepository.sumQuantityBeforeGroupedByProduct(householdId, endDateTime));
        Map<String, BigDecimal> auditMap = toMap(inventoryAuditDetailRepository.sumDifferenceBeforeGroupedByProduct(householdId, endDateTime));

        for (Product p : products) {
            BigDecimal initial = BigDecimal.ZERO;
            if (p.getCreatedAt() != null && !p.getCreatedAt().isAfter(endDateTime)) {
                initial = p.getInitialStockQuantity() != null ? p.getInitialStockQuantity() : BigDecimal.ZERO;
            }

            BigDecimal inQty = inMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal outQty = outMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal returnQty = returnMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal supReturnQty = supplierReturnMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal auditDiff = auditMap.getOrDefault(p.getId(), BigDecimal.ZERO);

            BigDecimal stockAsOf = initial
                    .add(inQty)
                    .subtract(outQty)
                    .add(returnQty)
                    .subtract(supReturnQty)
                    .add(auditDiff)
                    .setScale(3, RoundingMode.HALF_UP);

            stockMap.put(p.getId(), stockAsOf);
        }

        return stockMap;
    }

    private Map<String, LocalDate> fetchLatestReceiptDates(
            BusinessHousehold household, LocalDate targetDate, boolean isHistorical) {
        List<Object[]> rawList;
        if (!isHistorical) {
            rawList = goodsReceiptDetailRepository.findLatestReceiptDatesByHousehold(household.getId());
        } else {
            rawList = goodsReceiptDetailRepository.findLatestReceiptDatesBefore(household.getId(), targetDate.atTime(LocalTime.MAX));
        }

        Map<String, LocalDate> map = new HashMap<>();
        if (rawList != null) {
            for (Object[] row : rawList) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    String pId = row[0].toString();
                    if (row[1] instanceof LocalDateTime) {
                        map.put(pId, ((LocalDateTime) row[1]).toLocalDate());
                    } else if (row[1] instanceof Timestamp) {
                        map.put(pId, ((Timestamp) row[1]).toLocalDateTime().toLocalDate());
                    }
                }
            }
        }
        return map;
    }

    private Long calculateProductDaysInStock(Product product, LocalDate targetDate, LocalDate lastReceiptDate) {
        LocalDate refDate;
        if (lastReceiptDate != null) {
            refDate = lastReceiptDate;
        } else if (product.getCreatedAt() != null) {
            refDate = product.getCreatedAt().toLocalDate();
        } else {
            refDate = targetDate;
        }

        long days = ChronoUnit.DAYS.between(refDate, targetDate);
        return Math.max(0L, days);
    }

    private Long calculateWeightedAverageDays(List<InventoryValuationItemResponse> items, BigDecimal totalValuation) {
        if (items == null || items.isEmpty() || totalValuation == null || totalValuation.compareTo(BigDecimal.ZERO) <= 0) {
            return 0L;
        }

        BigDecimal totalWeightedDays = BigDecimal.ZERO;
        for (InventoryValuationItemResponse item : items) {
            if (item.getInventoryValue() != null && item.getDaysInStock() != null && item.getInventoryValue().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal itemWeight = item.getInventoryValue().multiply(BigDecimal.valueOf(item.getDaysInStock()));
                totalWeightedDays = totalWeightedDays.add(itemWeight);
            }
        }

        return totalWeightedDays.divide(totalValuation, 0, RoundingMode.HALF_UP).longValue();
    }

    private List<ProductGroupValuationResponse> calculateGroupBreakdown(
            List<InventoryValuationItemResponse> items, BigDecimal totalWarehouseValuation) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<InventoryValuationItemResponse>> groupMap = items.stream()
                .collect(Collectors.groupingBy(item -> item.getGroupId() != null ? item.getGroupId() : "UNGROUPED"));

        BigDecimal totalPositiveValuation = groupMap.values().stream()
                .map(grpItems -> grpItems.stream()
                        .map(InventoryValuationItemResponse::getInventoryValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .filter(val -> val.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal divisor = (totalPositiveValuation.compareTo(BigDecimal.ZERO) > 0)
                ? totalPositiveValuation
                : (totalWarehouseValuation != null && totalWarehouseValuation.compareTo(BigDecimal.ZERO) > 0 ? totalWarehouseValuation : null);

        List<ProductGroupValuationResponse> result = new ArrayList<>();

        for (Map.Entry<String, List<InventoryValuationItemResponse>> entry : groupMap.entrySet()) {
            List<InventoryValuationItemResponse> grpItems = entry.getValue();
            String grpName = grpItems.get(0).getGroupName();
            String grpId = "UNGROUPED".equals(entry.getKey()) ? null : entry.getKey();

            BigDecimal grpStock = grpItems.stream()
                    .map(InventoryValuationItemResponse::getStockQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal grpValuation = grpItems.stream()
                    .map(InventoryValuationItemResponse::getInventoryValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal grpRetail = grpItems.stream()
                    .map(InventoryValuationItemResponse::getRetailValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal percentage = BigDecimal.ZERO;
            if (grpValuation.compareTo(BigDecimal.ZERO) > 0 && divisor != null) {
                percentage = grpValuation.multiply(BigDecimal.valueOf(100))
                        .divide(divisor, 2, RoundingMode.HALF_UP);
            }

            Long avgDays = calculateWeightedAverageDays(grpItems, grpValuation);

            result.add(ProductGroupValuationResponse.builder()
                    .groupId(grpId)
                    .groupName(grpName)
                    .productCount(grpItems.size())
                    .totalStockQuantity(grpStock)
                    .totalInventoryValue(grpValuation)
                    .totalRetailValue(grpRetail)
                    .valuePercentage(percentage)
                    .averageDaysInStock(avgDays)
                    .build());
        }

        result.sort(Comparator.comparing(ProductGroupValuationResponse::getTotalInventoryValue).reversed());
        return result;
    }

    private void sortValuedItems(List<InventoryValuationItemResponse> items, String sortBy, String sortDir) {
        if (items == null || items.isEmpty()) {
            return;
        }

        boolean asc = "asc".equalsIgnoreCase(sortDir);
        Comparator<InventoryValuationItemResponse> comparator;

        switch (sortBy != null ? sortBy.toLowerCase() : "inventoryvalue") {
            case "stockquantity":
                comparator = Comparator.comparing(InventoryValuationItemResponse::getStockQuantity, Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "costprice":
                comparator = Comparator.comparing(InventoryValuationItemResponse::getCostPrice, Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "daysinstock":
                comparator = Comparator.comparing(InventoryValuationItemResponse::getDaysInStock, Comparator.nullsLast(Long::compareTo));
                break;
            case "productname":
                comparator = Comparator.comparing(InventoryValuationItemResponse::getProductName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "inventoryvalue":
            default:
                comparator = Comparator.comparing(InventoryValuationItemResponse::getInventoryValue, Comparator.nullsLast(BigDecimal::compareTo));
                break;
        }

        if (!asc) {
            comparator = comparator.reversed();
        }
        items.sort(comparator);
    }

    private Map<String, BigDecimal> toMap(List<Object[]> rawList) {
        Map<String, BigDecimal> map = new HashMap<>();
        if (rawList != null) {
            for (Object[] row : rawList) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    String pId = row[0].toString();
                    BigDecimal qty = (row[1] instanceof BigDecimal bd)
                            ? bd
                            : new BigDecimal(row[1].toString());
                    map.put(pId, qty);
                }
            }
        }
        return map;
    }
}
