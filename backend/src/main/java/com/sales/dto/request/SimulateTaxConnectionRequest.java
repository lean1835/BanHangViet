package com.sales.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulateTaxConnectionRequest {
    private String status; // ONLINE, SLOW, OFFLINE
    private Integer responseTimeMs;
    private String errorMessage;
}
