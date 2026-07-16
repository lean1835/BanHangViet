package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CreateProductRequest;
import com.viet.sales.dto.request.UpdateProductRequest;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.dto.response.ProductResponse;

public interface ProductService {
    ProductResponse createProduct(String currentUsername, CreateProductRequest request);

    ProductResponse updateProduct(String currentUsername, String productId, UpdateProductRequest request);

    void deleteProduct(String currentUsername, String productId);

    ProductResponse getProductById(String currentUsername, String productId);

    PageResponse<ProductResponse> getProducts(String currentUsername, String search, String groupId, String status, Boolean excludeInactive, String stockFilter, int page, int size);
}
