package com.sales.modules.auth.repository;
import com.sales.modules.auth.entity.BusinessHousehold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import com.sales.common.constant.HouseholdStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface BusinessHouseholdRepository extends JpaRepository<BusinessHousehold, String> {
    boolean existsByTaxCode(String taxCode);
    boolean existsByTaxCodeAndIdNot(String taxCode, String id);
    Optional<BusinessHousehold> findByTaxCode(String taxCode);

    Page<BusinessHousehold> findByStatus(
            HouseholdStatus status,
            Pageable pageable);

    Page<BusinessHousehold> findByNameContainingIgnoreCaseOrTaxCodeContainingIgnoreCase(
            String name, String taxCode,
            Pageable pageable);

    @Query("SELECT h FROM BusinessHousehold h WHERE " +
            "(LOWER(h.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(h.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND h.status = :status")
    Page<BusinessHousehold> searchByNameOrTaxCodeAndStatus(
            @Param("keyword") String keyword,
            @Param("status") HouseholdStatus status,
            Pageable pageable);
}
