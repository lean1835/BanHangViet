package com.sales.modules.platform.repository;
import com.sales.modules.platform.entity.PlatformSystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PlatformSystemLogRepository extends JpaRepository<PlatformSystemLog, String>, JpaSpecificationExecutor<PlatformSystemLog> {

    long countByEventTypeAndCreatedAtAfter(String eventType, LocalDateTime after);

    @Query("SELECT COUNT(DISTINCT p.household.id) FROM PlatformSystemLog p " +
           "WHERE p.eventType = :eventType AND p.createdAt >= :after AND p.household IS NOT NULL")
    long countDistinctHouseholdsByEventTypeAndCreatedAtAfter(
            @Param("eventType") String eventType,
            @Param("after") LocalDateTime after);

    List<PlatformSystemLog> findByIncidentIdOrderByCreatedAtDesc(String incidentId);
}
