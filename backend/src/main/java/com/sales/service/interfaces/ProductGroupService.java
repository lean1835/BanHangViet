package com.sales.service.interfaces;

import com.sales.dto.request.CreateProductGroupRequest;
import com.sales.dto.request.UpdateProductGroupRequest;
import com.sales.dto.response.ProductGroupDetailResponse;
import com.sales.dto.response.ProductGroupResponse;

import java.util.List;

public interface ProductGroupService {
    ProductGroupResponse createProductGroup(String currentUsername, CreateProductGroupRequest request);
    ProductGroupResponse updateProductGroup(String currentUsername, String id, UpdateProductGroupRequest request);
    void deleteProductGroup(String currentUsername, String id);
    List<ProductGroupResponse> getAllProductGroups(String currentUsername);
    ProductGroupDetailResponse getProductGroupById(String currentUsername, String id);
}
