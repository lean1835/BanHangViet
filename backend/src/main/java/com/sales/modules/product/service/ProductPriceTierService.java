package com.sales.modules.product.service;
import com.sales.modules.product.dto.request.BatchSavePriceTiersRequest;
import com.sales.modules.product.dto.request.CreatePriceTierRequest;
import com.sales.modules.product.dto.request.UpdatePriceTierRequest;
import com.sales.modules.order.dto.response.PricingDecision;
import com.sales.modules.product.dto.response.ProductPriceTierResponse;
import com.sales.modules.promotion.dto.response.PromotionItemResultResponse;
import com.sales.modules.order.dto.response.ResolveTierPriceResponse;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.entity.ProductPriceTier;

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
