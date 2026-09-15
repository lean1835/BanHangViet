package com.sales.repository;

import com.sales.dto.response.ShiftHandoverCountProjection;
import com.sales.entity.ShiftHandover;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftHandoverRepository extends JpaRepository<ShiftHandover, String> {

    @EntityGraph(attributePaths = {"senderUser", "receiverUser", "shift", "household"})
    List<ShiftHandover> findByShiftIdOrderByStageNumberAsc(String shiftId);

    @EntityGraph(attributePaths = {"senderUser", "receiverUser", "shift", "household"})
    Optional<ShiftHandover> findTopByShiftIdOrderByStageNumberDesc(String shiftId);

    int countByShiftId(String shiftId);

    @Query("SELECT h.shift.id AS shiftId, COUNT(h) AS handoverCount FROM ShiftHandover h WHERE h.shift.id IN :shiftIds GROUP BY h.shift.id")
    List<ShiftHandoverCountProjection> countHandoversByShiftIds(@Param("shiftIds") Collection<String> shiftIds);
}
