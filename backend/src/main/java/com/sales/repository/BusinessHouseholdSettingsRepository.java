package com.sales.repository;

import com.sales.entity.BusinessHouseholdSettings;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessHouseholdSettingsRepository extends JpaRepository<BusinessHouseholdSettings, String> {

    Optional<BusinessHouseholdSettings> findByHouseholdId(String householdId);

    @EntityGraph(attributePaths = {"household"})
    List<BusinessHouseholdSettings> findByTaxReminderEnabledTrue();

    @Query("SELECT MAX(s.debtReminderDaysBefore) FROM BusinessHouseholdSettings s")
    Integer findMaxDebtReminderDaysBefore();
}

