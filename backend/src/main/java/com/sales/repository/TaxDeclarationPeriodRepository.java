package com.sales.repository;

import com.sales.entity.TaxDeclarationPeriod;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxDeclarationPeriodRepository extends JpaRepository<TaxDeclarationPeriod, String> {

    @EntityGraph(attributePaths = {"household", "createdByUser", "lockedByUser"})
    Optional<TaxDeclarationPeriod> findByHouseholdIdAndPeriodTypeAndYearAndPeriodNumber(
            String householdId, String periodType, Integer year, Integer periodNumber
    );

    @EntityGraph(attributePaths = {"household", "createdByUser", "lockedByUser"})
    Optional<TaxDeclarationPeriod> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"household", "createdByUser", "lockedByUser"})
    List<TaxDeclarationPeriod> findByHouseholdIdOrderByYearDescPeriodNumberDesc(String householdId);
}
