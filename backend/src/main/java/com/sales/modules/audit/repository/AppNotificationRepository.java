package com.sales.modules.audit.repository;
import com.sales.modules.audit.entity.AppNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, String>, JpaSpecificationExecutor<AppNotification> {
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

    List<AppNotification> findByHouseholdIdAndTargetTypeAndTargetId(String householdId, String targetType, String targetId);

    List<AppNotification> findByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(String householdId, String targetType, String targetId);

    List<AppNotification> findByTargetTypeAndTargetIdAndIsClosedFalse(String targetType, String targetId);

    List<AppNotification> findByTargetTypeAndTargetIdInAndIsClosedFalse(String targetType, Collection<String> targetIds);

    boolean existsByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(String householdId, String targetType, String targetId);

    boolean existsByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
            String householdId, String targetType, String targetId, String notificationType);

    Optional<AppNotification> findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
            String householdId, String targetType, String targetId, String notificationType);

    List<AppNotification> findByHouseholdIdAndTargetTypeAndIsClosedFalse(String householdId, String targetType);

    List<AppNotification> findByHouseholdIdAndIsClosedFalseOrderByCreatedAtDesc(String householdId);

    List<AppNotification> findByHouseholdIdAndIsReadFalseAndIsClosedFalseAndCreatedAtGreaterThanEqual(
            String householdId, LocalDateTime threshold);

    @Query("SELECT COUNT(n) FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.isClosed = false " +
           "AND n.isRead = false " +
           "AND n.createdAt >= :threshold " +
           "AND (:disabledCount = 0 OR n.notificationType NOT IN :disabledTypes)")
    long countHouseholdUnread(
            @Param("householdId") String householdId,
            @Param("disabledTypes") Collection<String> disabledTypes,
            @Param("disabledCount") int disabledCount,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT COUNT(n) FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.isClosed = false " +
           "AND n.createdAt >= :threshold " +
           "AND (:disabledCount = 0 OR n.notificationType NOT IN :disabledTypes)")
    long countHouseholdUnclosed(
            @Param("householdId") String householdId,
            @Param("disabledTypes") Collection<String> disabledTypes,
            @Param("disabledCount") int disabledCount,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT COUNT(n) FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.isClosed = false " +
           "AND n.severity = :severity " +
           "AND n.createdAt >= :threshold " +
           "AND (:disabledCount = 0 OR n.notificationType NOT IN :disabledTypes)")
    long countHouseholdBySeverity(
            @Param("householdId") String householdId,
            @Param("disabledTypes") Collection<String> disabledTypes,
            @Param("disabledCount") int disabledCount,
            @Param("severity") String severity,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT COUNT(n) FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.isClosed = false " +
           "AND n.isRead = false " +
           "AND n.createdAt >= :threshold " +
           "AND n.notificationType IN :allowedTypes " +
           "AND (n.user.id = :userId OR n.user IS NULL)")
    long countCashierUnread(
            @Param("householdId") String householdId,
            @Param("userId") String userId,
            @Param("allowedTypes") Collection<String> allowedTypes,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT COUNT(n) FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.isClosed = false " +
           "AND n.createdAt >= :threshold " +
           "AND n.notificationType IN :allowedTypes " +
           "AND (n.user.id = :userId OR n.user IS NULL)")
    long countCashierUnclosed(
            @Param("householdId") String householdId,
            @Param("userId") String userId,
            @Param("allowedTypes") Collection<String> allowedTypes,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT COUNT(n) FROM AppNotification n " +
           "WHERE n.household.id = :householdId " +
           "AND n.isClosed = false " +
           "AND n.severity = :severity " +
           "AND n.createdAt >= :threshold " +
           "AND n.notificationType IN :allowedTypes " +
           "AND (n.user.id = :userId OR n.user IS NULL)")
    long countCashierBySeverity(
            @Param("householdId") String householdId,
            @Param("userId") String userId,
            @Param("allowedTypes") Collection<String> allowedTypes,
            @Param("severity") String severity,
            @Param("threshold") LocalDateTime threshold
    );

    @Modifying
    @Query("DELETE FROM AppNotification n WHERE n.createdAt < :cutoffDate")
    long deleteByCreatedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);
}
