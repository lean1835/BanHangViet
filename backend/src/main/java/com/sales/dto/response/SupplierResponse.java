package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {
    private String id;
    private String householdId;
    private String name;
    private String phoneNumber;
    private String email;
    private String address;
    private String taxCode;
    private String note;
    private String status;
    private BigDecimal currentDebt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
