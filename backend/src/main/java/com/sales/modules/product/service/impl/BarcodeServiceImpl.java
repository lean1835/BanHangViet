package com.sales.modules.product.service.impl;
import com.sales.modules.product.dto.request.AssignBarcodeRequest;
import com.sales.modules.product.dto.request.BarcodeScanRequest;
import com.sales.modules.order.dto.request.CreateOrderItemRequest;
import com.sales.modules.product.dto.response.BarcodeResponse;
import com.sales.modules.product.dto.response.BarcodeScanResponse;
import com.sales.modules.order.dto.response.OrderResponse;
import com.sales.modules.promotion.dto.response.PromotionItemResultResponse;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.entity.ProductUnitConversion;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.product.repository.ProductUnitConversionRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.product.service.BarcodeService;
import com.sales.modules.order.service.OrderService;
import com.sales.modules.promotion.service.PromotionService;
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
import java.util.Base64;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import com.google.zxing.oned.EAN13Writer;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeServiceImpl implements BarcodeService {
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PromotionService promotionService;
    private final OrderService orderService;
    private final ProductUnitConversionRepository productUnitConversionRepository;

    private final Random random = new Random();

    private User validateAndGetStoreOwner(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

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

        Product product = null;
        ProductUnitConversion conversion = null;

        List<Product> products = productRepository.findByHouseholdIdAndBarcodeOrSku(householdId, scannedCode);
        if (!products.isEmpty()) {
            product = products.stream()
                    .filter(p -> scannedCode.equalsIgnoreCase(p.getBarcode()))
                    .findFirst()
                    .orElse(products.get(0));
        } else if (productUnitConversionRepository != null) {
            conversion = productUnitConversionRepository.findByHouseholdIdAndBarcode(householdId, scannedCode).orElse(null);
            if (conversion != null) {
                product = conversion.getProduct();
            }
        }

        if (product == null) {
            log.info("Barcode scan failed: code '{}' not found in household '{}'", scannedCode, householdId);
            return BarcodeScanResponse.builder()
                    .found(false)
                    .barcode(scannedCode)
                    .suggestedBarcode(scannedCode)
                    .message("Mã vạch '" + scannedCode + "' chưa được gán cho mặt hàng nào trong hệ thống")
                    .build();
        }

        BigDecimal scanQty = (request.getQuantity() != null && request.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                ? request.getQuantity() : BigDecimal.ONE;

        BigDecimal unitPrice = (conversion != null && conversion.getPrice() != null)
                ? conversion.getPrice()
                : (conversion != null ? product.getPrice().multiply(conversion.getConversionFactor()) : product.getPrice());
        String unitName = conversion != null ? conversion.getUnitName() : product.getUnit();

        PromotionItemResultResponse promoResult = promotionService.calculateItemPromotion(
                user, product, scanQty, unitPrice, false
        );

        OrderResponse updatedOrderResponse = null;

        if (request.getOrderId() != null && !request.getOrderId().trim().isEmpty()) {
            CreateOrderItemRequest itemRequest = CreateOrderItemRequest.builder()
                    .productId(product.getId())
                    .quantity(scanQty)
                    .unitConversionId(conversion != null ? conversion.getId() : null)
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
                .unit(unitName)
                .unitPrice(unitPrice)
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
                    EAN13Writer eanWriter = new EAN13Writer();
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
