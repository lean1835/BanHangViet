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
}
