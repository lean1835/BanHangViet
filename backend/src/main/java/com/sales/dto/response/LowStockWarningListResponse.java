package com.sales.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockWarningListResponse {
    private PageResponse<LowStockWarningResponse> page;
    private boolean isStockAdequate;
    private String message;
}
