package com.sales.modules.support.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportInfoResponse {
    private String systemVersion;

    private String householdId;
    private String householdCode;
    private String householdName;
    private String taxCode;
    private String representativeName;
    private String phoneNumber;

    private String currentUsername;
    private String currentUserFullName;
    private String currentUserRole;

    private String quickSupportSummary;

    private List<SupportChannelResponse> supportChannels;
}
