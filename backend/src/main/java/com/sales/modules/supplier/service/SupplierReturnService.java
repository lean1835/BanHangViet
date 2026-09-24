package com.sales.modules.supplier.service;
import com.sales.modules.supplier.dto.request.CreateSupplierReturnRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.order.dto.response.ReceiptReturnableCheckResponse;
import com.sales.modules.supplier.dto.response.SupplierReturnDetailResponse;
import com.sales.modules.supplier.dto.response.SupplierReturnResponse;

import java.time.LocalDate;

public interface SupplierReturnService {

    ReceiptReturnableCheckResponse checkReceiptReturnable(String currentUsername, String receiptId);

    SupplierReturnResponse createSupplierReturn(String currentUsername, CreateSupplierReturnRequest request);

    PageResponse<SupplierReturnResponse> getSupplierReturns(
            String currentUsername,
            String supplierId,
            LocalDate fromDate,
            LocalDate toDate,
            String keyword,
            int page,
            int size
    );

    SupplierReturnDetailResponse getSupplierReturnById(String currentUsername, String id);
}
