package com.sales.repository;

import com.sales.entity.BusinessHouseholdSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessHouseholdSettingsRepository extends JpaRepository<BusinessHouseholdSettings, String> {

    Optional<BusinessHouseholdSettings> findByHouseholdId(String householdId);
}
