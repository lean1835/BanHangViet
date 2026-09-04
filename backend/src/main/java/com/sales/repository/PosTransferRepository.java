package com.sales.repository;

import com.sales.constant.PosTransferStatus;
import com.sales.entity.PosTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PosTransferRepository extends JpaRepository<PosTransfer, String>, JpaSpecificationExecutor<PosTransfer> {

    Optional<PosTransfer> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"fromPointOfSale", "toPointOfSale", "createdByUser", "receivedByUser", "canceledByUser", "items"})
    Optional<PosTransfer> findWithDetailsByIdAndHouseholdId(String id, String householdId);

    @Override
    @EntityGraph(attributePaths = {"fromPointOfSale", "toPointOfSale", "createdByUser", "receivedByUser", "canceledByUser"})
    Page<PosTransfer> findAll(Specification<PosTransfer> spec, Pageable pageable);

    boolean existsByTransferNumber(String transferNumber);

    long countByHouseholdIdAndTransferNumberStartingWith(String householdId, String prefix);
}
