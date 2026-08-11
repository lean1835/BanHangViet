package com.sales.dto.response;

import lombok.*;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
