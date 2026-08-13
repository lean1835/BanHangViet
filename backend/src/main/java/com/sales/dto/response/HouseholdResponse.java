package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdResponse {

    private String id;
    private String taxCode;
    private String name;
    private String address;
    private String phoneNumber;
    private String representativeName;
    private Boolean revenueThresholdEnabled;
    private Integer offlineMaxOrders;
    private Integer offlineMaxHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
