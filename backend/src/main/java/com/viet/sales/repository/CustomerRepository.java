package com.viet.sales.repository;

import com.viet.sales.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);
    Optional<Customer> findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull(String phoneNumber, String householdId);
    List<Customer> findAllByHouseholdIdAndDeletedAtIsNull(String householdId);
}
