package com.viet.sales.repository;

import com.viet.sales.entity.BusinessHousehold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessHouseholdRepository extends JpaRepository<BusinessHousehold, String> {
    boolean existsByTaxCode(String taxCode);
    boolean existsByTaxCodeAndIdNot(String taxCode, String id);
    Optional<BusinessHousehold> findByTaxCode(String taxCode);
}
