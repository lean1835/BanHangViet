package com.sales.service.interfaces;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface EmailService {
    void sendInvoiceEmailAsync(String deliveryLogId, String toEmail, String lookupUrl, String householdName, String lookupCode, BigDecimal finalAmount);
    void sendDebtReminderEmail(String debtId, String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate);
    void sendOverdueDebtReminderEmail(String debtId, String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate);
    void sendDebtReminderEmailAsync(String debtId, String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate);
    void sendOverdueDebtReminderEmailAsync(String debtId, String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate);
    void sendCustomDebtReminderEmail(String toEmail, String customerName, String householdName, BigDecimal totalDebt, String messageContent);
}

