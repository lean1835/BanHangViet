package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncSessionDetailResponse {
    private String id;
    private String orderNumber;
    private String status; // SUCCESS, DUPLICATE, CONFLICT, MISSING, FAILED
    private String note;
}
