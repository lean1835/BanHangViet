package com.viet.sales.repository;

import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.entity.Shift;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, String> {
    
    boolean existsByUserIdAndStatus(String userId, ShiftStatus status);

    @EntityGraph(attributePaths = {"user", "household"})
    Optional<Shift> findByUserIdAndStatus(String userId, ShiftStatus status);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Shift s WHERE s.id = :id")
    Optional<Shift> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") String id);
}
