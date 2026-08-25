package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PosTransferStatus;
import com.sales.dto.request.CancelPosTransferRequest;
import com.sales.dto.request.CreatePosTransferRequest;
import com.sales.dto.request.PosTransferItemRequest;
import com.sales.dto.response.PosTransferItemResponse;
import com.sales.dto.response.PosTransferResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.PosTransferService;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PosTransferServiceImpl implements PosTransferService {

    private final PosTransferRepository posTransferRepository;
    private final PosTransferItemRepository posTransferItemRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final PosInventoryRepository posInventoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
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
        PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));
        if (Boolean.FALSE.equals(pos.getIsActive())) {
            throw new AppException(ErrorCode.POS_NOT_FOUND);
        }
        return pos;
    }

    private String generateTransferNumber(String householdId) {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "CK-" + dateStr;
        long count = posTransferRepository.countByHouseholdIdAndTransferNumberStartingWith(householdId, prefix) + 1;

        String transferNumber;
        do {
            transferNumber = String.format("CK-%s-%04d", dateStr, count++);
        } while (posTransferRepository.existsByTransferNumber(transferNumber));

        return transferNumber;
    }

    private PosTransferItemResponse mapToItemResponse(PosTransferItem item) {
        return PosTransferItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productSku(item.getProductSku())
                .productName(item.getProductName())
                .unit(item.getUnit())
                .quantity(item.getQuantity())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private PosTransferResponse mapToSummaryResponse(PosTransfer transfer) {
        return PosTransferResponse.builder()
                .id(transfer.getId())
                .transferNumber(transfer.getTransferNumber())
                .fromPointOfSaleId(transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getId() : null)
                .fromPointOfSaleName(transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getName() : null)
                .fromPosCode(transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getPosCode() : null)
                .toPointOfSaleId(transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getId() : null)
                .toPointOfSaleName(transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getName() : null)
                .toPosCode(transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getPosCode() : null)
                .createdByUserId(transfer.getCreatedByUser() != null ? transfer.getCreatedByUser().getId() : null)
                .createdByFullName(transfer.getCreatedByUser() != null ? transfer.getCreatedByUser().getFullName() : null)
                .receivedByUserId(transfer.getReceivedByUser() != null ? transfer.getReceivedByUser().getId() : null)
                .receivedByFullName(transfer.getReceivedByUser() != null ? transfer.getReceivedByUser().getFullName() : null)
                .canceledByUserId(transfer.getCanceledByUser() != null ? transfer.getCanceledByUser().getId() : null)
                .canceledByFullName(transfer.getCanceledByUser() != null ? transfer.getCanceledByUser().getFullName() : null)
                .status(transfer.getStatus())
                .totalItems(transfer.getTotalItems())
                .totalQuantity(transfer.getTotalQuantity())
                .notes(transfer.getNotes())
                .cancelReason(transfer.getCancelReason())
                .transferredAt(transfer.getTransferredAt())
                .receivedAt(transfer.getReceivedAt())
                .canceledAt(transfer.getCanceledAt())
                .createdAt(transfer.getCreatedAt())
                .updatedAt(transfer.getUpdatedAt())
                .items(null)
                .build();
    }

    private PosTransferResponse mapToResponse(PosTransfer transfer) {
        List<PosTransferItemResponse> itemResponses = transfer.getItems() != null
                ? transfer.getItems().stream().map(this::mapToItemResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return PosTransferResponse.builder()
                .id(transfer.getId())
                .transferNumber(transfer.getTransferNumber())
                .fromPointOfSaleId(transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getId() : null)
                .fromPointOfSaleName(transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getName() : null)
                .fromPosCode(transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getPosCode() : null)
                .toPointOfSaleId(transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getId() : null)
                .toPointOfSaleName(transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getName() : null)
                .toPosCode(transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getPosCode() : null)
                .createdByUserId(transfer.getCreatedByUser() != null ? transfer.getCreatedByUser().getId() : null)
                .createdByFullName(transfer.getCreatedByUser() != null ? transfer.getCreatedByUser().getFullName() : null)
                .receivedByUserId(transfer.getReceivedByUser() != null ? transfer.getReceivedByUser().getId() : null)
                .receivedByFullName(transfer.getReceivedByUser() != null ? transfer.getReceivedByUser().getFullName() : null)
                .canceledByUserId(transfer.getCanceledByUser() != null ? transfer.getCanceledByUser().getId() : null)
                .canceledByFullName(transfer.getCanceledByUser() != null ? transfer.getCanceledByUser().getFullName() : null)
                .status(transfer.getStatus())
                .totalItems(transfer.getTotalItems())
                .totalQuantity(transfer.getTotalQuantity())
                .notes(transfer.getNotes())
                .cancelReason(transfer.getCancelReason())
                .transferredAt(transfer.getTransferredAt())
                .receivedAt(transfer.getReceivedAt())
                .canceledAt(transfer.getCanceledAt())
                .createdAt(transfer.getCreatedAt())
                .updatedAt(transfer.getUpdatedAt())
                .items(itemResponses)
                .build();
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
                    household, actor, action, "pos_transfers", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho phiếu chuyển hàng", e);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PosTransferResponse createTransfer(String currentUsername, CreatePosTransferRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        if (request.getFromPointOfSaleId().equals(request.getToPointOfSaleId())) {
            throw new AppException(ErrorCode.TRANSFER_SAME_POS);
        }

        PointOfSale fromPos = getValidPointOfSale(request.getFromPointOfSaleId(), household.getId());
        PointOfSale toPos = getValidPointOfSale(request.getToPointOfSaleId(), household.getId());

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(ErrorCode.TRANSFER_ITEMS_EMPTY);
        }

        // Gom các sản phẩm và kiểm tra trùng lặp
        Map<String, BigDecimal> productQuantityMap = new LinkedHashMap<>();
        for (PosTransferItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.TRANSFER_QUANTITY_INVALID);
            }
            productQuantityMap.merge(itemReq.getProductId(), itemReq.getQuantity(), BigDecimal::add);
        }

        List<String> productIds = new ArrayList<>(productQuantityMap.keySet());
        List<Product> products = productRepository.findAllById(productIds);
        Map<String, Product> productMap = products.stream()
                .filter(p -> p.getHousehold() != null && p.getHousehold().getId().equals(household.getId()) && p.getDeletedAt() == null)
                .collect(Collectors.toMap(Product::getId, p -> p));

        if (productMap.size() != productIds.size()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        // Lấy tồn kho của điểm gửi
        List<PosInventory> fromInventories = posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                household.getId(), fromPos.getId(), productIds);
        Map<String, PosInventory> fromInventoryMap = fromInventories.stream()
                .collect(Collectors.toMap(inv -> inv.getProduct().getId(), inv -> inv));

        // Kiểm tra số lượng tồn kho từng sản phẩm tại điểm gửi
        for (Map.Entry<String, BigDecimal> entry : productQuantityMap.entrySet()) {
            String productId = entry.getKey();
            BigDecimal transferQty = entry.getValue();
            PosInventory posInv = fromInventoryMap.get(productId);

            if (posInv == null || posInv.getStockQuantity() == null || posInv.getStockQuantity().compareTo(transferQty) < 0) {
                log.warn("Sản phẩm {} tại điểm gửi {} không đủ tồn kho (cần: {}, hiện có: {})",
                        productId, fromPos.getName(), transferQty, posInv != null ? posInv.getStockQuantity() : 0);
                throw new AppException(ErrorCode.TRANSFER_EXCEED_STOCK);
            }
        }

        String transferNumber = generateTransferNumber(household.getId());

        PosTransfer transfer = PosTransfer.builder()
                .household(household)
                .transferNumber(transferNumber)
                .fromPointOfSale(fromPos)
                .toPointOfSale(toPos)
                .createdByUser(currentUser)
                .status(PosTransferStatus.IN_TRANSIT)
                .notes(request.getNotes())
                .transferredAt(LocalDateTime.now())
                .totalItems(productQuantityMap.size())
                .totalQuantity(BigDecimal.ZERO)
                .build();

        BigDecimal totalQuantity = BigDecimal.ZERO;
        List<PosTransferItem> transferItems = new ArrayList<>();

        for (Map.Entry<String, BigDecimal> entry : productQuantityMap.entrySet()) {
            String productId = entry.getKey();
            BigDecimal transferQty = entry.getValue();
            Product product = productMap.get(productId);

            // Trừ tồn kho tại điểm gửi
            PosInventory fromInv = fromInventoryMap.get(productId);
            fromInv.setStockQuantity(fromInv.getStockQuantity().subtract(transferQty));

            PosTransferItem item = PosTransferItem.builder()
                    .transfer(transfer)
                    .product(product)
                    .productSku(product.getSku())
                    .productName(product.getName())
                    .unit(product.getUnit())
                    .quantity(transferQty)
                    .build();

            transferItems.add(item);
            totalQuantity = totalQuantity.add(transferQty);
        }

        posInventoryRepository.saveAll(fromInventories);

        transfer.setTotalQuantity(totalQuantity);
        transfer.setItems(transferItems);
        PosTransfer savedTransfer = posTransferRepository.save(transfer);

        Map<String, Object> logData = new HashMap<>();
        logData.put("transferNumber", savedTransfer.getTransferNumber());
        logData.put("fromPos", fromPos.getName());
        logData.put("toPos", toPos.getName());
        logData.put("totalItems", savedTransfer.getTotalItems());
        logData.put("totalQuantity", savedTransfer.getTotalQuantity());

        logActivity(household, currentUser, "CREATE_POS_TRANSFER", savedTransfer.getId(), null, logData);

        log.info("Lập phiếu chuyển hàng {} thành công từ điểm {} sang điểm {}",
                savedTransfer.getTransferNumber(), fromPos.getName(), toPos.getName());

        return mapToResponse(savedTransfer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PosTransferResponse> getTransfers(
            String currentUsername,
            String fromPosId,
            String toPosId,
            PosTransferStatus status,
            String keyword,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable) {

        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        Specification<PosTransfer> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("household").get("id"), household.getId()));

            // Nếu là nhân viên bán hàng (VT-02), chỉ cho phép xem các phiếu liên quan đến điểm bán của mình
            if (currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode())) {
                if (currentUser.getPointOfSale() != null) {
                    String userPosId = currentUser.getPointOfSale().getId();
                    predicates.add(cb.or(
                            cb.equal(root.get("fromPointOfSale").get("id"), userPosId),
                            cb.equal(root.get("toPointOfSale").get("id"), userPosId)
                    ));
                } else {
                    predicates.add(cb.disjunction());
                }
            }

            if (StringUtils.hasText(fromPosId)) {
                predicates.add(cb.equal(root.get("fromPointOfSale").get("id"), fromPosId));
            }

            if (StringUtils.hasText(toPosId)) {
                predicates.add(cb.equal(root.get("toPointOfSale").get("id"), toPosId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate numberLike = cb.like(cb.lower(root.get("transferNumber")), pattern);
                Predicate notesLike = cb.like(cb.lower(root.get("notes")), pattern);
                predicates.add(cb.or(numberLike, notesLike));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transferredAt"), fromDate.atStartOfDay()));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transferredAt"), toDate.atTime(LocalTime.MAX)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return posTransferRepository.findAll(spec, pageable).map(this::mapToSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PosTransferResponse getTransferById(String currentUsername, String transferId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PosTransfer transfer = posTransferRepository.findWithDetailsByIdAndHouseholdId(transferId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TRANSFER_NOT_FOUND));

        // Kiểm tra quyền của nhân viên bán hàng
        if (currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode())) {
            if (currentUser.getPointOfSale() == null) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            String userPosId = currentUser.getPointOfSale().getId();
            String fromPosId = transfer.getFromPointOfSale() != null ? transfer.getFromPointOfSale().getId() : "";
            String toPosId = transfer.getToPointOfSale() != null ? transfer.getToPointOfSale().getId() : "";
            if (!userPosId.equals(fromPosId) && !userPosId.equals(toPosId)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        return mapToResponse(transfer);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PosTransferResponse receiveTransfer(String currentUsername, String transferId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkViewPermission(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        PosTransfer transfer = posTransferRepository.findWithDetailsByIdAndHouseholdId(transferId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TRANSFER_NOT_FOUND));

        if (transfer.getStatus() != PosTransferStatus.IN_TRANSIT) {
            throw new AppException(ErrorCode.TRANSFER_INVALID_STATUS);
        }

        // Kiểm tra phân quyền xác nhận nhận hàng:
        // Chủ hộ (VT-01) hoặc Kế toán (VT-03) có quyền xác nhận bất kỳ điểm nào.
        // Nhân viên bán hàng (VT-02) chỉ có quyền xác nhận nếu điểm nhận là điểm bán mà nhân viên được gán.
        if (currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode())) {
            if (currentUser.getPointOfSale() == null
                    || transfer.getToPointOfSale() == null
                    || !currentUser.getPointOfSale().getId().equals(transfer.getToPointOfSale().getId())) {
                throw new AppException(ErrorCode.TRANSFER_RECEIVER_PERMISSION_DENIED);
            }
        }

        PointOfSale toPos = transfer.getToPointOfSale();
        List<PosTransferItem> items = transfer.getItems();

        List<String> productIds = items.stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList());

        List<PosInventory> toInventories = posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                household.getId(), toPos.getId(), productIds);
        Map<String, PosInventory> toInventoryMap = toInventories.stream()
                .collect(Collectors.toMap(inv -> inv.getProduct().getId(), inv -> inv));

        List<PosInventory> toSaveInventories = new ArrayList<>();

        for (PosTransferItem item : items) {
            Product product = item.getProduct();
            PosInventory posInv = toInventoryMap.get(product.getId());

            if (posInv == null) {
                // Tự động khởi tạo tồn kho tại điểm nhận nếu chưa từng có
                posInv = PosInventory.builder()
                        .household(household)
                        .pointOfSale(toPos)
                        .product(product)
                        .stockQuantity(item.getQuantity())
                        .minStockQuantity(BigDecimal.ZERO)
                        .build();
            } else {
                BigDecimal currentStock = posInv.getStockQuantity() != null ? posInv.getStockQuantity() : BigDecimal.ZERO;
                posInv.setStockQuantity(currentStock.add(item.getQuantity()));
            }

            toSaveInventories.add(posInv);
        }

        posInventoryRepository.saveAll(toSaveInventories);

        transfer.setStatus(PosTransferStatus.COMPLETED);
        transfer.setReceivedByUser(currentUser);
        transfer.setReceivedAt(LocalDateTime.now());

        PosTransfer savedTransfer = posTransferRepository.save(transfer);

        Map<String, Object> logData = new HashMap<>();
        logData.put("transferNumber", savedTransfer.getTransferNumber());
        logData.put("receivedBy", currentUser.getFullName());
        logData.put("receivedAt", savedTransfer.getReceivedAt());

        logActivity(household, currentUser, "RECEIVE_POS_TRANSFER", savedTransfer.getId(), null, logData);

        log.info("Xác nhận nhận hàng cho phiếu chuyển {} thành công bởi {}",
                savedTransfer.getTransferNumber(), currentUser.getUsername());

        return mapToResponse(savedTransfer);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PosTransferResponse cancelTransfer(String currentUsername, String transferId, CancelPosTransferRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        checkOwnerRole(currentUser);
        BusinessHousehold household = getValidHousehold(currentUser);

        if (!StringUtils.hasText(request.getCancelReason())) {
            throw new AppException(ErrorCode.TRANSFER_CANCEL_REASON_REQUIRED);
        }

        PosTransfer transfer = posTransferRepository.findWithDetailsByIdAndHouseholdId(transferId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TRANSFER_NOT_FOUND));

        if (transfer.getStatus() != PosTransferStatus.IN_TRANSIT) {
            throw new AppException(ErrorCode.TRANSFER_INVALID_STATUS);
        }

        PointOfSale fromPos = transfer.getFromPointOfSale();
        List<PosTransferItem> items = transfer.getItems();

        List<String> productIds = items.stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList());

        List<PosInventory> fromInventories = posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                household.getId(), fromPos.getId(), productIds);
        Map<String, PosInventory> fromInventoryMap = fromInventories.stream()
                .collect(Collectors.toMap(inv -> inv.getProduct().getId(), inv -> inv));

        // Hoàn trả lại số lượng đã trừ về điểm gửi
        for (PosTransferItem item : items) {
            PosInventory fromInv = fromInventoryMap.get(item.getProduct().getId());
            if (fromInv != null) {
                BigDecimal currentStock = fromInv.getStockQuantity() != null ? fromInv.getStockQuantity() : BigDecimal.ZERO;
                fromInv.setStockQuantity(currentStock.add(item.getQuantity()));
            }
        }

        posInventoryRepository.saveAll(fromInventories);

        transfer.setStatus(PosTransferStatus.CANCELED);
        transfer.setCanceledByUser(currentUser);
        transfer.setCancelReason(request.getCancelReason().trim());
        transfer.setCanceledAt(LocalDateTime.now());

        PosTransfer savedTransfer = posTransferRepository.save(transfer);

        Map<String, Object> logData = new HashMap<>();
        logData.put("transferNumber", savedTransfer.getTransferNumber());
        logData.put("canceledBy", currentUser.getFullName());
        logData.put("cancelReason", savedTransfer.getCancelReason());
        logData.put("canceledAt", savedTransfer.getCanceledAt());

        logActivity(household, currentUser, "CANCEL_POS_TRANSFER", savedTransfer.getId(), null, logData);

        log.info("Hủy phiếu chuyển hàng {} thành công bởi {}",
                savedTransfer.getTransferNumber(), currentUser.getUsername());

        return mapToResponse(savedTransfer);
    }
}
