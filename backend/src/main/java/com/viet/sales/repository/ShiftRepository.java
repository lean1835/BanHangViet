package com.viet.sales.repository;

import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.entity.Shift;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;


@Repository
public interface ShiftRepository extends JpaRepository<Shift, String> {
    
    boolean existsByUserIdAndStatus(String userId, ShiftStatus status);

    @EntityGraph(attributePaths = {"user", "household"})
    Optional<Shift> findByUserIdAndStatus(String userId, ShiftStatus status);

    @EntityGraph(attributePaths = {"user", "household"})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Shift s WHERE s.id = :id")
    Optional<Shift> findByIdForUpdate(@Param("id") String id);

    @EntityGraph(attributePaths = {"user", "household"})
    List<Shift> findByHouseholdIdOrderByOpenedAtDesc(String householdId);

    @EntityGraph(attributePaths = {"user", "household"})
    List<Shift> findByHouseholdIdAndUserIdOrderByOpenedAtDesc(String householdId, String userId);
}
