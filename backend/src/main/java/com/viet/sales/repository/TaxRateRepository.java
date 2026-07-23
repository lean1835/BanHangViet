package com.viet.sales.repository;

import com.viet.sales.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, String> {
    Optional<TaxRate> findByIdAndHouseholdIdAndIsActiveTrue(String id, String householdId);
    Optional<TaxRate> findByIdAndHouseholdId(String id, String householdId);
    List<TaxRate> findByHouseholdIdOrderByCreatedAtDesc(String householdId);
    boolean existsByHouseholdIdAndName(String householdId, String name);
    boolean existsByHouseholdIdAndNameAndIdNot(String householdId, String name, String id);
}
