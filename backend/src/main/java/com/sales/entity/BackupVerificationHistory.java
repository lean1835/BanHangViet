package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_verification_histories", indexes = {
        @Index(name = "idx_bvh_household_verified", columnList = "household_id, verified_at"),
        @Index(name = "idx_bvh_household_status", columnList = "household_id, status"),
        @Index(name = "idx_bvh_backup_id", columnList = "backup_history_id")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class BackupVerificationHistory {

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
    @JoinColumn(name = "backup_history_id", nullable = false)
    @ToString.Exclude
    private BackupHistory backupHistory;

    @Column(name = "backup_file_name", nullable = false, length = 255)
    private String backupFileName;

    @Column(name = "backup_time", nullable = false)
    private LocalDateTime backupTime;

    @Column(name = "file_size", nullable = false)
    @Builder.Default
    private Long fileSize = 0L;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PASSED"; // PASSED, FAILED

    @Column(name = "execution_duration_ms", nullable = false)
    @Builder.Default
    private Long executionDurationMs = 0L;

    @Column(name = "verified_at", nullable = false)
    @Builder.Default
    private LocalDateTime verifiedAt = LocalDateTime.now();

    @Column(name = "checked_file_readable", nullable = false)
    @Builder.Default
    private Boolean checkedFileReadable = false;

    @Column(name = "checked_record_counts_matched", nullable = false)
    @Builder.Default
    private Boolean checkedRecordCountsMatched = false;

    @Column(name = "checked_audit_chain_intact", nullable = false)
    @Builder.Default
    private Boolean checkedAuditChainIntact = false;

    @Column(name = "product_count", nullable = false)
    @Builder.Default
    private Integer productCount = 0;

    @Column(name = "customer_count", nullable = false)
    @Builder.Default
    private Integer customerCount = 0;

    @Column(name = "supplier_count", nullable = false)
    @Builder.Default
    private Integer supplierCount = 0;

    @Column(name = "user_count", nullable = false)
    @Builder.Default
    private Integer userCount = 0;

    @Column(name = "audit_log_count", nullable = false)
    @Builder.Default
    private Integer auditLogCount = 0;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "trigger_type", nullable = false, length = 20)
    @Builder.Default
    private String triggerType = "AUTOMATIC"; // AUTOMATIC, MANUAL

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
