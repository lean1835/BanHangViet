package com.sales.service.interfaces;

import com.sales.dto.request.CreateScreenGuideRequest;
import com.sales.dto.request.TrackScreenGuideViewRequest;
import com.sales.dto.request.UpdateScreenGuideRequest;
import com.sales.dto.response.*;

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
