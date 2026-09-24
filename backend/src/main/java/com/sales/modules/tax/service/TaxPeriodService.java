package com.sales.modules.tax.service;
import com.sales.modules.tax.dto.request.GenerateTaxPurchaseRegisterRequest;
import com.sales.modules.tax.dto.request.GenerateTaxRegisterRequest;
import com.sales.modules.tax.dto.request.UnlockTaxPeriodRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.tax.dto.response.TaxPeriodResponse;
import com.sales.modules.tax.dto.response.TaxPurchaseRegisterItemResponse;
import com.sales.modules.tax.dto.response.TaxPurchaseRegisterSummaryResponse;
import com.sales.modules.tax.dto.response.TaxRevenueSummaryResponse;
import com.sales.modules.tax.dto.response.TaxSalesRegisterResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface TaxPeriodService {

    TaxPeriodResponse generateSalesRegister(String currentUsername, GenerateTaxRegisterRequest request);

    PageResponse<TaxSalesRegisterResponse> getSalesRegisterItems(String currentUsername, String periodId, int page, int size);

    TaxPeriodResponse getTaxPeriodDetail(String currentUsername, String periodId);

    List<TaxPeriodResponse> getAllTaxPeriods(String currentUsername);

    TaxRevenueSummaryResponse getTaxRevenueSummary(String currentUsername, String periodId);

    ResponseEntity<Resource> exportTaxDeclaration(String currentUsername, String periodId);

    TaxPeriodResponse lockTaxPeriod(String currentUsername, String periodId);

    TaxPeriodResponse unlockTaxPeriod(String currentUsername, String periodId, UnlockTaxPeriodRequest request);

    TaxPurchaseRegisterSummaryResponse generatePurchaseRegister(String currentUsername, GenerateTaxPurchaseRegisterRequest request);

    TaxPurchaseRegisterSummaryResponse getPurchaseRegisterSummary(String currentUsername, String periodId);

    PageResponse<TaxPurchaseRegisterItemResponse> getPurchaseRegisterItems(String currentUsername, String periodId, int page, int size, Boolean missingSupplierOnly);

    ResponseEntity<Resource> exportPurchaseRegister(String currentUsername, String periodId);
}

