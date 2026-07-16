package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CreateProductGroupRequest;
import com.viet.sales.dto.request.UpdateProductGroupRequest;
import com.viet.sales.dto.response.ProductGroupDetailResponse;
import com.viet.sales.dto.response.ProductGroupResponse;

import java.util.List;

public interface ProductGroupService {
    ProductGroupResponse createProductGroup(String currentUsername, CreateProductGroupRequest request);
    ProductGroupResponse updateProductGroup(String currentUsername, String id, UpdateProductGroupRequest request);
    void deleteProductGroup(String currentUsername, String id);
    List<ProductGroupResponse> getAllProductGroups(String currentUsername);
    ProductGroupDetailResponse getProductGroupById(String currentUsername, String id);
}
