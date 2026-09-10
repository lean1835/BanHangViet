package com.sales.repository;

import com.sales.constant.CashTransactionType;
import com.sales.entity.CashTransactionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashTransactionCategoryRepository extends JpaRepository<CashTransactionCategory, String> {

    List<CashTransactionCategory> findByHouseholdIdAndDeletedAtIsNullOrderByNameAsc(String householdId);

    List<CashTransactionCategory> findByHouseholdIdAndDeletedAtIsNullAndIsActiveTrueOrderByNameAsc(String householdId);

    List<CashTransactionCategory> findByHouseholdIdAndTypeAndDeletedAtIsNullAndIsActiveTrueOrderByNameAsc(String householdId, CashTransactionType type);

    Optional<CashTransactionCategory> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    boolean existsByHouseholdIdAndNameAndTypeAndDeletedAtIsNull(String householdId, String name, CashTransactionType type);

    boolean existsByHouseholdIdAndNameAndTypeAndIdNotAndDeletedAtIsNull(String householdId, String name, CashTransactionType type, String id);
}
