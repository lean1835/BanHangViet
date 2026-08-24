package com.sales.repository;

import com.sales.entity.ProductGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductGroupRepository extends JpaRepository<ProductGroup, String> {
    Optional<ProductGroup> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);
    
    @EntityGraph(attributePaths = {"household"})
    List<ProductGroup> findByHouseholdIdAndDeletedAtIsNull(String householdId);

    List<ProductGroup> findAllByIdInAndHouseholdIdAndDeletedAtIsNull(Collection<String> ids, String householdId);

    boolean existsByHouseholdIdAndNameAndDeletedAtIsNull(String householdId, String name);

    boolean existsByHouseholdIdAndNameAndIdNotAndDeletedAtIsNull(String householdId, String name, String id);

    Optional<ProductGroup> findByHouseholdIdAndNameAndDeletedAtIsNull(String householdId, String name);
}
