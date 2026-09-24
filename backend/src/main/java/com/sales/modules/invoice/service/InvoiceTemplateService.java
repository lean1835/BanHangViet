package com.sales.modules.invoice.service;
import com.sales.modules.invoice.dto.request.InvoiceTemplateRequest;
import com.sales.modules.invoice.dto.response.InvoiceTemplateResponse;

public interface InvoiceTemplateService {
    InvoiceTemplateResponse getTemplateByHousehold(String currentUsername);
    InvoiceTemplateResponse updateTemplate(String currentUsername, InvoiceTemplateRequest request);
}
