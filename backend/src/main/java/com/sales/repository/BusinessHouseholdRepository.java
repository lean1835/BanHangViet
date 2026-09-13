package com.sales.repository;

import com.sales.entity.BusinessHousehold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessHouseholdRepository extends JpaRepository<BusinessHousehold, String> {
    boolean existsByTaxCode(String taxCode);
    boolean existsByTaxCodeAndIdNot(String taxCode, String id);
    Optional<BusinessHousehold> findByTaxCode(String taxCode);

    org.springframework.data.domain.Page<BusinessHousehold> findByStatus(
            com.sales.constant.HouseholdStatus status,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<BusinessHousehold> findByNameContainingIgnoreCaseOrTaxCodeContainingIgnoreCase(
            String name, String taxCode,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<BusinessHousehold> findByNameContainingIgnoreCaseOrTaxCodeContainingIgnoreCaseAndStatus(
            String name, String taxCode, com.sales.constant.HouseholdStatus status,
            org.springframework.data.domain.Pageable pageable);
}
