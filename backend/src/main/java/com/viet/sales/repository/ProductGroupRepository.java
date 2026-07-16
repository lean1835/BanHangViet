package com.viet.sales.repository;

import com.viet.sales.entity.ProductGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductGroupRepository extends JpaRepository<ProductGroup, String> {
    Optional<ProductGroup> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);
    
    List<ProductGroup> findByHouseholdIdAndDeletedAtIsNull(String householdId);

    boolean existsByHouseholdIdAndNameAndDeletedAtIsNull(String householdId, String name);

    boolean existsByHouseholdIdAndNameAndIdNotAndDeletedAtIsNull(String householdId, String name, String id);
}
