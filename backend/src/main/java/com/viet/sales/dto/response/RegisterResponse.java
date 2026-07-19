package com.viet.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {
    private String householdId;
    private String taxCode;
    private String householdName;
    private String householdAddress;
    private String householdPhone;
    private String userId;
    private String username;
    private String fullName;
    private String roleCode;
}
