package com.sales.service.interfaces;

import com.sales.dto.request.CreateSupplierReturnRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.ReceiptReturnableCheckResponse;
import com.sales.dto.response.SupplierReturnDetailResponse;
import com.sales.dto.response.SupplierReturnResponse;

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
