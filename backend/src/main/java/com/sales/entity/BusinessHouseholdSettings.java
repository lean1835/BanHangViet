package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "business_household_settings")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class BusinessHouseholdSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "auto_retry_enabled", nullable = false)
    @Builder.Default
    private Boolean autoRetryEnabled = true;

    @Column(name = "max_retry_attempts", nullable = false)
    @Builder.Default
    private Integer maxRetryAttempts = 3;

    @Column(name = "retry_interval_minutes", nullable = false)
    @Builder.Default
    private Integer retryIntervalMinutes = 15;

    @Column(name = "max_retry_hours_deadline", nullable = false)
    @Builder.Default
    private Integer maxRetryHoursDeadline = 24;

    @Column(name = "max_order_holding_hours", nullable = false)
    @Builder.Default
    private Integer maxOrderHoldingHours = 4;

    @Column(name = "bank_transfer_timeout_minutes", nullable = false)
    @Builder.Default
    private Integer bankTransferTimeoutMinutes = 15;

    @Column(name = "expense_approval_threshold", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private java.math.BigDecimal expenseApprovalThreshold = new java.math.BigDecimal("500000.00");

    @Column(name = "revenue_warning_threshold_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private java.math.BigDecimal revenueWarningThresholdPercentage = new java.math.BigDecimal("80.00");

    @Column(name = "tax_period_type", nullable = false, length = 20)
    @Builder.Default
    private String taxPeriodType = "QUARTERLY"; // MONTHLY, QUARTERLY

    @Column(name = "tax_reminder_days_before", nullable = false)
    @Builder.Default
    private Integer taxReminderDaysBefore = 5;

    @Column(name = "tax_reminder_enabled", nullable = false)
    @Builder.Default
    private Boolean taxReminderEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
