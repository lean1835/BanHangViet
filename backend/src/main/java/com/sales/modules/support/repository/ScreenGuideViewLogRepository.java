package com.sales.modules.support.repository;
import com.sales.modules.support.dto.response.ScreenGuideViewStatsProjection;
import com.sales.modules.support.entity.ScreenGuideViewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScreenGuideViewLogRepository extends JpaRepository<ScreenGuideViewLog, String> {

    Long countByScreenCode(String screenCode);

    Long countByScreenCodeAndCompletedTrue(String screenCode);

    @Query("SELECT COUNT(l) FROM ScreenGuideViewLog l WHERE l.screenCode = :screenCode AND l.createdAt >= :afterDate")
    Long countByScreenCodeAndCreatedAtAfter(@Param("screenCode") String screenCode, @Param("afterDate") LocalDateTime afterDate);

    @Query("SELECT AVG(l.durationSeconds) FROM ScreenGuideViewLog l WHERE l.screenCode = :screenCode AND l.durationSeconds > 0")
    Double getAverageDurationByScreenCode(@Param("screenCode") String screenCode);

    @Query("SELECT l.screenCode AS screenCode, " +
            "COUNT(l) AS totalLogged, " +
            "SUM(CASE WHEN l.completed = true THEN 1L ELSE 0L END) AS totalCompleted, " +
            "AVG(CASE WHEN l.durationSeconds > 0 THEN l.durationSeconds ELSE NULL END) AS avgDuration, " +
            "SUM(CASE WHEN l.createdAt >= :afterDate THEN 1L ELSE 0L END) AS recentViews " +
            "FROM ScreenGuideViewLog l " +
            "WHERE l.screenCode IN :screenCodes " +
            "GROUP BY l.screenCode")
    List<ScreenGuideViewStatsProjection> getAggregatedStatsByScreenCodes(
            @Param("screenCodes") List<String> screenCodes,
            @Param("afterDate") LocalDateTime afterDate);
}
