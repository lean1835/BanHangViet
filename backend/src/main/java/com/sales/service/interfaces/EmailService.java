package com.sales.service.interfaces;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface EmailService {
    void sendInvoiceEmailAsync(String deliveryLogId, String toEmail, String lookupUrl, String householdName, String lookupCode, BigDecimal finalAmount);
    void sendDebtReminderEmailAsync(String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate);
    void sendOverdueDebtReminderEmailAsync(String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate);
}

