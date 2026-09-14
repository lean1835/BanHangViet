package com.sales.service.interfaces;

import com.sales.dto.request.UpdateWarningThresholdRequest;
import com.sales.dto.response.AnnualRevenueTrackingResponse;
import com.sales.dto.response.AppNotificationResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.UpdateWarningThresholdResponse;

public interface AnnualRevenueTrackingService {

    AnnualRevenueTrackingResponse getAnnualRevenueTracking(String currentUsername, Integer year);

    UpdateWarningThresholdResponse updateWarningThreshold(String currentUsername, UpdateWarningThresholdRequest request);

    PageResponse<AppNotificationResponse> getNotifications(String currentUsername, int page, int size);

    long getUnreadNotificationCount(String currentUsername);

    void markNotificationAsRead(String currentUsername, String notificationId);
}
