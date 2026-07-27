package com.sales.service.interfaces;

import com.sales.dto.request.SyncCheckRequest;
import com.sales.dto.request.OfflineOrderRequest;
import com.sales.dto.request.SyncResolveRequest;
import com.sales.dto.response.SyncCheckResponse;
import com.sales.dto.response.OrderResponse;
import java.util.List;

public interface SyncService {
    SyncCheckResponse checkConflicts(String username, SyncCheckRequest request);
    List<OrderResponse> bulkUpload(String username, List<OfflineOrderRequest> requests);
    OrderResponse resolveConflict(String username, SyncResolveRequest request);
}
