package com.sales.modules.tax.entity;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.common.constant.AccountantAssignmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "household_accountant_assignments", indexes = {
    @Index(name = "idx_accountant_assignments_user", columnList = "accountant_user_id, status"),
    @Index(name = "idx_accountant_assignments_household", columnList = "household_id, status")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_household_accountant", columnNames = {"household_id", "accountant_user_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdAccountantAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accountant_user_id", nullable = false)
    private User accountantUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id")
    private AccountantInvitation invitation;

    @Column(name = "scope_permissions", nullable = false, columnDefinition = "JSON")
    private String scopePermissions; // JSON array, e.g. ["INVOICE", "REPORT", "TAX_DECLARATION"]

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccountantAssignmentStatus status = AccountantAssignmentStatus.ACTIVE;

    @Column(name = "access_expires_at", nullable = false)
    private LocalDateTime accessExpiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by_user_id")
    private User revokedByUser;

    @Column(name = "revoke_reason", length = 255)
    private String revokeReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
