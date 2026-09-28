package com.sales.modules.platform.repository;
import com.sales.modules.platform.entity.HouseholdUsageStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

@Repository
public interface HouseholdUsageStatsRepository extends JpaRepository<HouseholdUsageStats, String> {
    Optional<HouseholdUsageStats> findByHouseholdIdAndMonthYear(String householdId, String monthYear);

    List<HouseholdUsageStats> findByHouseholdIdInAndMonthYear(Collection<String> householdIds, String monthYear);
}
