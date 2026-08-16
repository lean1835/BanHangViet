package com.sales.service.interfaces;

import com.sales.dto.request.SyncCheckRequest;
import com.sales.dto.request.OfflineOrderRequest;
import com.sales.dto.request.SyncResolveRequest;
import com.sales.dto.response.SyncCheckResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.SyncReconciliationSummaryResponse;
import com.sales.dto.response.SyncSessionResponse;
import java.util.List;

public interface SyncService {
    SyncCheckResponse checkConflicts(String username, SyncCheckRequest request);
    List<OrderResponse> bulkUpload(String username, List<OfflineOrderRequest> requests);
    OrderResponse resolveConflict(String username, SyncResolveRequest request);

    PageResponse<SyncSessionResponse> getSyncSessions(String username, int page, int size, String fromDate, String toDate, String status);
    SyncSessionResponse getSyncSessionDetail(String username, String sessionId);
    SyncReconciliationSummaryResponse getSyncReconciliationSummary(String username, String fromDate, String toDate, String status);
}
