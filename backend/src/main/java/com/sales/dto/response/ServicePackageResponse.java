package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServicePackageResponse {

    private String id;
    private String code;
    private String name;
    private String description;
    private Integer maxUsers;
    private Integer maxPosPoints;
    private Integer maxInvoicesPerMonth;
    private Integer dataRetentionDays;
    private BigDecimal price;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
