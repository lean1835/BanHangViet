package com.sales.modules.customer.repository;
import com.sales.modules.customer.entity.LoyaltyProgramConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyProgramConfigRepository extends JpaRepository<LoyaltyProgramConfig, String> {
    Optional<LoyaltyProgramConfig> findByHouseholdId(String householdId);
}
