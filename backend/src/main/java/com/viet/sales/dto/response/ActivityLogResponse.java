package com.viet.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    private String id;
    private String username;
    private String fullName;
    private String action;
    private String targetTable;
    private String targetId;
    private String oldValue;
    private String newValue;
    private String clientIp;
    private String userAgent;
    private LocalDateTime createdAt;
}
