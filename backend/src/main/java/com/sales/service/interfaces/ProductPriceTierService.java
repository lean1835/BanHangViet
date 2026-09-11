package com.sales.service.interfaces;

import com.sales.dto.request.BatchSavePriceTiersRequest;
import com.sales.dto.request.CreatePriceTierRequest;
import com.sales.dto.request.UpdatePriceTierRequest;
import com.sales.dto.response.PricingDecision;
import com.sales.dto.response.ProductPriceTierResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.dto.response.ResolveTierPriceResponse;
import com.sales.entity.Product;
import com.sales.entity.ProductPriceTier;

import java.math.BigDecimal;
import java.util.List;

public interface ProductPriceTierService {

    List<ProductPriceTierResponse> getProductPriceTiers(String currentUsername, String productId);

    ProductPriceTierResponse createPriceTier(String currentUsername, String productId, CreatePriceTierRequest request);

    ProductPriceTierResponse updatePriceTier(String currentUsername, String productId, String tierId, UpdatePriceTierRequest request);

    void deletePriceTier(String currentUsername, String productId, String tierId);

    List<ProductPriceTierResponse> batchSavePriceTiers(String currentUsername, String productId, BatchSavePriceTiersRequest request);

    ResolveTierPriceResponse resolveTierPrice(String currentUsername, String productId, BigDecimal quantity, String unitConversionId);

    ProductPriceTier matchPriceTier(String householdId, Product product, BigDecimal quantity, String unitConversionId);

    PricingDecision resolvePricingDecision(
            BigDecimal regularUnitPrice,
            ProductPriceTier matchedTier,
            PromotionItemResultResponse promoResult,
            BigDecimal quantity
    );
}
