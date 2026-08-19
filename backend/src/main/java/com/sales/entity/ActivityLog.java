package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "sequence_number", insertable = false, updatable = false)
    private Long sequenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "target_table", nullable = false, length = 100)
    private String targetTable;

    @Column(name = "target_id", length = 36)
    private String targetId;

    @Column(name = "old_value", columnDefinition = "JSON")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "JSON")
    private String newValue;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "hash", nullable = false, length = 64)
    private String hash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void ensureHash() {
        if (this.hash == null) {
            String prev = this.previousHash != null ? this.previousHash : "0000000000000000000000000000000000000000000000000000000000000000";
            String hhId = this.household != null ? this.household.getId() : "";
            String uId = this.user != null ? this.user.getId() : "";
            String act = this.action != null ? this.action : "";
            String tbl = this.targetTable != null ? this.targetTable : "";
            String tId = this.targetId != null ? this.targetId : "";
            String oldV = this.oldValue != null ? this.oldValue : "";
            String newV = this.newValue != null ? this.newValue : "";
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                String raw = prev + "|" + hhId + "|" + uId + "|" + act + "|" + tbl + "|" + tId + "|" + oldV + "|" + newV;
                byte[] hashBytes = digest.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                this.hash = java.util.HexFormat.of().formatHex(hashBytes);
            } catch (Exception e) {
                this.hash = prev;
            }
        }
    }
}
