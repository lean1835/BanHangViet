package com.sales.modules.support.dto.response;

public interface ScreenGuideViewStatsProjection {
    String getScreenCode();
    Long getTotalLogged();
    Long getTotalCompleted();
    Double getAvgDuration();
    Long getRecentViews();
}
