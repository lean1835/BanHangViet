package com.sales.modules.tax.service;
import com.sales.modules.tax.dto.request.TaxRateRequest;
import com.sales.modules.tax.dto.response.TaxRateResponse;

import java.util.List;

public interface TaxRateService {
    List<TaxRateResponse> getAllTaxRates(String currentUsername);
    TaxRateResponse createTaxRate(String currentUsername, TaxRateRequest request);
    TaxRateResponse updateTaxRate(String currentUsername, String id, TaxRateRequest request);
    TaxRateResponse toggleTaxRateStatus(String currentUsername, String id, Boolean isActive);
}
