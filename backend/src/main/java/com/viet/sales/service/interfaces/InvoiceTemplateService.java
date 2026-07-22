package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.InvoiceTemplateRequest;
import com.viet.sales.dto.response.InvoiceTemplateResponse;

public interface InvoiceTemplateService {
    InvoiceTemplateResponse getTemplateByHousehold(String currentUsername);
    InvoiceTemplateResponse updateTemplate(String currentUsername, InvoiceTemplateRequest request);
}
