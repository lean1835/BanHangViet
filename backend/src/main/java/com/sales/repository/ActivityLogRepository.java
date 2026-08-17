package com.sales.repository;

import com.sales.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {

    @EntityGraph(attributePaths = {"user", "household"})
    Optional<ActivityLog> findTopByHouseholdIdOrderBySequenceNumberDesc(String householdId);

    @EntityGraph(attributePaths = {"user", "household"})
    Optional<ActivityLog> findTopByOrderBySequenceNumberDesc();

    @EntityGraph(attributePaths = {"user", "household"})
    List<ActivityLog> findAllByHouseholdIdOrderBySequenceNumberAsc(String householdId);

    @EntityGraph(attributePaths = {"user", "household"})
    List<ActivityLog> findAllByOrderBySequenceNumberAsc();

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT a FROM ActivityLog a " +
            "WHERE a.household.id = :householdId " +
            "AND (:username IS NULL OR a.user.username = :username) " +
            "AND (a.createdAt BETWEEN :start AND :end) " +
            "ORDER BY a.createdAt DESC")
    Page<ActivityLog> findLogs(
            @Param("householdId") String householdId,
            @Param("username") String username,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user", "household"})
    @Query("SELECT a FROM ActivityLog a " +
            "WHERE (:householdId IS NULL OR a.household.id = :householdId) " +
            "AND (:username IS NULL OR LOWER(a.user.username) LIKE LOWER(CONCAT('%', :username, '%'))) " +
            "AND (:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
            "AND (:targetTable IS NULL OR LOWER(a.targetTable) LIKE LOWER(CONCAT('%', :targetTable, '%'))) " +
            "AND (:start IS NULL OR a.createdAt >= :start) " +
            "AND (:end IS NULL OR a.createdAt <= :end) " +
            "ORDER BY a.createdAt DESC, a.sequenceNumber DESC")
    Page<ActivityLog> findFilteredLogs(
            @Param("householdId") String householdId,
            @Param("username") String username,
            @Param("action") String action,
            @Param("targetTable") String targetTable,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );
}
