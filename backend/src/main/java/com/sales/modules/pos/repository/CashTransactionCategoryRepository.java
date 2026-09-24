package com.sales.modules.pos.repository;
import com.sales.common.constant.CashTransactionType;
import com.sales.modules.pos.entity.CashTransactionCategory;
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
