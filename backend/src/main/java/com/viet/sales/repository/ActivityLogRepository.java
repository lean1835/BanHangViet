package com.viet.sales.repository;

import com.viet.sales.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {

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
}
