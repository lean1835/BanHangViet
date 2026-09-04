package com.sales.service.classes;

import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.request.CreateOrderItemRequest;
import com.sales.dto.response.BarcodeResponse;
import com.sales.dto.response.BarcodeScanResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.BarcodeService;
import com.sales.service.interfaces.OrderService;
import com.sales.service.interfaces.PromotionService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeServiceImpl implements BarcodeService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PromotionService promotionService;
    private final OrderService orderService;

    private final Random random = new Random();

    private User validateAndGetStoreOwner(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // TC-03: Only Store Owner (VT-01, STORE_OWNER, or OWNER) is allowed to manage/generate barcodes
        String roleCode = user.getRole() != null ? user.getRole().getCode() : "";
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        boolean isOwner = "VT-01".equals(roleCode) 
                || "STORE_OWNER".equalsIgnoreCase(roleCode) 
                || "OWNER".equalsIgnoreCase(roleCode) 
                || "OWNER".equalsIgnoreCase(roleName);

        if (!isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN_BARCODE_MANAGEMENT);
        }

        return user;
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
        List<Product> products = productRepository.findByHouseholdIdAndBarcodeOrSku(householdId, scannedCode);

        // 2. Trường hợp không tìm thấy sản phẩm
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

        // 4. Nếu có truyền orderId -> Ủy quyền cho OrderService thực hiện thêm/cộng dồn số lượng
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BarcodeResponse generateInternalBarcode(String currentUsername, String productId) {
        User currentUser = validateAndGetStoreOwner(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        String newBarcode = generateUniqueInternalBarcode(householdId);
        product.setBarcode(newBarcode);
        Product savedProduct = productRepository.save(product);

        return buildBarcodeResponse(savedProduct, "58mm", 1);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BarcodeResponse assignBarcode(String currentUsername, String productId, AssignBarcodeRequest request) {
        User currentUser = validateAndGetStoreOwner(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        String barcodeToAssign = request.getBarcode().trim();

        // QTN-27: Check barcode uniqueness per household
        boolean isDuplicate = productRepository.existsByHouseholdIdAndBarcodeAndIdNotAndDeletedAtIsNull(
                householdId, barcodeToAssign, productId);
        if (isDuplicate) {
            throw new AppException(ErrorCode.BARCODE_ALREADY_EXISTS);
        }

        product.setBarcode(barcodeToAssign);
        Product savedProduct = productRepository.save(product);

        return buildBarcodeResponse(savedProduct, "58mm", 1);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BarcodeResponse getBarcodePrintData(String currentUsername, String productId, String paperSize, Integer quantity) {
        User currentUser = validateAndGetStoreOwner(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        String actualPaperSize = (paperSize == null || paperSize.isBlank()) ? "58mm" : paperSize.trim();
        if (!actualPaperSize.matches("^(58mm|80mm|standard)$")) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // If product has no barcode yet, auto-generate one per TC-01
        if (product.getBarcode() == null || product.getBarcode().isBlank()) {
            String newBarcode = generateUniqueInternalBarcode(householdId);
            product.setBarcode(newBarcode);
            product = productRepository.save(product);
        }

        int actualQuantity = (quantity == null || quantity < 1) ? 1 : quantity;

        return buildBarcodeResponse(product, actualPaperSize, actualQuantity);
    }

    private String generateUniqueInternalBarcode(String householdId) {
        int maxAttempts = 50;
        for (int i = 0; i < maxAttempts; i++) {
            // Internal barcode format: "200" prefix + 9 random digits = 12 digits base + 1 EAN-13 check digit = 13 digits
            long number = 100000000L + random.nextLong(900000000L);
            String base12 = "200" + number;
            int checkDigit = calculateEan13CheckDigit(base12);
            String candidate = base12 + checkDigit;

            boolean exists = productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(householdId, candidate);
            if (!exists) {
                return candidate;
            }
        }
        log.error("Failed to generate unique internal barcode after {} attempts for household {}", maxAttempts, householdId);
        throw new AppException(ErrorCode.BARCODE_GENERATION_FAILED);
    }

    private int calculateEan13CheckDigit(String base12) {
        int sumOdd = 0;
        int sumEven = 0;
        for (int i = 0; i < 12; i++) {
            int digit = Character.getNumericValue(base12.charAt(i));
            if (i % 2 == 0) {
                sumOdd += digit;
            } else {
                sumEven += digit * 3;
            }
        }
        int total = sumOdd + sumEven;
        int remainder = total % 10;
        return (remainder == 0) ? 0 : (10 - remainder);
    }

    private BarcodeResponse buildBarcodeResponse(Product product, String paperSize, int quantity) {
        String base64Image = generateBarcode1DBase64(product.getBarcode());
        String householdName = (product.getHousehold() != null) ? product.getHousehold().getName() : "";

        return BarcodeResponse.builder()
                .productId(product.getId())
                .sku(product.getSku())
                .productName(product.getName())
                .barcode(product.getBarcode())
                .price(product.getPrice())
                .unit(product.getUnit())
                .householdName(householdName)
                .paperSize(paperSize)
                .quantity(quantity)
                .barcodeBase64Image(base64Image)
                .build();
    }

    private String generateBarcode1DBase64(String barcodeText) {
        if (barcodeText == null || barcodeText.isBlank()) {
            return null;
        }
        try {
            int width = 600;
            int height = 150;
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.MARGIN, 2);

            BitMatrix bitMatrix;
            String trimmed = barcodeText.trim();
            if (trimmed.length() == 13 && trimmed.matches("\\d{13}")) {
                try {
                    com.google.zxing.oned.EAN13Writer eanWriter = new com.google.zxing.oned.EAN13Writer();
                    bitMatrix = eanWriter.encode(trimmed, BarcodeFormat.EAN_13, width, height, hints);
                } catch (Exception e) {
                    Code128Writer writer = new Code128Writer();
                    bitMatrix = writer.encode(trimmed, BarcodeFormat.CODE_128, width, height, hints);
                }
            } else {
                Code128Writer writer = new Code128Writer();
                bitMatrix = writer.encode(trimmed, BarcodeFormat.CODE_128, width, height, hints);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "png", baos);
            byte[] bytes = baos.toByteArray();

            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.error("Error generating 1D barcode image for text: {}", barcodeText, e);
            return null;
        }
    }
}
