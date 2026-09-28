package com.sales.modules.tax.repository;
import com.sales.modules.tax.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, String> {
    Optional<TaxRate> findByIdAndHouseholdIdAndIsActiveTrue(String id, String householdId);
    List<TaxRate> findByHouseholdIdAndIsActiveTrue(String householdId);
    List<TaxRate> findByHouseholdIdAndIsActiveTrueOrderByCreatedAtAsc(String householdId);
    Optional<TaxRate> findByIdAndHouseholdId(String id, String householdId);
    List<TaxRate> findByHouseholdIdOrderByCreatedAtDesc(String householdId);
    boolean existsByHouseholdIdAndName(String householdId, String name);
    boolean existsByHouseholdIdAndNameAndIdNot(String householdId, String name, String id);
    boolean existsByHouseholdIdAndIsActiveTrue(String householdId);
}
