package com.viet.sales.repository;

import com.viet.sales.entity.Product;
import com.viet.sales.entity.ProductGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Collection;
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

    @EntityGraph(attributePaths = {"group", "taxRate", "household"})
    List<Product> findAllByIdInAndHouseholdIdAndDeletedAtIsNull(Collection<String> ids, String householdId);

    @Override
    @EntityGraph(attributePaths = {"group", "taxRate", "household"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @Query("SELECT p.id FROM Product p WHERE p.group.id = :groupId AND p.deletedAt IS NULL")
    List<String> findProductIdsByGroupIdAndDeletedAtIsNull(@Param("groupId") String groupId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Product p SET p.group = null, p.updatedAt = :updatedAt WHERE p.group.id = :groupId AND p.deletedAt IS NULL")
    void clearGroupId(@Param("groupId") String groupId, @Param("updatedAt") LocalDateTime updatedAt);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Product p SET p.group = null, p.updatedAt = :updatedAt WHERE p.id IN :ids AND p.household.id = :householdId AND p.deletedAt IS NULL")
    void clearGroupIdForProducts(@Param("ids") Collection<String> ids, @Param("householdId") String householdId, @Param("updatedAt") LocalDateTime updatedAt);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Product p SET p.group = :group, p.updatedAt = :updatedAt WHERE p.id IN :ids AND p.household.id = :householdId AND p.deletedAt IS NULL")
    int updateGroupIdForProducts(@Param("group") ProductGroup group, @Param("ids") Collection<String> ids, @Param("householdId") String householdId, @Param("updatedAt") LocalDateTime updatedAt);

    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity WHERE p.id = :id AND p.household.id = :householdId AND p.deletedAt IS NULL")
    int deductStock(@Param("id") String id, @Param("householdId") String householdId, @Param("quantity") java.math.BigDecimal quantity);

    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity + :quantity WHERE p.id = :id AND p.household.id = :householdId AND p.deletedAt IS NULL")
    int addStock(@Param("id") String id, @Param("householdId") String householdId, @Param("quantity") java.math.BigDecimal quantity);
}

