package com.sales.service.interfaces;

import com.sales.dto.request.InvoiceTemplateRequest;
import com.sales.dto.response.InvoiceTemplateResponse;

public interface InvoiceTemplateService {
    InvoiceTemplateResponse getTemplateByHousehold(String currentUsername);
    InvoiceTemplateResponse updateTemplate(String currentUsername, InvoiceTemplateRequest request);
}
