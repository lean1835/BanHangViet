package com.sales.entity;

import com.sales.constant.BackupType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "restore_histories")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RestoreHistory {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restored_by_user_id")
    @ToString.Exclude
    private User restoredByUser;

    @Column(name = "backup_file_name", nullable = false, length = 255)
    private String backupFileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "backup_type", nullable = false, length = 20)
    @Builder.Default
    private BackupType backupType = BackupType.FULL;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "SUCCESS"; // SUCCESS, FAILED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "restored_at", nullable = false)
    private LocalDateTime restoredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
