package com.sales.modules.sync.service;
import com.sales.modules.sync.dto.request.SyncCheckRequest;
import com.sales.modules.order.dto.request.OfflineOrderRequest;
import com.sales.modules.sync.dto.request.SyncResolveRequest;
import com.sales.modules.sync.dto.response.SyncCheckResponse;
import com.sales.modules.order.dto.response.OrderResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.sync.dto.response.SyncReconciliationSummaryResponse;
import com.sales.modules.sync.dto.response.SyncSessionResponse;
import java.util.List;

public interface SyncService {
    SyncCheckResponse checkConflicts(String username, SyncCheckRequest request);
    List<OrderResponse> bulkUpload(String username, List<OfflineOrderRequest> requests);
    OrderResponse resolveConflict(String username, SyncResolveRequest request);

    PageResponse<SyncSessionResponse> getSyncSessions(String username, int page, int size, String fromDate, String toDate, String status);
    SyncSessionResponse getSyncSessionDetail(String username, String sessionId);
    SyncReconciliationSummaryResponse getSyncReconciliationSummary(String username, String fromDate, String toDate, String status);
}
