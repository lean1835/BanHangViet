package com.sales.service.interfaces;

import com.sales.dto.request.CreateSupplierRequest;
import com.sales.dto.request.UpdateSupplierRequest;
import com.sales.dto.response.SupplierResponse;

import java.util.List;

public interface SupplierService {
    SupplierResponse createSupplier(String currentUsername, CreateSupplierRequest request);
    SupplierResponse updateSupplier(String currentUsername, String id, UpdateSupplierRequest request);
    SupplierResponse toggleSupplierStatus(String currentUsername, String id, String status);
    SupplierResponse getSupplier(String currentUsername, String id);
    List<SupplierResponse> getSuppliers(String currentUsername);
    List<SupplierResponse> searchSuppliers(String currentUsername, String query);
    void deleteSupplier(String currentUsername, String id);
}
