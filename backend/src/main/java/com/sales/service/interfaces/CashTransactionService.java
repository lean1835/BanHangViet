package com.sales.service.interfaces;

import com.sales.dto.request.CreateCashTransactionRequest;
import com.sales.dto.request.RejectCashExpenseRequest;
import com.sales.dto.response.CashTransactionResponse;
import com.sales.dto.response.ShiftCashSummaryResponse;

import java.math.BigDecimal;
import java.util.List;

public interface CashTransactionService {

    CashTransactionResponse createTransaction(String currentUsername, CreateCashTransactionRequest request);

    List<CashTransactionResponse> getCurrentShiftTransactions(String currentUsername);

    List<CashTransactionResponse> getShiftTransactions(String currentUsername, String shiftId);

    ShiftCashSummaryResponse getShiftCashSummary(String currentUsername, String shiftId);

    CashTransactionResponse getTransactionById(String currentUsername, String transactionId);

    CashTransactionResponse approveTransaction(String currentUsername, String transactionId);

    CashTransactionResponse rejectTransaction(String currentUsername, String transactionId, RejectCashExpenseRequest request);

    void updateExpenseThreshold(String currentUsername, BigDecimal threshold);
}
