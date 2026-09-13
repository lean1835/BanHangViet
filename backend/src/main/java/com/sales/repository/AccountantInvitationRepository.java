package com.sales.repository;

import com.sales.constant.AccountantInvitationStatus;
import com.sales.entity.AccountantInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountantInvitationRepository extends JpaRepository<AccountantInvitation, String> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    Optional<AccountantInvitation> findByInvitationToken(String invitationToken);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    List<AccountantInvitation> findByHouseholdIdOrderByCreatedAtDesc(String householdId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "invitedByUser", "acceptedByUser"})
    List<AccountantInvitation> findByAccountantPhoneAndStatus(String accountantPhone, AccountantInvitationStatus status);

    List<AccountantInvitation> findByStatusAndInvitationExpiresAtBefore(AccountantInvitationStatus status, LocalDateTime now);
}
