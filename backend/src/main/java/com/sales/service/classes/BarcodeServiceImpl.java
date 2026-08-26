package com.sales.service.classes;

import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.request.CreateOrderItemRequest;
import com.sales.dto.response.BarcodeScanResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.Product;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeServiceImpl implements BarcodeService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PromotionService promotionService;
    private final OrderService orderService;

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

        // 1. Tra cứu sản phẩm theo mã vạch (barcode) hoặc SKU trong Hộ kinh doanh (Lấy danh sách tránh lỗi NonUniqueResultException)
        List<Product> products = productRepository.findByHouseholdIdAndBarcodeOrSku(householdId, scannedCode);

        // 2. Trường hợp không tìm thấy sản phẩm (NCL-16-CN-001-TC-02)
        if (products.isEmpty()) {
            log.info("Barcode scan failed: code '{}' not found in household '{}'", scannedCode, householdId);
            return BarcodeScanResponse.builder()
                    .found(false)
                    .barcode(scannedCode)
                    .suggestedBarcode(scannedCode)
                    .message("Mã vạch '" + scannedCode + "' chưa được gán cho mặt hàng nào trong hệ thống")
                    .build();
        }

        // Lựa chọn sản phẩm khớp ưu tiên barcode trước SKU
        Product product = products.stream()
                .filter(p -> scannedCode.equalsIgnoreCase(p.getBarcode()))
                .findFirst()
                .orElse(products.get(0));

        BigDecimal scanQty = (request.getQuantity() != null && request.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                ? request.getQuantity() : BigDecimal.ONE;

        // 3. Tính toán khuyến mại tự động áp dụng cho mặt hàng để xem trước thông tin
        PromotionItemResultResponse promoResult = promotionService.calculateItemPromotion(
                user, product, scanQty, product.getPrice(), false
        );

        OrderResponse updatedOrderResponse = null;

        // 4. Nếu có truyền orderId -> Ủy quyền cho OrderService thực hiện thêm/cộng dồn số lượng, tính lại tổng đơn hàng (bao gồm chiết khấu VIP & VAT) và ghi Nhật ký kiểm toán (ActivityLog per QTN-25)
        if (request.getOrderId() != null && !request.getOrderId().trim().isEmpty()) {
            CreateOrderItemRequest itemRequest = CreateOrderItemRequest.builder()
                    .productId(product.getId())
                    .quantity(scanQty)
                    .bypassPromotion(false)
                    .build();

            updatedOrderResponse = orderService.addOrderItem(currentUsername, request.getOrderId().trim(), itemRequest);
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
}
