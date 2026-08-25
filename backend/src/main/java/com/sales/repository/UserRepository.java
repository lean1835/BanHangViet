package com.sales.repository;

import com.sales.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = {"role"})
    List<User> findByHouseholdIdAndDeletedAtIsNull(String householdId);

    @EntityGraph(attributePaths = {"role"})
    List<User> findByHouseholdId(String householdId);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    @Query("SELECT u FROM User u WHERE u.household.id = :householdId AND u.role.code = :roleCode AND u.deletedAt IS NULL")
    Optional<User> findFirstByHouseholdIdAndRoleCode(@Param("householdId") String householdId, @Param("roleCode") String roleCode);

    @EntityGraph(attributePaths = {"role", "pointOfSale"})
    List<User> findByPointOfSaleIdAndDeletedAtIsNull(String pointOfSaleId);

    @EntityGraph(attributePaths = {"role", "pointOfSale"})
    List<User> findByHouseholdIdAndPointOfSaleIdAndDeletedAtIsNull(String householdId, String pointOfSaleId);

    long countByPointOfSaleIdAndDeletedAtIsNull(String pointOfSaleId);
}
