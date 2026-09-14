package com.sales.service.interfaces;

import com.sales.dto.request.ConfirmDebtReconciliationRequest;
import com.sales.dto.request.CreateDebtAdjustmentRequest;
import com.sales.dto.request.CreateDebtReconciliationRequest;
import com.sales.dto.request.DebtReconciliationPreviewRequest;
import com.sales.dto.response.CustomerDebtResponse;
import com.sales.dto.response.DebtReconciliationResponse;
import com.sales.dto.response.DebtStatementPrintResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface CustomerDebtReconciliationService {

    DebtReconciliationResponse previewReconciliation(String currentUsername, DebtReconciliationPreviewRequest request);

    DebtReconciliationResponse createReconciliation(String currentUsername, CreateDebtReconciliationRequest request);

    DebtReconciliationResponse confirmReconciliation(String currentUsername, String id, ConfirmDebtReconciliationRequest request);

    void cancelReconciliation(String currentUsername, String id);

    DebtReconciliationResponse getReconciliationById(String currentUsername, String id);

    Page<DebtReconciliationResponse> getReconciliations(
            String currentUsername,
            String customerId,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);

    DebtStatementPrintResponse getPrintStatement(String currentUsername, String id);

    CustomerDebtResponse createDebtAdjustment(String currentUsername, CreateDebtAdjustmentRequest request);

    DebtReconciliationResponse getLatestReconciliation(String currentUsername, String customerId);
}
