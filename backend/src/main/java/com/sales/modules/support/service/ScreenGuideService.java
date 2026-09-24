package com.sales.modules.support.service;
import com.sales.common.dto.PageResponse;
import com.sales.modules.support.dto.response.ContextualGuideResponse;
import com.sales.modules.support.dto.response.ScreenGuideResponse;
import com.sales.modules.support.dto.response.ScreenGuideSummaryResponse;
import com.sales.modules.support.dto.response.ScreenGuideTopViewedResponse;
import com.sales.modules.support.dto.request.CreateScreenGuideRequest;
import com.sales.modules.support.dto.request.TrackScreenGuideViewRequest;
import com.sales.modules.support.dto.request.UpdateScreenGuideRequest;

import java.util.List;

public interface ScreenGuideService {

    ScreenGuideResponse getGuideByScreenCode(String currentUsername, String screenCode);

    void trackGuideView(String currentUsername, String screenCode, TrackScreenGuideViewRequest request);

    List<ScreenGuideTopViewedResponse> getTopViewedGuides(int limit);

    ContextualGuideResponse getContextualHelpByErrorCode(int errorCode);

    PageResponse<ScreenGuideSummaryResponse> getAllGuides(String currentUsername, String search, String targetRole, int page, int size);

    ScreenGuideResponse createGuide(String currentUsername, CreateScreenGuideRequest request);

    ScreenGuideResponse updateGuide(String currentUsername, String id, UpdateScreenGuideRequest request);

    void deleteGuide(String currentUsername, String id);
}
