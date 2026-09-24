package com.sales.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "business_households")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessHousehold {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "tax_code", nullable = false, unique = true, length = 20)
    private String taxCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "representative_name", length = 100)
    private String representativeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private com.sales.common.constant.HouseholdStatus status = com.sales.common.constant.HouseholdStatus.ACTIVE;

    @Column(name = "lock_reason", columnDefinition = "TEXT")
    private String lockReason;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "locked_by_user_id", length = 36)
    private String lockedByUserId;

    @Column(name = "revenue_threshold_enabled", nullable = false)
    @Builder.Default
    private Boolean revenueThresholdEnabled = false;

    @Column(name = "offline_max_orders", nullable = false)
    @Builder.Default
    private Integer offlineMaxOrders = 50;

    @Column(name = "offline_max_hours", nullable = false)
    @Builder.Default
    private Integer offlineMaxHours = 24;

    @Column(name = "session_timeout_minutes", nullable = false)
    @Builder.Default
    private Integer sessionTimeoutMinutes = 60;

    @Column(name = "rounding_rule", nullable = false, length = 20)
    @Builder.Default
    private String roundingRule = "HALF_UP";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
