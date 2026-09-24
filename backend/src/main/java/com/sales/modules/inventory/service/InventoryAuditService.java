package com.sales.modules.inventory.service;
import com.sales.modules.inventory.dto.request.CreateInventoryAuditRequest;
import com.sales.modules.inventory.dto.response.InventoryAuditDetailInfoResponse;
import com.sales.modules.inventory.dto.response.InventoryAuditResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.order.dto.response.PendingOrderCheckResponse;

public interface InventoryAuditService {
    InventoryAuditResponse createInventoryAudit(String currentUsername, CreateInventoryAuditRequest request);
    PageResponse<InventoryAuditResponse> getInventoryAudits(String currentUsername, int page, int size);
    InventoryAuditDetailInfoResponse getInventoryAuditById(String currentUsername, String id);
    PendingOrderCheckResponse checkPendingOrders(String currentUsername);
}
