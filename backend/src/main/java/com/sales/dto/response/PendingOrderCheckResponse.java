package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingOrderCheckResponse {

    private boolean hasPendingOrders;
    private int pendingOrderCount;
    private List<String> pendingOrderNumbers;
    private String warningMessage;
}
