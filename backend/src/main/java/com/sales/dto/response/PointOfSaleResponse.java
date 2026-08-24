package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointOfSaleResponse {

    private String id;
    private String householdId;
    private String posCode;
    private String name;
    private String address;
    private String phoneNumber;
    private String invoiceSymbol;
    private Boolean isDefault;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
