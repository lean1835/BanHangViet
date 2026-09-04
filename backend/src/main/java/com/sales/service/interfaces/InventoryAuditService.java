package com.sales.service.interfaces;

import com.sales.dto.request.CreateInventoryAuditRequest;
import com.sales.dto.response.InventoryAuditDetailInfoResponse;
import com.sales.dto.response.InventoryAuditResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PendingOrderCheckResponse;

public interface InventoryAuditService {
    InventoryAuditResponse createInventoryAudit(String currentUsername, CreateInventoryAuditRequest request);
    PageResponse<InventoryAuditResponse> getInventoryAudits(String currentUsername, int page, int size);
    InventoryAuditDetailInfoResponse getInventoryAuditById(String currentUsername, String id);
    PendingOrderCheckResponse checkPendingOrders(String currentUsername);
}
