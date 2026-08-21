package com.sales.repository;

import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalySeverity;
import com.sales.entity.AnomalyAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnomalyAlertRepository extends JpaRepository<AnomalyAlert, String>, JpaSpecificationExecutor<AnomalyAlert> {

    @Override
    @EntityGraph(attributePaths = {"household", "actorUser", "reviewedByUser"})
    Page<AnomalyAlert> findAll(Specification<AnomalyAlert> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"household", "actorUser", "reviewedByUser"})
    Optional<AnomalyAlert> findByIdAndHouseholdId(String id, String householdId);

    @Override
    @EntityGraph(attributePaths = {"household", "actorUser", "reviewedByUser"})
    Optional<AnomalyAlert> findById(String id);

    long countByHouseholdId(String householdId);

    long countByHouseholdIdAndStatus(String householdId, AnomalyAlertStatus status);

    long countByHouseholdIdAndSeverity(String householdId, AnomalySeverity severity);

    long countByHouseholdIdAndStatusAndSeverity(String householdId, AnomalyAlertStatus status, AnomalySeverity severity);

    long countByHouseholdIdAndDetectedAtBetween(String householdId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(a) FROM AnomalyAlert a WHERE (:householdId IS NULL OR a.household.id = :householdId) AND a.detectedAt BETWEEN :start AND :end")
    long countAnomaliesInDateRange(@Param("householdId") String householdId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"household", "actorUser", "reviewedByUser"})
    List<AnomalyAlert> findByHouseholdIdAndDetectedAtBetweenOrderByDetectedAtDesc(String householdId, LocalDateTime start, LocalDateTime end);

    boolean existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween(
            String householdId,
            com.sales.constant.AnomalyAlertType alertType,
            String actorUserId,
            LocalDateTime start,
            LocalDateTime end
    );
}
