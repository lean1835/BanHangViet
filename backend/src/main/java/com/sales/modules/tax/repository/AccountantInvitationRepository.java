package com.sales.modules.tax.repository;
import com.sales.common.constant.AccountantInvitationStatus;
import com.sales.modules.tax.entity.AccountantInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface AccountantInvitationRepository extends JpaRepository<AccountantInvitation, String> {
    @EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    Optional<AccountantInvitation> findByInvitationToken(String invitationToken);

    @EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    List<AccountantInvitation> findByHouseholdIdOrderByCreatedAtDesc(String householdId);

    @EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    List<AccountantInvitation> findByAccountantPhoneAndStatus(String accountantPhone, AccountantInvitationStatus status);

    @EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    List<AccountantInvitation> findByAccountantEmailAndStatus(String accountantEmail, AccountantInvitationStatus status);

    List<AccountantInvitation> findByStatusAndInvitationExpiresAtBefore(AccountantInvitationStatus status, LocalDateTime now);
}
