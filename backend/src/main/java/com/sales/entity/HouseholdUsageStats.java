package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "household_usage_stats", indexes = {
    @Index(name = "idx_household_usage_month", columnList = "household_id, month_year")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_household_month_usage", columnNames = {"household_id", "month_year"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdUsageStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private BusinessHousehold household;

    @Column(name = "month_year", nullable = false, length = 7) // Format: 'YYYY-MM', e.g. '2026-09'
    private String monthYear;

    @Column(name = "current_users_count", nullable = false)
    @Builder.Default
    private Integer currentUsersCount = 0;

    @Column(name = "current_pos_count", nullable = false)
    @Builder.Default
    private Integer currentPosCount = 0;

    @Column(name = "invoices_issued_count", nullable = false)
    @Builder.Default
    private Integer invoicesIssuedCount = 0;

    @Column(name = "is_invoice_over_quota", nullable = false)
    @Builder.Default
    private Boolean isInvoiceOverQuota = false;

    @Column(name = "over_quota_invoice_count", nullable = false)
    @Builder.Default
    private Integer overQuotaInvoiceCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
