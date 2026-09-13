package com.sales.entity;

import com.sales.constant.IncidentStatus;
import com.sales.constant.PlatformLogSeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_incidents", indexes = {
    @Index(name = "idx_platform_incidents_status", columnList = "status, severity")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlatformLogSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private IncidentStatus status = IncidentStatus.INVESTIGATING;

    @Column(name = "affected_households_count", nullable = false)
    @Builder.Default
    private Integer affectedHouseholdsCount = 0;

    @Column(name = "error_threshold_count", nullable = false)
    @Builder.Default
    private Integer errorThresholdCount = 5;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
