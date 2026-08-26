package com.sales.service.classes;

import com.sales.constant.ShiftStatus;
import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.response.BarcodeScanResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.OrderItemRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.PosInventoryRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.BarcodeService;
import com.sales.service.interfaces.OrderService;
import com.sales.service.interfaces.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeServiceImpl implements BarcodeService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PromotionService promotionService;
    private final OrderService orderService;
    private final PosInventoryRepository posInventoryRepository;

    private void checkOrderOwnership(Order order, User currentUser) {
        boolean isSalesperson = currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode());
        if (isSalesperson) {
            if (currentUser.getPointOfSale() != null && order.getPointOfSale() != null
                    && !currentUser.getPointOfSale().getId().equals(order.getPointOfSale().getId())) {
                throw new AppException(ErrorCode.POS_EMPLOYEE_ACCESS_DENIED);
            }
            if (order.getCreatedByUser() != null && !order.getCreatedByUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }
    }

    private void validateShiftIsOpen(Order order) {
        if (order.getShift() != null && order.getShift().getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_CLOSED);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BarcodeScanResponse scanBarcode(String currentUsername, BarcodeScanRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String householdId = user.getHousehold().getId();
        String scannedCode = request.getBarcode() != null ? request.getBarcode().trim() : "";

        // 1. Tra cứu sản phẩm theo mã vạch (barcode) hoặc SKU trong Hộ kinh doanh
        Optional<Product> productOpt = productRepository.findByHouseholdIdAndBarcodeOrSku(householdId, scannedCode);

        // 2. Trường hợp không tìm thấy sản phẩm (NCL-16-CN-001-TC-02)
        if (productOpt.isEmpty()) {
            log.info("Barcode scan failed: code '{}' not found in household '{}'", scannedCode, householdId);
            return BarcodeScanResponse.builder()
                    .found(false)
                    .barcode(scannedCode)
                    .suggestedBarcode(scannedCode)
                    .message("Mã vạch '" + scannedCode + "' chưa được gán cho mặt hàng nào trong hệ thống")
                    .build();
        }

        Product product = productOpt.get();
        BigDecimal scanQty = (request.getQuantity() != null && request.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                ? request.getQuantity() : BigDecimal.ONE;

        // 3. Tính toán khuyến mại tự động áp dụng cho mặt hàng
        PromotionItemResultResponse promoResult = promotionService.calculateItemPromotion(
                user, product, scanQty, product.getPrice(), false
        );

        OrderResponse updatedOrderResponse = null;

        // 4. Nếu có truyền orderId -> Thêm hoặc cộng dồn số lượng vào đơn bán hàng đang tạo (NCL-16-CN-001-TC-03)
        if (request.getOrderId() != null && !request.getOrderId().trim().isEmpty()) {
            Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getOrderId().trim(), householdId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            // [P1-02 Fix] Kiểm tra quyền sở hữu đơn hàng và trạng thái ca làm việc
            checkOrderOwnership(order, user);
            validateShiftIsOpen(order);

            // [P2-02 Fix] Kiểm tra sản phẩm đã khai báo tồn tại điểm bán chưa
            if (order.getPointOfSale() != null) {
                if (!posInventoryRepository.existsByPointOfSaleIdAndProductId(order.getPointOfSale().getId(), product.getId())) {
                    throw new AppException(ErrorCode.POS_PRODUCT_NOT_INITIALIZED);
                }
            }

            if (!"CREATING".equals(order.getStatus())) {
                throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
            }

            // Tìm dòng sản phẩm đã có trong đơn hàng
            Optional<OrderItem> existingItemOpt = order.getItems().stream()
                    .filter(item -> item.getProduct() != null && item.getProduct().getId().equals(product.getId()))
                    .findFirst();

            if (existingItemOpt.isPresent()) {
                // Cộng dồn số lượng khi quét cùng một mã vạch nhiều lần (NCL-16-CN-001-TC-03)
                OrderItem existingItem = existingItemOpt.get();
                BigDecimal newQty = existingItem.getQuantity().add(scanQty);

                PromotionItemResultResponse newPromoResult = promotionService.calculateItemPromotion(
                        user, product, newQty, product.getPrice(), false
                );

                // [P1-01 Fix] Tính toán thuế VAT và cộng vào subtotal dòng hàng
                BigDecimal taxRate = product.getTaxRate() != null ? product.getTaxRate().getRatePercentage() : BigDecimal.ZERO;
                BigDecimal baseAmount = newPromoResult.getFinalSubtotal();
                BigDecimal taxAmount = baseAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal lineSubtotal = baseAmount.add(taxAmount);

                existingItem.setQuantity(newQty);
                existingItem.setDiscountAmount(newPromoResult.getDiscountAmount());
                existingItem.setSubtotal(lineSubtotal);
                existingItem.setTaxRatePercentage(taxRate);
                existingItem.setTaxAmount(taxAmount);

                if (newPromoResult.getPromotionId() != null) {
                    existingItem.setPromotion(Promotion.builder().id(newPromoResult.getPromotionId()).build());
                    existingItem.setPromotionName(newPromoResult.getPromotionName());
                } else {
                    existingItem.setPromotion(null);
                    existingItem.setPromotionName(null);
                }

                orderItemRepository.save(existingItem);
            } else {
                // Thêm mới dòng sản phẩm vào đơn hàng
                // [P1-01 Fix] Tính toán thuế VAT và cộng vào subtotal dòng hàng
                BigDecimal taxRate = product.getTaxRate() != null ? product.getTaxRate().getRatePercentage() : BigDecimal.ZERO;
                BigDecimal baseAmount = promoResult.getFinalSubtotal();
                BigDecimal taxAmount = baseAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal lineSubtotal = baseAmount.add(taxAmount);

                OrderItem newItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .productName(product.getName())
                        .quantity(scanQty)
                        .unitPrice(product.getPrice())
                        .discountAmount(promoResult.getDiscountAmount())
                        .promotion(promoResult.getPromotionId() != null ? Promotion.builder().id(promoResult.getPromotionId()).build() : null)
                        .promotionName(promoResult.getPromotionName())
                        .taxRatePercentage(taxRate)
                        .taxAmount(taxAmount)
                        .subtotal(lineSubtotal)
                        .build();

                order.getItems().add(newItem);
                orderItemRepository.save(newItem);
            }

            recalculateOrderTotals(order);
            orderRepository.save(order);

            updatedOrderResponse = orderService.getOrder(currentUsername, order.getId());
        }

        return BarcodeScanResponse.builder()
                .found(true)
                .barcode(scannedCode)
                .message("Quét mã vạch thành công")
                .productId(product.getId())
                .productSku(product.getSku())
                .productName(product.getName())
                .unit(product.getUnit())
                .unitPrice(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .scannedQuantity(scanQty)
                .discountAmount(promoResult.getDiscountAmount())
                .subtotal(promoResult.getFinalSubtotal())
                .promotionId(promoResult.getPromotionId())
                .promotionName(promoResult.getPromotionName())
                .order(updatedOrderResponse)
                .build();
    }

    private void recalculateOrderTotals(Order order) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            total = total.add(item.getSubtotal());
        }
        order.setTotalAmount(total);

        BigDecimal discountAmount = order.getDiscountAmount();
        if (order.getDiscountType() != null) {
            if ("PERCENTAGE".equals(order.getDiscountType())) {
                BigDecimal rate = order.getDiscountRateOrValue() != null ? order.getDiscountRateOrValue() : BigDecimal.ZERO;
                discountAmount = total.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else if ("CASH".equals(order.getDiscountType())) {
                discountAmount = order.getDiscountRateOrValue() != null ? order.getDiscountRateOrValue() : BigDecimal.ZERO;
            }
        }
        if (discountAmount.compareTo(total) > 0) {
            discountAmount = total;
        }
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(total.subtract(discountAmount).max(BigDecimal.ZERO));
    }
}
