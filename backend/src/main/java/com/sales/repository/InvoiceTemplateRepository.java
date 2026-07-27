package com.sales.repository;

import com.sales.entity.InvoiceTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceTemplateRepository extends JpaRepository<InvoiceTemplate, String> {
    Optional<InvoiceTemplate> findByHouseholdId(String householdId);
}
