package com.sales.service.classes;

import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.response.BarcodeResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.BarcodeService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeServiceImpl implements BarcodeService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final Random random = new SecureRandom();

    private User validateAndGetStoreOwner(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // TC-03: Only Store Owner (VT-01 or STORE_OWNER/OWNER) is allowed to manage/generate barcodes
        String roleCode = user.getRole() != null ? user.getRole().getCode() : "";
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        boolean isOwner = "VT-01".equals(roleCode) || "STORE_OWNER".equalsIgnoreCase(roleCode) || "OWNER".equalsIgnoreCase(roleCode) || "OWNER".equalsIgnoreCase(roleName);

        if (!isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN_BARCODE_MANAGEMENT);
        }

        return user;
    }

    @Override
    @Transactional
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
    @Transactional
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
    @Transactional
    public BarcodeResponse getBarcodePrintData(String currentUsername, String productId, String paperSize, Integer quantity) {
        User currentUser = validateAndGetStoreOwner(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // If product has no barcode yet, auto-generate one per TC-01
        if (product.getBarcode() == null || product.getBarcode().isBlank()) {
            String newBarcode = generateUniqueInternalBarcode(householdId);
            product.setBarcode(newBarcode);
            product = productRepository.save(product);
        }

        String actualPaperSize = (paperSize == null || paperSize.isBlank()) ? "58mm" : paperSize;
        int actualQuantity = (quantity == null || quantity < 1) ? 1 : quantity;

        return buildBarcodeResponse(product, actualPaperSize, actualQuantity);
    }

    private String generateUniqueInternalBarcode(String householdId) {
        int maxAttempts = 50;
        for (int i = 0; i < maxAttempts; i++) {
            // Internal barcode format: "200" prefix + 9 random digits = 12 digits
            long number = 100000000L + (long) (random.nextDouble() * 900000000L);
            String candidate = "200" + number;

            boolean exists = productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(householdId, candidate);
            if (!exists) {
                return candidate;
            }
        }
        log.error("Failed to generate unique internal barcode after {} attempts for household {}", maxAttempts, householdId);
        throw new AppException(ErrorCode.BARCODE_GENERATION_FAILED);
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
            int width = 300;
            int height = 100;
            Code128Writer writer = new Code128Writer();
            BitMatrix bitMatrix = writer.encode(barcodeText, BarcodeFormat.CODE_128, width, height);

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
