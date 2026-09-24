package com.sales.modules.platform.entity;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.common.constant.PlatformLogSeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_system_logs", indexes = {
    @Index(name = "idx_platform_logs_severity_created", columnList = "severity, created_at"),
    @Index(name = "idx_platform_logs_household", columnList = "household_id, created_at"),
    @Index(name = "idx_platform_logs_event_type", columnList = "event_type, created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlatformLogSeverity severity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    private BusinessHousehold household;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(columnDefinition = "JSON")
    private String metadata; // Technical metrics: { "responseTimeMs": 4200, "queueCount": 55, ... }

    @Column(name = "is_widespread_incident", nullable = false)
    @Builder.Default
    private Boolean isWidespreadIncident = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private PlatformIncident incident;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
