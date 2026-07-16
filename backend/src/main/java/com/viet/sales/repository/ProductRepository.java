package com.viet.sales.repository;

import com.viet.sales.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    boolean existsBySkuAndHouseholdIdAndDeletedAtIsNull(String sku, String householdId);

    boolean existsBySkuAndHouseholdIdAndIdNotAndDeletedAtIsNull(String sku, String householdId, String id);

    @EntityGraph(attributePaths = {"group", "taxRate", "household"})
    Optional<Product> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    @EntityGraph(attributePaths = {"group", "taxRate", "household"})
    List<Product> findByGroupIdAndDeletedAtIsNull(String groupId);

    @Override
    @EntityGraph(attributePaths = {"group", "taxRate", "household"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);
}
