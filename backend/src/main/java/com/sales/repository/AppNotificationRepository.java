package com.sales.repository;

import com.sales.entity.AppNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, String> {

    Page<AppNotification> findByHouseholdIdOrderByCreatedAtDesc(String householdId, Pageable pageable);

    long countByHouseholdIdAndIsReadFalse(String householdId);

    Optional<AppNotification> findByIdAndHouseholdId(String id, String householdId);

    @Query("SELECT COUNT(n) > 0 FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.notificationType = :notificationType " +
           "AND ((n.createdAt BETWEEN :startDateTime AND :endDateTime) OR (n.metadata LIKE :yearPattern))")
    boolean existsNotificationInYear(
            @Param("householdId") String householdId,
            @Param("notificationType") String notificationType,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("yearPattern") String yearPattern
    );

    java.util.List<AppNotification> findByHouseholdIdAndTargetTypeAndTargetId(String householdId, String targetType, String targetId);

    java.util.List<AppNotification> findByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(String householdId, String targetType, String targetId);

    Optional<AppNotification> findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
            String householdId, String targetType, String targetId, String notificationType);

    java.util.List<AppNotification> findByHouseholdIdAndTargetTypeAndIsClosedFalse(String householdId, String targetType);

    java.util.List<AppNotification> findByHouseholdIdAndIsClosedFalseOrderByCreatedAtDesc(String householdId);
}
