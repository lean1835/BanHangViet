package com.viet.sales.repository;

import com.viet.sales.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {

    @org.springframework.data.jpa.repository.Query("SELECT a FROM ActivityLog a " +
            "WHERE a.household.id = :householdId " +
            "AND (:username IS NULL OR a.user.username = :username) " +
            "AND (a.createdAt BETWEEN :start AND :end) " +
            "ORDER BY a.createdAt DESC")
    org.springframework.data.domain.Page<ActivityLog> findLogs(
            @org.springframework.data.repository.query.Param("householdId") String householdId,
            @org.springframework.data.repository.query.Param("username") String username,
            @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end,
            org.springframework.data.domain.Pageable pageable
    );
}
