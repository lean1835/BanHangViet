package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.SyncCheckRequest;
import com.viet.sales.dto.request.OfflineOrderRequest;
import com.viet.sales.dto.request.SyncResolveRequest;
import com.viet.sales.dto.response.SyncCheckResponse;
import com.viet.sales.dto.response.OrderResponse;
import java.util.List;

public interface SyncService {
    SyncCheckResponse checkConflicts(String username, SyncCheckRequest request);
    List<OrderResponse> bulkUpload(String username, List<OfflineOrderRequest> requests);
    OrderResponse resolveConflict(String username, SyncResolveRequest request);
}
