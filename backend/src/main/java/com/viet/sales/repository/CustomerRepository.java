package com.viet.sales.repository;

import com.viet.sales.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    List<Customer> findAllByIdInAndHouseholdIdAndDeletedAtIsNull(Collection<String> ids, String householdId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Customer c WHERE c.id = :id AND c.household.id = :householdId AND c.deletedAt IS NULL")
    Optional<Customer> findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(@Param("id") String id, @Param("householdId") String householdId);

    Optional<Customer> findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull(String phoneNumber, String householdId);
    List<Customer> findAllByHouseholdIdAndDeletedAtIsNull(String householdId);

    @Query("SELECT c FROM Customer c WHERE c.household.id = :householdId AND c.deletedAt IS NULL " +
           "AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR c.phoneNumber LIKE CONCAT('%', :query, '%'))")
    List<Customer> searchCustomers(@Param("householdId") String householdId, @Param("query") String query);
}
