package com.sales.modules.inventory.service;
import com.sales.modules.inventory.dto.request.UpdateMinStockRequest;
import com.sales.modules.inventory.dto.response.LowStockWarningListResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.product.dto.response.ProductResponse;
import com.sales.modules.inventory.dto.response.PurchaseSuggestionResponse;
import com.sales.modules.product.dto.response.SlowMovingProductListResponse;

public interface InventoryWarningService {

    ProductResponse updateMinStock(String username, String productId, UpdateMinStockRequest request);

    LowStockWarningListResponse getLowStockWarnings(String username, String search, String groupId, int page, int size);

    PageResponse<PurchaseSuggestionResponse> getPurchaseSuggestions(String username, Integer periodDays, String groupId, int page, int size);

    SlowMovingProductListResponse getSlowMovingProducts(String username, Integer thresholdDays, String groupId, String search, int page, int size);
}
