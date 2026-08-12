package com.sales.service.interfaces;

import com.sales.dto.request.PaySupplierDebtRequest;
import com.sales.dto.response.SupplierDebtResponse;
import com.sales.dto.response.SupplierDebtSummaryResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.GoodsReceipt;
import com.sales.entity.Supplier;
import com.sales.entity.User;

import java.util.List;

public interface SupplierDebtService {

    SupplierDebtResponse paySupplierDebt(String currentUsername, PaySupplierDebtRequest request);

    List<SupplierDebtResponse> getSupplierDebtHistory(String currentUsername, String supplierId);

    List<SupplierDebtResponse> getSupplierDebts(String currentUsername, String statusFilter);

    SupplierDebtSummaryResponse getSupplierDebtSummary(String currentUsername);

    void recordGoodsReceiptDebt(BusinessHousehold household, Supplier supplier, GoodsReceipt receipt, User actor);
}
