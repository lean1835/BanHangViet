package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_notifications", indexes = {
        @Index(name = "idx_notif_household_created", columnList = "household_id, created_at"),
        @Index(name = "idx_notif_household_type", columnList = "household_id, notification_type"),
        @Index(name = "idx_notif_household_unread", columnList = "household_id, is_read"),
        @Index(name = "idx_notif_target", columnList = "household_id, target_type, target_id"),
        @Index(name = "idx_notif_closed", columnList = "household_id, is_closed")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    private User user;

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "WARNING"; // INFO, WARNING, DANGER

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    @Column(name = "target_type", length = 50)
    private String targetType; // TAX_PERIOD, REVENUE_WARNING...

    @Column(name = "target_id", length = 36)
    private String targetId; // period_id...

    @Column(columnDefinition = "JSON")
    private String metadata;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_closed", nullable = false)
    @Builder.Default
    private Boolean isClosed = false;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
