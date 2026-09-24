package com.sales.modules.tax.repository;
import com.sales.modules.tax.entity.TaxPurchaseRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxPurchaseRegisterRepository extends JpaRepository<TaxPurchaseRegister, String> {

    @EntityGraph(attributePaths = {"supplier", "product", "receipt"})
    List<TaxPurchaseRegister> findByPeriodIdOrderByReceiptDateAsc(String periodId);

    @EntityGraph(attributePaths = {"supplier", "product", "receipt"})
    Page<TaxPurchaseRegister> findByPeriodId(String periodId, Pageable pageable);

    @EntityGraph(attributePaths = {"supplier", "product", "receipt"})
    Page<TaxPurchaseRegister> findByPeriodIdAndIsSupplierMissing(String periodId, Boolean isSupplierMissing, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM TaxPurchaseRegister tpr WHERE tpr.period.id = :periodId")
    void deleteByPeriodId(@Param("periodId") String periodId);

    boolean existsByPeriodId(String periodId);

    long countByPeriodIdAndIsSupplierMissing(String periodId, Boolean isSupplierMissing);
}
