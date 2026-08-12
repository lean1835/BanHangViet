package com.sales.service.interfaces;

import com.sales.dto.request.UpdateMinStockRequest;
import com.sales.dto.response.LowStockWarningListResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.ProductResponse;
import com.sales.dto.response.PurchaseSuggestionResponse;

public interface InventoryWarningService {

    ProductResponse updateMinStock(String username, String productId, UpdateMinStockRequest request);

    LowStockWarningListResponse getLowStockWarnings(String username, String search, String groupId, int page, int size);

    PageResponse<PurchaseSuggestionResponse> getPurchaseSuggestions(String username, Integer periodDays, String groupId, int page, int size);
}
