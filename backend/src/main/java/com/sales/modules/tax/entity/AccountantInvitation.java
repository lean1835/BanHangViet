package com.sales.modules.tax.entity;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.common.constant.AccountantInvitationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "accountant_invitations", indexes = {
    @Index(name = "idx_accountant_invitations_phone", columnList = "accountant_phone, status"),
    @Index(name = "idx_accountant_invitations_token", columnList = "invitation_token")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountantInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private BusinessHousehold household;

    @Column(name = "invitation_token", nullable = false, unique = true, length = 100)
    private String invitationToken;

    @Column(name = "accountant_phone", nullable = false, length = 20)
    private String accountantPhone;

    @Column(name = "accountant_email", length = 100)
    private String accountantEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private User invitedByUser;

    @Column(name = "access_duration_days", nullable = false)
    @Builder.Default
    private Integer accessDurationDays = 30;

    @Column(name = "scope_permissions", nullable = false, columnDefinition = "JSON")
    private String scopePermissions; // JSON array, e.g. ["INVOICE", "REPORT", "TAX_DECLARATION"]

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccountantInvitationStatus status = AccountantInvitationStatus.PENDING;

    @Column(name = "invitation_expires_at", nullable = false)
    private LocalDateTime invitationExpiresAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by_user_id")
    private User acceptedByUser;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
