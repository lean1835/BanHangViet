package com.sales.service.interfaces;

import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxPeriodResponse;
import com.sales.dto.response.TaxSalesRegisterResponse;

import com.sales.dto.response.TaxRevenueSummaryResponse;
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

    TaxPeriodResponse unlockTaxPeriod(String currentUsername, String periodId, com.sales.dto.request.UnlockTaxPeriodRequest request);
}

