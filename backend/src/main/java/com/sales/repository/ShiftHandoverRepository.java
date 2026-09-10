package com.sales.repository;

import com.sales.entity.ShiftHandover;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftHandoverRepository extends JpaRepository<ShiftHandover, String> {

    @EntityGraph(attributePaths = {"senderUser", "receiverUser", "shift", "household"})
    List<ShiftHandover> findByShiftIdOrderByStageNumberAsc(String shiftId);

    @EntityGraph(attributePaths = {"senderUser", "receiverUser", "shift", "household"})
    Optional<ShiftHandover> findTopByShiftIdOrderByStageNumberDesc(String shiftId);

    int countByShiftId(String shiftId);
}
