package com.sales.repository;

import com.sales.entity.SyncSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SyncSessionRepository extends JpaRepository<SyncSession, String> {

    @EntityGraph(attributePaths = {"user", "household"})
    Optional<SyncSession> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"user", "household", "details"})
    Optional<SyncSession> findWithDetailsByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT s FROM SyncSession s WHERE s.household.id = :householdId " +
           "AND (:userId IS NULL OR s.user.id = :userId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:fromDate IS NULL OR s.syncedAt >= :fromDate) " +
           "AND (:toDate IS NULL OR s.syncedAt <= :toDate) " +
           "ORDER BY s.syncedAt DESC")
    Page<SyncSession> findFiltered(
            @Param("householdId") String householdId,
            @Param("userId") String userId,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    long countByHouseholdIdAndStatus(String householdId, String status);

    long countByHouseholdId(String householdId);

    @Query("SELECT COUNT(s) FROM SyncSession s WHERE s.household.id = :householdId " +
           "AND (:userId IS NULL OR s.user.id = :userId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:fromDate IS NULL OR s.syncedAt >= :fromDate) " +
           "AND (:toDate IS NULL OR s.syncedAt <= :toDate)")
    long countFiltered(
            @Param("householdId") String householdId,
            @Param("userId") String userId,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    @Query("SELECT COALESCE(SUM(s.totalReceived), 0) FROM SyncSession s WHERE s.household.id = :householdId " +
           "AND (:userId IS NULL OR s.user.id = :userId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:fromDate IS NULL OR s.syncedAt >= :fromDate) " +
           "AND (:toDate IS NULL OR s.syncedAt <= :toDate)")
    long sumTotalReceivedFiltered(
            @Param("householdId") String householdId,
            @Param("userId") String userId,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );
}
