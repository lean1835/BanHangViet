package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateGoodsReceiptDetailRequest;
import com.viet.sales.dto.request.CreateGoodsReceiptRequest;
import com.viet.sales.dto.response.GoodsReceiptDetailInfoResponse;
import com.viet.sales.dto.response.GoodsReceiptDetailResponse;
import com.viet.sales.dto.response.GoodsReceiptResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.GoodsReceiptService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    private final UserRepository userRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final ProductRepository productRepository;
    private final ActivityLogRepository activityLogRepository;
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
                    .targetTable("goods_receipts")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log for goods receipt", e);
        }
    }

    private Map<String, Object> buildReceiptLogMap(GoodsReceipt receipt, List<GoodsReceiptDetail> details) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", receipt.getId());
        map.put("receiptNumber", receipt.getReceiptNumber());
        map.put("receivedAt", receipt.getReceivedAt());
        map.put("notes", receipt.getNotes());
        map.put("householdId", receipt.getHousehold() != null ? receipt.getHousehold().getId() : null);
        map.put("createdByUserId", receipt.getCreatedByUser() != null ? receipt.getCreatedByUser().getId() : null);

        List<Map<String, Object>> detailsMap = details.stream().map(d -> {
            Map<String, Object> dMap = new HashMap<>();
            dMap.put("productId", d.getProduct().getId());
            dMap.put("quantity", d.getQuantity());
            dMap.put("purchasePrice", d.getPurchasePrice());
            return dMap;
        }).collect(Collectors.toList());

        map.put("details", detailsMap);
        return map;
    }

    private GoodsReceiptResponse mapToResponse(GoodsReceipt receipt) {
        return GoodsReceiptResponse.builder()
                .id(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
                .receivedAt(receipt.getReceivedAt())
                .notes(receipt.getNotes())
                .createdByUserId(receipt.getCreatedByUser().getId())
                .createdByUserName(receipt.getCreatedByUser().getFullName())
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .build();
    }

    private GoodsReceiptDetailResponse mapDetailToResponse(GoodsReceiptDetail detail) {
        return GoodsReceiptDetailResponse.builder()
                .id(detail.getId())
                .productId(detail.getProduct().getId())
                .productName(detail.getProduct().getName())
                .productSku(detail.getProduct().getSku())
                .quantity(detail.getQuantity())
                .purchasePrice(detail.getPurchasePrice())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @PreAuthorize("hasRole('VT-01')")
    public GoodsReceiptResponse createGoodsReceipt(String currentUsername, CreateGoodsReceiptRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Validate details
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_RECEIPT_DETAILS);
        }

        // Generate receipt number if not provided
        String receiptNumber = request.getReceiptNumber();
        if (!StringUtils.hasText(receiptNumber)) {
            receiptNumber = "NK-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        } else {
            // Check global duplicate receipt number
            if (goodsReceiptRepository.existsByReceiptNumber(receiptNumber)) {
                throw new AppException(ErrorCode.RECEIPT_NUMBER_EXISTS);
            }
        }

        LocalDateTime receivedAt = request.getReceivedAt() != null ? request.getReceivedAt() : LocalDateTime.now();

        GoodsReceipt receipt = GoodsReceipt.builder()
                .household(household)
                .createdByUser(currentUser)
                .receiptNumber(receiptNumber)
                .receivedAt(receivedAt)
                .notes(request.getNotes())
                .build();

        receipt = goodsReceiptRepository.save(receipt);

        List<GoodsReceiptDetail> savedDetails = new ArrayList<>();
        for (CreateGoodsReceiptDetailRequest detailRequest : request.getDetails()) {
            // Verify product belongs to household and is not deleted
            Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(detailRequest.getProductId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

            GoodsReceiptDetail detail = GoodsReceiptDetail.builder()
                    .receipt(receipt)
                    .product(product)
                    .quantity(detailRequest.getQuantity())
                    .purchasePrice(detailRequest.getPurchasePrice())
                    .build();

            detail = goodsReceiptDetailRepository.save(detail);
            savedDetails.add(detail);

            // Update product stock quantity
            product.setStockQuantity(product.getStockQuantity().add(detailRequest.getQuantity()));
            productRepository.save(product);
        }

        logActivity(household, currentUser, "CREATE_GOODS_RECEIPT", receipt.getId(), null, buildReceiptLogMap(receipt, savedDetails));

        return mapToResponse(receipt);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('VT-01')")
    public PageResponse<GoodsReceiptResponse> getGoodsReceipts(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

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
    @PreAuthorize("hasRole('VT-01')")
    public GoodsReceiptDetailInfoResponse getGoodsReceiptById(String currentUsername, String id) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        GoodsReceipt receipt = goodsReceiptRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOODS_RECEIPT_NOT_FOUND));

        List<GoodsReceiptDetail> details = goodsReceiptDetailRepository.findByReceiptId(id);
        List<GoodsReceiptDetailResponse> detailResponses = details.stream()
                .map(this::mapDetailToResponse)
                .collect(Collectors.toList());

        return GoodsReceiptDetailInfoResponse.builder()
                .id(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
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
