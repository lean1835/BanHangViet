package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignedHouseholdResponse {

    private String assignmentId;
    private String householdId;
    private String householdName;
    private String householdTaxCode;
    private String representativeName;
    private String phoneNumber;
    private String address;
    private List<String> scopePermissions;
    private LocalDateTime accessExpiresAt;
    private Boolean isCurrentActive;
}
