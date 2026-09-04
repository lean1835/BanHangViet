package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkIssueFailedItemResponse {

    private String orderId;
    private String orderNumber;
    private String errorMessage;
}
