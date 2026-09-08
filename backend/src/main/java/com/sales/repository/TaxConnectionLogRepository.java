package com.sales.repository;

import com.sales.entity.TaxConnectionLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaxConnectionLogRepository extends JpaRepository<TaxConnectionLog, String> {

    @Query("SELECT l FROM TaxConnectionLog l WHERE " +
           "(:householdId IS NOT NULL AND l.household.id = :householdId) OR " +
           "(:householdId IS NULL AND l.household IS NULL) " +
           "AND l.createdAt >= :fromDate ORDER BY l.createdAt DESC")
    List<TaxConnectionLog> findLogsByHouseholdAndDateAfter(@Param("householdId") String householdId,
                                                          @Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT l FROM TaxConnectionLog l WHERE " +
           "(:householdId IS NOT NULL AND l.household.id = :householdId) OR " +
           "(:householdId IS NULL AND l.household IS NULL) " +
           "ORDER BY l.createdAt DESC")
    List<TaxConnectionLog> findLatestLogByHousehold(@Param("householdId") String householdId, Pageable pageable);

    Optional<TaxConnectionLog> findFirstByHouseholdIdOrderByCreatedAtDesc(String householdId);

    List<TaxConnectionLog> findTop2ByHouseholdIdOrderByCreatedAtDesc(String householdId);

    Optional<TaxConnectionLog> findFirstByHouseholdIdAndLastSuccessfulResponseAtIsNotNullOrderByCreatedAtDesc(String householdId);
}
