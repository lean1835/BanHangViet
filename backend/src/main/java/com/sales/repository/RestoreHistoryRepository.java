package com.sales.repository;

import com.sales.entity.RestoreHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestoreHistoryRepository extends JpaRepository<RestoreHistory, String> {

    @EntityGraph(attributePaths = {"backupHistory", "restoredByUser"})
    Page<RestoreHistory> findByHouseholdIdOrderByRestoredAtDesc(String householdId, Pageable pageable);

    Optional<RestoreHistory> findByIdAndHouseholdId(String id, String householdId);

    long countByHouseholdId(String householdId);
}

