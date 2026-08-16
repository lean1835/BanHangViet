package com.sales.repository;

import com.sales.entity.TaxSalesRegister;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxSalesRegisterRepository extends JpaRepository<TaxSalesRegister, String> {

    @EntityGraph(attributePaths = {"invoice", "period"})
    Page<TaxSalesRegister> findByPeriodId(String periodId, Pageable pageable);

    @EntityGraph(attributePaths = {"invoice", "period"})
    List<TaxSalesRegister> findByPeriodId(String periodId);

    void deleteByPeriodId(String periodId);
}
