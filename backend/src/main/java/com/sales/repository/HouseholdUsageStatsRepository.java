package com.sales.repository;

import com.sales.entity.HouseholdUsageStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HouseholdUsageStatsRepository extends JpaRepository<HouseholdUsageStats, String> {

    Optional<HouseholdUsageStats> findByHouseholdIdAndMonthYear(String householdId, String monthYear);
}
