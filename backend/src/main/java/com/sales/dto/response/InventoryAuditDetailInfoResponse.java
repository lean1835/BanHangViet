package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAuditDetailInfoResponse {

    private String id;
    private String auditNumber;
    private LocalDateTime auditDate;
    private String status;
    private Integer totalItems;
    private BigDecimal totalDifferenceQty;
    private String createdByUserId;
    private String createdByUserName;
    private String notes;
    private LocalDateTime createdAt;
    private List<InventoryAuditDetailResponse> details;
}
