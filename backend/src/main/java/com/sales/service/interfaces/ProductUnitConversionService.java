package com.sales.service.interfaces;

import com.sales.dto.request.CreateProductUnitConversionRequest;
import com.sales.dto.request.UpdateProductUnitConversionRequest;
import com.sales.dto.response.ProductUnitConversionResponse;

import java.util.List;

public interface ProductUnitConversionService {

    List<ProductUnitConversionResponse> getUnitConversions(String currentUsername, String productId);

    ProductUnitConversionResponse createUnitConversion(String currentUsername, String productId, CreateProductUnitConversionRequest request);

    ProductUnitConversionResponse updateUnitConversion(String currentUsername, String productId, String conversionId, UpdateProductUnitConversionRequest request);

    void deleteUnitConversion(String currentUsername, String productId, String conversionId);

    boolean hasStockMovement(String productId, String householdId);
}
