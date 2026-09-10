package com.sales.repository;

import com.sales.entity.DiningTable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiningTableRepository extends JpaRepository<DiningTable, String> {

    Optional<DiningTable> findByIdAndHouseholdId(String id, String householdId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DiningTable d WHERE d.id = :id AND d.household.id = :householdId")
    Optional<DiningTable> findByIdAndHouseholdIdForUpdate(@Param("id") String id, @Param("householdId") String householdId);

    List<DiningTable> findByHouseholdIdOrderBySortOrderAscNameAsc(String householdId);

    List<DiningTable> findByHouseholdIdAndAreaOrderBySortOrderAscNameAsc(String householdId, String area);

    List<DiningTable> findByHouseholdIdAndIsActiveOrderBySortOrderAscNameAsc(String householdId, Boolean isActive);

    List<DiningTable> findByHouseholdIdAndAreaAndIsActiveOrderBySortOrderAscNameAsc(String householdId, String area, Boolean isActive);

    @Query("SELECT COUNT(d) > 0 FROM DiningTable d WHERE d.household.id = :householdId AND d.name = :name AND " +
           "((:area IS NULL AND d.area IS NULL) OR d.area = :area)")
    boolean existsByHouseholdIdAndNameAndArea(
            @Param("householdId") String householdId,
            @Param("name") String name,
            @Param("area") String area);

    @Query("SELECT COUNT(d) > 0 FROM DiningTable d WHERE d.household.id = :householdId AND d.name = :name AND " +
           "((:area IS NULL AND d.area IS NULL) OR d.area = :area) AND d.id != :id")
    boolean existsByHouseholdIdAndNameAndAreaAndIdNot(
            @Param("householdId") String householdId,
            @Param("name") String name,
            @Param("area") String area,
            @Param("id") String id);
}
