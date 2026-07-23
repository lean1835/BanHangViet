package com.viet.sales.service.interfaces;

import java.math.BigDecimal;

public interface EmailService {
    void sendInvoiceEmailAsync(String deliveryLogId, String toEmail, String lookupUrl, String householdName, String lookupCode, BigDecimal finalAmount);
}

