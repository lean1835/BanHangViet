package com.viet.sales.service.interfaces;

public interface EmailService {
    void sendInvoiceEmailAsync(String toEmail, String lookupUrl, String householdName, String lookupCode);
}
