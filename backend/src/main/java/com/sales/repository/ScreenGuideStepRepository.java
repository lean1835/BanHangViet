package com.sales.repository;

import com.sales.dto.response.GuideStepCountProjection;
import com.sales.entity.ScreenGuideStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScreenGuideStepRepository extends JpaRepository<ScreenGuideStep, String> {

    List<ScreenGuideStep> findByGuideIdOrderByStepNumberAsc(String guideId);

    @Modifying
    @Query("DELETE FROM ScreenGuideStep s WHERE s.guide.id = :guideId")
    void deleteByGuideId(@Param("guideId") String guideId);

    @Query("SELECT s.guide.id AS guideId, COUNT(s) AS stepCount " +
            "FROM ScreenGuideStep s " +
            "WHERE s.guide.id IN :guideIds " +
            "GROUP BY s.guide.id")
    List<GuideStepCountProjection> countStepsByGuideIds(@Param("guideIds") List<String> guideIds);
}
