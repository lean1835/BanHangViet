package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibleRecipientResponse {
    private String userId;
    private String username;
    private String fullName;
    private String roleCode;
    private String roleName;
    private Boolean hasOpenShift;
}
