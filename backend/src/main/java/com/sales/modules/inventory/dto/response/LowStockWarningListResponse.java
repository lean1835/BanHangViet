package com.sales.modules.inventory.dto.response;
import com.sales.common.dto.PageResponse;

import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockWarningListResponse {
    private PageResponse<LowStockWarningResponse> page;
    private boolean isStockAdequate;
    private String message;
}
