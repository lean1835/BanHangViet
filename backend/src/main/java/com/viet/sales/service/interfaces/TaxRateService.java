package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.TaxRateRequest;
import com.viet.sales.dto.response.TaxRateResponse;

import java.util.List;

public interface TaxRateService {
    List<TaxRateResponse> getAllTaxRates(String currentUsername);
    TaxRateResponse createTaxRate(String currentUsername, TaxRateRequest request);
    TaxRateResponse updateTaxRate(String currentUsername, String id, TaxRateRequest request);
    TaxRateResponse toggleTaxRateStatus(String currentUsername, String id, Boolean isActive);
}
