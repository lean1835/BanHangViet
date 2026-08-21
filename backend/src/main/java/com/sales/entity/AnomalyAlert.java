package com.sales.entity;

import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "anomaly_alerts", indexes = {
        @Index(name = "idx_anomaly_alerts_household_detected", columnList = "household_id, detected_at"),
        @Index(name = "idx_anomaly_alerts_household_status", columnList = "household_id, status"),
        @Index(name = "idx_anomaly_alerts_actor", columnList = "actor_user_id")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AnomalyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 50)
    private AnomalyAlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private AnomalySeverity severity = AnomalySeverity.WARNING;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    @ToString.Exclude
    private User actorUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AnomalyAlertStatus status = AnomalyAlertStatus.PENDING;

    @Column(name = "evidence_data", columnDefinition = "JSON")
    private String evidenceData;

    @Column(name = "detected_at", nullable = false)
    @Builder.Default
    private LocalDateTime detectedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    @ToString.Exclude
    private User reviewedByUser;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
