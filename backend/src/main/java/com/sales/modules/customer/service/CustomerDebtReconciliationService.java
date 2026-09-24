package com.sales.modules.customer.service;
import com.sales.modules.customer.dto.request.ConfirmDebtReconciliationRequest;
import com.sales.modules.customer.dto.request.CreateDebtAdjustmentRequest;
import com.sales.modules.customer.dto.request.CreateDebtReconciliationRequest;
import com.sales.modules.customer.dto.request.DebtReconciliationPreviewRequest;
import com.sales.modules.customer.dto.response.CustomerDebtResponse;
import com.sales.modules.customer.dto.response.DebtReconciliationResponse;
import com.sales.modules.customer.dto.response.DebtStatementPrintResponse;
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
