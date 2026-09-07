package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionResponse {

    private String id;
    private String userId;
    private String username;
    private String fullName;
    private String roleCode;
    private String roleName;
    private String deviceType;
    private String deviceName;
    private String ipAddress;
    private LocalDateTime loginAt;
    private LocalDateTime lastActiveAt;
    private LocalDateTime expiresAt;
    private Boolean isRevoked;
    private LocalDateTime revokedAt;
    private String revokeReason;
    private Boolean isCurrentSession;
}
