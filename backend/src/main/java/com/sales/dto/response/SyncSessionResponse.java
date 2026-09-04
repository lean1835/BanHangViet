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
public class SyncSessionResponse {
    private String id;
    private String sessionCode;
    private String userId;
    private String username;
    private String userFullName;
    private String deviceId;
    private Integer totalSent;
    private Integer totalReceived;
    private Integer totalDuplicated;
    private Integer totalConflicted;
    private Integer totalFailed;
    private String status; // MATCHED, DISCREPANCY
    private LocalDateTime syncedAt;
    private LocalDateTime createdAt;
    private List<SyncSessionDetailResponse> details;
}
