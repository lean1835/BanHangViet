package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.InventoryValuationReportService;
import com.sales.utils.InventoryValuationExcelBuilder;
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
        // QTN-10 & TC-03: Chỉ chủ hộ (VT-01) hoặc kế toán (VT-03) được phép truy cập
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

        // Kiểm tra hợp lệ ngày chốt
        if (asOfDate != null && asOfDate.isAfter(LocalDate.now())) {
            throw new AppException(ErrorCode.FUTURE_DATE_NOT_ALLOWED);
        }

        LocalDate targetDate = asOfDate != null ? asOfDate : LocalDate.now();
        boolean isHistorical = targetDate.isBefore(LocalDate.now());

        log.info("Lập báo cáo giá trị tồn kho theo giá vốn cho hộ {}, asOfDate={}, isHistorical={}",
                household.getName(), targetDate, isHistorical);

        // 1. Lấy danh sách sản phẩm còn hoạt động của hộ kinh doanh (lọc trực tiếp dưới Database theo groupId và search)
        String cleanGroupId = StringUtils.hasText(groupId) ? groupId.trim() : null;
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;
        List<Product> products = productRepository.findProductsForValuationReport(household.getId(), cleanGroupId, cleanSearch);

        // 2. Tính số lượng tồn kho cho từng sản phẩm (thời gian thực hoặc tái dựng lịch sử)
        Map<String, BigDecimal> stockMap = calculateStockQuantities(household, products, targetDate, isHistorical);

        // 3. Lấy thời điểm nhập hàng gần nhất của từng sản phẩm để tính số ngày tồn kho
        Map<String, LocalDate> lastReceiptDateMap = fetchLatestReceiptDates(household, targetDate, isHistorical);

        // 4. Phân loại sản phẩm: Đã có giá vốn vs Chưa có giá vốn (TC-02)
        List<InventoryValuationItemResponse> valuedItems = new ArrayList<>();
        List<MissingCostProductResponse> missingCostItems = new ArrayList<>();

        for (Product p : products) {
            BigDecimal stock = stockMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal costPrice = p.getCostPrice();

            String pGroupId = p.getGroup() != null ? p.getGroup().getId() : null;
            String pGroupName = p.getGroup() != null ? p.getGroup().getName() : "Chưa phân nhóm";

            // TC-02: Nếu chưa có giá vốn hoặc giá vốn <= 0 -> đưa vào danh sách cảnh báo riêng
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
                BigDecimal inventoryValue = stock.multiply(costPrice).setScale(2, RoundingMode.HALF_UP);
                BigDecimal retailPrice = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
                BigDecimal retailValue = stock.multiply(retailPrice).setScale(2, RoundingMode.HALF_UP);

                LocalDate lastReceipt = lastReceiptDateMap.get(p.getId());
                Long daysInStock = calculateProductDaysInStock(p, targetDate, lastReceipt);

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
                        .build());
            }
        }

        // 5. Tổng hợp chỉ số toàn kho (Summary)
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

        // 6. Tổng hợp cơ cấu theo nhóm hàng (Group Breakdown)
        List<ProductGroupValuationResponse> groupValuations = calculateGroupBreakdown(valuedItems, totalValuation);

        // 7. Sắp xếp danh sách mặt hàng có giá vốn (Mặc định inventoryValue DESC)
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

        // Lấy dữ liệu báo cáo
        InventoryValuationReportResponse report = getInventoryValuationReport(
                currentUsername, asOfDate, groupId, search, "inventoryValue", "desc");

        // Kiểm tra nếu không có sản phẩm nào
        if (report.getSummary() == null || report.getSummary().getTotalProducts() == 0) {
            throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
        }

        try {
            byte[] excelBytes = InventoryValuationExcelBuilder.buildExcelWorkbook(household, report, currentUser.getFullName());

            // Ghi nhận nhật ký kiểm toán (ActivityLog)
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
            // Thời gian thực: Lấy trực tiếp từ product.stockQuantity
            for (Product p : products) {
                BigDecimal qty = p.getStockQuantity() != null ? p.getStockQuantity() : BigDecimal.ZERO;
                stockMap.put(p.getId(), qty);
            }
            return stockMap;
        }

        // Tái dựng số dư tồn kho lịch sử tại cuối ngày targetDate (23:59:59)
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
                    } else if (row[1] instanceof java.sql.Timestamp) {
                        map.put(pId, ((java.sql.Timestamp) row[1]).toLocalDateTime().toLocalDate());
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
            if (totalWarehouseValuation != null && totalWarehouseValuation.compareTo(BigDecimal.ZERO) > 0) {
                percentage = grpValuation.multiply(BigDecimal.valueOf(100))
                        .divide(totalWarehouseValuation, 2, RoundingMode.HALF_UP);
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

        // Sắp xếp nhóm hàng theo giá trị vốn giảm dần
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
