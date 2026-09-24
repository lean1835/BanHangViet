package com.sales.modules.product.service;
import com.sales.modules.product.dto.request.CreateProductRequest;
import com.sales.modules.product.dto.request.UpdateProductRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.product.dto.response.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse createProduct(String currentUsername, CreateProductRequest request);

    ProductResponse updateProduct(String currentUsername, String productId, UpdateProductRequest request);

    void deleteProduct(String currentUsername, String productId);

    ProductResponse getProductById(String currentUsername, String productId);

    PageResponse<ProductResponse> getProducts(String currentUsername, String search, String groupId, String status, Boolean excludeInactive, String stockFilter, int page, int size);

    List<ProductResponse> voiceSearchProducts(String currentUsername, String query, String groupId, int limit);
}
