package com.sales.modules.auth.repository;
import com.sales.modules.auth.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    @Modifying(flushAutomatically = true)
    @Query("UPDATE User u SET u.passwordHash = :passwordHash, u.passwordChangedAt = :passwordChangedAt, u.mustChangePassword = false WHERE u.id = :userId")
    int updatePassword(@Param("userId") String userId, @Param("passwordHash") String passwordHash, @Param("passwordChangedAt") LocalDateTime passwordChangedAt);
    boolean existsByUsername(String username);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = {"role"})
    List<User> findByHouseholdIdAndDeletedAtIsNull(String householdId);

    long countByHouseholdIdAndDeletedAtIsNull(String householdId);

    @EntityGraph(attributePaths = {"role"})
    List<User> findByHouseholdId(String householdId);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    @Query("SELECT u FROM User u WHERE u.household.id = :householdId AND u.role.code = :roleCode AND u.deletedAt IS NULL")
    List<User> findByHouseholdIdAndRoleCode(@Param("householdId") String householdId, @Param("roleCode") String roleCode);

    default Optional<User> findFirstByHouseholdIdAndRoleCode(String householdId, String roleCode) {
        List<User> users = findByHouseholdIdAndRoleCode(householdId, roleCode);
        return users.isEmpty() ? Optional.empty() : Optional.of(users.get(0));
    }

    boolean existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull(String householdId, String roleCode);

    @EntityGraph(attributePaths = {"role", "pointOfSale"})
    List<User> findByPointOfSaleIdAndDeletedAtIsNull(String pointOfSaleId);

    @EntityGraph(attributePaths = {"role", "pointOfSale"})
    List<User> findByHouseholdIdAndPointOfSaleIdAndDeletedAtIsNull(String householdId, String pointOfSaleId);

    long countByPointOfSaleIdAndDeletedAtIsNull(String pointOfSaleId);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    Optional<User> findByPhoneNumberAndDeletedAtIsNull(String phoneNumber);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    Optional<User> findFirstByRole_CodeAndDeletedAtIsNull(String roleCode);

    @EntityGraph(attributePaths = {"role", "household", "pointOfSale"})
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    @Query("SELECT u.household.id, COUNT(u.id) FROM User u WHERE u.household.id IN :householdIds AND u.deletedAt IS NULL GROUP BY u.household.id")
    List<Object[]> countUsersByHouseholdIds(@Param("householdIds") java.util.Collection<String> householdIds);
}
