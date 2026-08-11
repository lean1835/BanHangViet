package com.sales.repository;

import com.sales.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    Optional<Supplier> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    Optional<Supplier> findByHouseholdIdAndPhoneNumberAndDeletedAtIsNull(String householdId, String phoneNumber);

    boolean existsByHouseholdIdAndPhoneNumberAndDeletedAtIsNull(String householdId, String phoneNumber);

    boolean existsByHouseholdIdAndPhoneNumberAndIdNotAndDeletedAtIsNull(String householdId, String phoneNumber, String id);

    List<Supplier> findAllByHouseholdIdAndDeletedAtIsNull(String householdId);

    @Query("SELECT s FROM Supplier s WHERE s.household.id = :householdId AND s.deletedAt IS NULL " +
           "AND (LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR s.phoneNumber LIKE CONCAT('%', :query, '%'))")
    List<Supplier> searchSuppliers(@Param("householdId") String householdId, @Param("query") String query);
}
