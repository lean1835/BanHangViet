package com.sales.repository;

import com.sales.entity.LoyaltyProgramConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyProgramConfigRepository extends JpaRepository<LoyaltyProgramConfig, String> {
    Optional<LoyaltyProgramConfig> findByHouseholdId(String householdId);
}
