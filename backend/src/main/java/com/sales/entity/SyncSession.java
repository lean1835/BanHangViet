package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sync_sessions", indexes = {
    @Index(name = "idx_sync_session_household_synced", columnList = "household_id, synced_at DESC"),
    @Index(name = "idx_sync_session_household_user_status", columnList = "household_id, user_id, status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "session_code", length = 50, nullable = false, unique = true)
    private String sessionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Builder.Default
    @Column(name = "total_sent", nullable = false)
    private Integer totalSent = 0;

    @Builder.Default
    @Column(name = "total_received", nullable = false)
    private Integer totalReceived = 0;

    @Builder.Default
    @Column(name = "total_duplicated", nullable = false)
    private Integer totalDuplicated = 0;

    @Builder.Default
    @Column(name = "total_conflicted", nullable = false)
    private Integer totalConflicted = 0;

    @Builder.Default
    @Column(name = "total_failed", nullable = false)
    private Integer totalFailed = 0;

    @Column(nullable = false, length = 30)
    private String status; // MATCHED, DISCREPANCY

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "syncSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SyncSessionDetail> details = new ArrayList<>();
}
