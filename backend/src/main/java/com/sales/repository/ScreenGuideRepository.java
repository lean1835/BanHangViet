package com.sales.repository;

import com.sales.entity.ScreenGuide;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScreenGuideRepository extends JpaRepository<ScreenGuide, String>, JpaSpecificationExecutor<ScreenGuide> {

    Optional<ScreenGuide> findByScreenCode(String screenCode);

    Optional<ScreenGuide> findByScreenCodeAndIsActiveTrue(String screenCode);

    boolean existsByScreenCode(String screenCode);

    boolean existsByScreenCodeAndIdNot(String screenCode, String id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ScreenGuide g SET g.viewCount = g.viewCount + 1 WHERE g.screenCode = :screenCode")
    void incrementViewCount(@Param("screenCode") String screenCode);

    List<ScreenGuide> findAllByIsActiveTrueOrderByViewCountDesc(Pageable pageable);

    @Query("SELECT g FROM ScreenGuide g WHERE g.isActive = true AND (g.targetRole = 'ALL' OR g.targetRole = :role)")
    List<ScreenGuide> findAvailableForRole(@Param("role") String role);
}
