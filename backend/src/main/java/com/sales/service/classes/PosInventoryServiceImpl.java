package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.InitPosInventoryRequest;
import com.sales.dto.request.PosInventoryItemRequest;
import com.sales.dto.request.UpdatePosInventoryRequest;
import com.sales.dto.response.PosInventoryResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.PosInventory;
import com.sales.entity.Product;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.PosInventoryRepository;
import com.sales.repository.PosTransferItemRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.PosInventoryService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PosInventoryServiceImpl implements PosInventoryService {

    private final PosInventoryRepository posInventoryRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PosTransferItemRepository posTransferItemRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkOwnerRole(User user) {
        if (user.getRole() == null || !"VT-01".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void checkViewPermission(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        String roleCode = user.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-02".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private BusinessHousehold getValidHousehold(User user) {
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        return household;
    }

    private PointOfSale getValidPointOfSale(String posId, String householdId) {
        return pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));
    }

    private PosInventoryResponse mapToResponse(
            PosInventory inventory,
            Map<String, List<PosInventory>> allPosInvsByProduct,
            Map<String, BigDecimal> inTransitByProduct) {

        Product p = inventory.getProduct();
        PointOfSale pos = inventory.getPointOfSale();

        boolean isLowStock = false;
        if (inventory.getStockQuantity() != null && inventory.getMinStockQuantity() != null) {
            isLowStock = inventory.getStockQuantity().compareTo(inventory.getMinStockQuantity()) <= 0
                    || inventory.getStockQuantity().compareTo(BigDecimal.ZERO) <= 0;
        }

        BigDecimal totalProductStock = p != null && p.getStockQuantity() != null ? p.getStockQuantity() : BigDecimal.ZERO;
        String productId = p != null ? p.getId() : null;

        BigDecimal allPosSum = BigDecimal.ZERO;
        BigDecimal otherPosSum = BigDecimal.ZERO;
        BigDecimal inTransit = inTransitByProduct != null && productId != null
                ? inTransitByProduct.getOrDefault(productId, BigDecimal.ZERO)
                : BigDecimal.ZERO;

        if (productId != null && allPosInvsByProduct != null) {
            List<PosInventory> allPosInvs = allPosInvsByProduct.getOrDefault(productId, Collections.emptyList());
            for (PosInventory pi : allPosInvs) {
                BigDecimal qty = pi.getStockQuantity() != null ? pi.getStockQuantity() : BigDecimal.ZERO;
                allPosSum = allPosSum.add(qty);
                if (pos != null && pi.getPointOfSale() != null && !pos.getId().equals(pi.getPointOfSale().getId())) {
                    otherPosSum = otherPosSum.add(qty);
                }
            }
        }

        BigDecimal warehouseStock = totalProductStock.subtract(allPosSum).subtract(inTransit).max(BigDecimal.ZERO);
        BigDecimal maxAvailableQuantity = totalProductStock.subtract(otherPosSum).subtract(inTransit).max(BigDecimal.ZERO);

        return PosInventoryResponse.builder()
                .id(inventory.getId())
                .pointOfSaleId(pos != null ? pos.getId() : null)
                .pointOfSaleName(pos != null ? pos.getName() : null)
                .posCode(pos != null ? pos.getPosCode() : null)
                .productId(p != null ? p.getId() : null)
                .productSku(p != null ? p.getSku() : null)
                .productName(p != null ? p.getName() : null)
                .unit(p != null ? p.getUnit() : null)
                .price(p != null ? p.getPrice() : null)
                .stockQuantity(inventory.getStockQuantity())
                .minStockQuantity(inventory.getMinStockQuantity())
                .productStatus(p != null ? p.getStatus() : null)
                .groupName(p != null && p.getGroup() != null ? p.getGroup().getName() : null)
                .isLowStock(isLowStock)
                .totalProductStock(totalProductStock)
                .warehouseStock(warehouseStock)
                .maxAvailableQuantity(maxAvailableQuantity)
                .createdAt(inventory.getCreatedAt())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }

    private PosInventoryResponse mapToResponse(PosInventory inventory) {
        String householdId = inventory.getHousehold() != null ? inventory.getHousehold().getId() : null;
        String productId = inventory.getProduct() != null ? inventory.getProduct().getId() : null;

        Map<String, List<PosInventory>> allPosInvsByProduct = new HashMap<>();
        Map<String, BigDecimal> inTransitByProduct = new HashMap<>();

        if (householdId != null && productId != null) {
            List<PosInventory> allPosInvs = posInventoryRepository.findByHouseholdIdAndProductId(householdId, productId);
            allPosInvsByProduct.put(productId, allPosInvs);

            if (posTransferItemRepository != null) {
                BigDecimal transitSum = posTransferItemRepository.sumInTransitFromWarehouseByProductId(householdId, productId);
                if (transitSum != null) {
                    inTransitByProduct.put(productId, transitSum);
                }
            }
        }

        return mapToResponse(inventory, allPosInvsByProduct, inTransitByProduct);
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
                    household, actor, action, "pos_inventories", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho tồn kho điểm bán", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PosInventoryResponse> getInventoriesByPos(
            String currentUsername, String posId, String keyword, String groupId, Boolean lowStockOnly, Pageable pageable) {

        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        // Đảm bảo điểm bán thuộc hộ
        getValidPointOfSale(posId, household.getId());

        Specification<PosInventory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("household").get("id"), household.getId()));
            predicates.add(cb.equal(root.get("pointOfSale").get("id"), posId));
            predicates.add(cb.isNull(root.get("product").get("deletedAt")));

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("product").get("name")), pattern);
                Predicate skuLike = cb.like(cb.lower(root.get("product").get("sku")), pattern);
                predicates.add(cb.or(nameLike, skuLike));
            }

            if (StringUtils.hasText(groupId)) {
                predicates.add(cb.equal(root.get("product").get("group").get("id"), groupId));
            }

            if (Boolean.TRUE.equals(lowStockOnly)) {
                Predicate lowStock = cb.lessThanOrEqualTo(root.get("stockQuantity"), root.get("minStockQuantity"));
                Predicate zeroStock = cb.lessThanOrEqualTo(root.get("stockQuantity"), BigDecimal.ZERO);
                predicates.add(cb.or(lowStock, zeroStock));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PosInventory> posInventoryPage = posInventoryRepository.findAll(spec, pageable);
        List<PosInventory> content = posInventoryPage.getContent();

        List<String> productIds = content.stream()
                .filter(i -> i.getProduct() != null && i.getProduct().getId() != null)
                .map(i -> i.getProduct().getId())
                .distinct()
                .collect(Collectors.toList());

        Map<String, List<PosInventory>> allPosInvsByProduct = new HashMap<>();
        Map<String, BigDecimal> inTransitByProduct = new HashMap<>();

        if (!productIds.isEmpty()) {
            List<PosInventory> allPosInvs = posInventoryRepository.findByHouseholdIdAndProductIdIn(household.getId(), productIds);
            for (PosInventory pi : allPosInvs) {
                if (pi.getProduct() != null && pi.getProduct().getId() != null) {
                    allPosInvsByProduct.computeIfAbsent(pi.getProduct().getId(), k -> new ArrayList<>()).add(pi);
                }
            }

            if (posTransferItemRepository != null) {
                List<Object[]> inTransitList = posTransferItemRepository.sumInTransitFromWarehouseByProductIds(household.getId(), productIds);
                for (Object[] row : inTransitList) {
                    inTransitByProduct.put((String) row[0], (BigDecimal) row[1]);
                }
            }
        }

        return posInventoryPage.map(inv -> mapToResponse(inv, allPosInvsByProduct, inTransitByProduct));
    }

    @Override
    @Transactional(readOnly = true)
    public PosInventoryResponse getInventoryByPosAndProduct(String currentUsername, String posId, String productId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        getValidPointOfSale(posId, household.getId());

        PosInventory inventory = posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductId(
                household.getId(), posId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.POS_PRODUCT_NOT_INITIALIZED));

        return mapToResponse(inventory);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<PosInventoryResponse> initOrUpdatePosInventories(
            String currentUsername, String posId, InitPosInventoryRequest request) {

        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = getValidPointOfSale(posId, household.getId());
        List<PosInventoryResponse> responseList = new ArrayList<>();

        List<String> productIds = request.getItems().stream()
                .map(PosInventoryItemRequest::getProductId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        Map<String, Product> productMap = products.stream()
                .filter(p -> p.getHousehold() != null && p.getHousehold().getId().equals(household.getId()) && p.getDeletedAt() == null)
                .collect(Collectors.toMap(Product::getId, p -> p, (p1, p2) -> p1));

        List<PosInventory> existingInventories = posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                household.getId(), pos.getId(), productIds);
        Map<String, PosInventory> existingInvMap = existingInventories.stream()
                .collect(Collectors.toMap(inv -> inv.getProduct().getId(), inv -> inv, (i1, i2) -> i1));

        // Group other POS stocks
        List<PosInventory> otherPosInventories = posInventoryRepository.findByHouseholdIdAndProductIdInAndPointOfSaleIdNot(
                household.getId(), productIds, pos.getId());
        Map<String, BigDecimal> otherPosStockMap = new HashMap<>();
        for (PosInventory pi : otherPosInventories) {
            otherPosStockMap.merge(pi.getProduct().getId(), pi.getStockQuantity() != null ? pi.getStockQuantity() : BigDecimal.ZERO, BigDecimal::add);
        }

        Map<String, BigDecimal> inTransitMap = new HashMap<>();
        if (posTransferItemRepository != null) {
            List<Object[]> inTransitList = posTransferItemRepository.sumInTransitFromWarehouseByProductIds(household.getId(), productIds);
            if (inTransitList != null) {
                for (Object[] row : inTransitList) {
                    inTransitMap.put((String) row[0], (BigDecimal) row[1]);
                }
            }
        }

        List<PosInventory> toSaveList = new ArrayList<>();

        for (PosInventoryItemRequest itemReq : request.getItems()) {
            if (itemReq.getStockQuantity() == null || itemReq.getStockQuantity().compareTo(BigDecimal.ZERO) < 0) {
                throw new AppException(ErrorCode.INVALID_POS_INVENTORY_QTY);
            }

            Product product = productMap.get(itemReq.getProductId());
            if (product == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            BigDecimal totalProductStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
            BigDecimal otherPosStock = otherPosStockMap.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal inTransit = inTransitMap.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal maxAvailableForThisPos = totalProductStock.subtract(otherPosStock).subtract(inTransit).max(BigDecimal.ZERO);

            if (itemReq.getStockQuantity().compareTo(maxAvailableForThisPos) > 0) {
                log.warn("Khởi tạo tồn kho cho SP {} tại điểm {} vượt quá khả dụng (yêu cầu: {}, tối đa: {}, tổng: {}, CS khác: {})",
                        product.getName(), pos.getName(), itemReq.getStockQuantity(), maxAvailableForThisPos, totalProductStock, otherPosStock);
                throw new AppException(ErrorCode.POS_INVENTORY_EXCEED_PRODUCT_STOCK);
            }

            PosInventory posInv = existingInvMap.get(product.getId());
            if (posInv == null) {
                posInv = PosInventory.builder()
                        .household(household)
                        .pointOfSale(pos)
                        .product(product)
                        .stockQuantity(BigDecimal.ZERO)
                        .minStockQuantity(BigDecimal.ZERO)
                        .build();
            }

            Map<String, Object> oldValue = new HashMap<>();
            oldValue.put("posId", pos.getId());
            oldValue.put("productId", product.getId());
            oldValue.put("stockQuantity", posInv.getStockQuantity());
            oldValue.put("minStockQuantity", posInv.getMinStockQuantity());

            posInv.setStockQuantity(itemReq.getStockQuantity());
            if (itemReq.getMinStockQuantity() != null && itemReq.getMinStockQuantity().compareTo(BigDecimal.ZERO) >= 0) {
                posInv.setMinStockQuantity(itemReq.getMinStockQuantity());
            }

            toSaveList.add(posInv);
        }

        List<PosInventory> savedList = posInventoryRepository.saveAll(toSaveList);

        for (PosInventory saved : savedList) {
            Map<String, Object> newValue = new HashMap<>();
            newValue.put("posId", pos.getId());
            newValue.put("productId", saved.getProduct().getId());
            newValue.put("stockQuantity", saved.getStockQuantity());
            newValue.put("minStockQuantity", saved.getMinStockQuantity());

            logActivity(household, currentUser, "INIT_POS_INVENTORY", saved.getId(), null, newValue);
            responseList.add(mapToResponse(saved));
        }

        log.info("Khởi tạo/cập nhật tồn kho thành công cho {} sản phẩm tại điểm bán {} ({})",
                responseList.size(), pos.getName(), pos.getId());

        return responseList;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PosInventoryResponse updatePosInventory(
            String currentUsername, String posId, String productId, UpdatePosInventoryRequest request) {

        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PointOfSale pos = getValidPointOfSale(posId, household.getId());

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (request.getStockQuantity() == null || request.getStockQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.INVALID_POS_INVENTORY_QTY);
        }

        BigDecimal totalProductStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
        List<PosInventory> otherPosInvs = posInventoryRepository.findByHouseholdIdAndProductIdAndPointOfSaleIdNot(
                household.getId(), product.getId(), pos.getId());
        BigDecimal otherPosStock = otherPosInvs != null
                ? otherPosInvs.stream()
                        .map(pi -> pi.getStockQuantity() != null ? pi.getStockQuantity() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                : BigDecimal.ZERO;

        BigDecimal inTransit = BigDecimal.ZERO;
        if (posTransferItemRepository != null) {
            BigDecimal transitSum = posTransferItemRepository.sumInTransitFromWarehouseByProductId(household.getId(), product.getId());
            if (transitSum != null) {
                inTransit = transitSum;
            }
        }

        BigDecimal maxAvailableForThisPos = totalProductStock.subtract(otherPosStock).subtract(inTransit).max(BigDecimal.ZERO);

        if (request.getStockQuantity().compareTo(maxAvailableForThisPos) > 0) {
            log.warn("Cập nhật tồn kho cho SP {} tại điểm {} vượt quá khả dụng (yêu cầu: {}, tối đa: {}, tổng: {}, CS khác: {})",
                    product.getName(), pos.getName(), request.getStockQuantity(), maxAvailableForThisPos, totalProductStock, otherPosStock);
            throw new AppException(ErrorCode.POS_INVENTORY_EXCEED_PRODUCT_STOCK);
        }

        PosInventory posInv = posInventoryRepository.findByPointOfSaleIdAndProductId(pos.getId(), product.getId())
                .orElse(PosInventory.builder()
                        .household(household)
                        .pointOfSale(pos)
                        .product(product)
                        .stockQuantity(BigDecimal.ZERO)
                        .minStockQuantity(BigDecimal.ZERO)
                        .build());

        Map<String, Object> oldValue = new HashMap<>();
        oldValue.put("posId", pos.getId());
        oldValue.put("productId", product.getId());
        oldValue.put("stockQuantity", posInv.getStockQuantity());
        oldValue.put("minStockQuantity", posInv.getMinStockQuantity());

        posInv.setStockQuantity(request.getStockQuantity());
        if (request.getMinStockQuantity() != null) {
            posInv.setMinStockQuantity(request.getMinStockQuantity());
        }

        PosInventory saved = posInventoryRepository.save(posInv);

        Map<String, Object> newValue = new HashMap<>();
        newValue.put("posId", pos.getId());
        newValue.put("productId", product.getId());
        newValue.put("stockQuantity", saved.getStockQuantity());
        newValue.put("minStockQuantity", saved.getMinStockQuantity());

        logActivity(household, currentUser, "UPDATE_POS_INVENTORY", saved.getId(), oldValue, newValue);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PosInventoryResponse> getLowStockWarningsByPos(String currentUsername, String posId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        getValidPointOfSale(posId, household.getId());

        List<PosInventory> lowStockList = posInventoryRepository.findLowStockInventoriesByPos(household.getId(), posId);
        return lowStockList.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void checkAndDeductPosStock(String householdId, String posId, String productId, BigDecimal quantity) {
        if (posId == null || productId == null || quantity == null) {
            return;
        }
        Map<String, BigDecimal> map = new HashMap<>();
        map.put(productId, quantity);
        batchDeductPosStock(householdId, posId, map);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDeductPosStock(String householdId, String posId, Map<String, BigDecimal> productQuantities) {
        if (posId == null || productQuantities == null || productQuantities.isEmpty()) {
            return;
        }

        List<PosInventory> posInventories = posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                householdId, posId, productQuantities.keySet());

        Map<String, PosInventory> posInvMap = posInventories.stream()
                .collect(Collectors.toMap(inv -> inv.getProduct().getId(), inv -> inv, (i1, i2) -> i1));

        for (Map.Entry<String, BigDecimal> entry : productQuantities.entrySet()) {
            String productId = entry.getKey();
            BigDecimal quantity = entry.getValue();

            PosInventory posInv = posInvMap.get(productId);
            if (posInv == null) {
                throw new AppException(ErrorCode.POS_PRODUCT_NOT_INITIALIZED);
            }

            BigDecimal currentStock = posInv.getStockQuantity() != null ? posInv.getStockQuantity() : BigDecimal.ZERO;
            posInv.setStockQuantity(currentStock.subtract(quantity));
        }

        posInventoryRepository.saveAll(posInventories);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void restorePosStock(String householdId, String posId, String productId, BigDecimal quantity) {
        if (posId == null) {
            return;
        }

        posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductId(householdId, posId, productId)
                .ifPresent(posInv -> {
                    BigDecimal currentStock = posInv.getStockQuantity() != null ? posInv.getStockQuantity() : BigDecimal.ZERO;
                    posInv.setStockQuantity(currentStock.add(quantity));
                    posInventoryRepository.save(posInv);
                });
    }
}
