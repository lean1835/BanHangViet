package com.sales.modules.supplier.service;
import com.sales.modules.supplier.dto.request.PaySupplierDebtRequest;
import com.sales.modules.supplier.dto.response.SupplierDebtResponse;
import com.sales.modules.supplier.dto.response.SupplierDebtSummaryResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.inventory.entity.GoodsReceipt;
import com.sales.modules.supplier.entity.Supplier;
import com.sales.modules.auth.entity.User;

import java.util.List;

public interface SupplierDebtService {

    SupplierDebtResponse paySupplierDebt(String currentUsername, PaySupplierDebtRequest request);

    SupplierDebtResponse receiveSupplierRefund(String currentUsername, com.sales.modules.supplier.dto.request.ReceiveSupplierRefundRequest request);

    List<SupplierDebtResponse> getSupplierDebtHistory(String currentUsername, String supplierId);

    List<SupplierDebtResponse> getSupplierDebts(String currentUsername, String statusFilter);

    SupplierDebtSummaryResponse getSupplierDebtSummary(String currentUsername);

    void recordGoodsReceiptDebt(BusinessHousehold household, Supplier supplier, GoodsReceipt receipt, User actor);

    void recordSupplierReturnDebtReduction(BusinessHousehold household, Supplier supplier, GoodsReceipt receipt, java.math.BigDecimal totalReturnAmount, String returnNumber, User actor);
}
