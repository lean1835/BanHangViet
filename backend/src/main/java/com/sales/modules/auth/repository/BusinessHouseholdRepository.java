package com.sales.modules.auth.repository;
import com.sales.modules.auth.entity.BusinessHousehold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessHouseholdRepository extends JpaRepository<BusinessHousehold, String> {
    boolean existsByTaxCode(String taxCode);
    boolean existsByTaxCodeAndIdNot(String taxCode, String id);
    Optional<BusinessHousehold> findByTaxCode(String taxCode);

    org.springframework.data.domain.Page<BusinessHousehold> findByStatus(
            com.sales.common.constant.HouseholdStatus status,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<BusinessHousehold> findByNameContainingIgnoreCaseOrTaxCodeContainingIgnoreCase(
            String name, String taxCode,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT h FROM BusinessHousehold h WHERE " +
            "(LOWER(h.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(h.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND h.status = :status")
    org.springframework.data.domain.Page<BusinessHousehold> searchByNameOrTaxCodeAndStatus(
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("status") com.sales.common.constant.HouseholdStatus status,
            org.springframework.data.domain.Pageable pageable);
}
