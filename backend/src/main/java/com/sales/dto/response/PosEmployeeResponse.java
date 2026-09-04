package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosEmployeeResponse {
    private String id;
    private String username;
    private String fullName;
    private String phoneNumber;
    private String roleCode;
    private String roleName;
    private String pointOfSaleId;
    private String pointOfSaleName;
    private String posCode;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
