package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {
    private String id;
    private String householdId;
    private String name;
    private String phoneNumber;
    private String email;
    private String address;
    private BigDecimal creditLimit;
    private BigDecimal currentDebt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
