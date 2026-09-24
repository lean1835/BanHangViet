package com.sales.modules.tax.service;
import com.sales.modules.audit.dto.request.UpdateWarningThresholdRequest;
import com.sales.modules.tax.dto.response.AnnualRevenueTrackingResponse;
import com.sales.modules.audit.dto.response.AppNotificationResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.audit.dto.response.UpdateWarningThresholdResponse;

public interface AnnualRevenueTrackingService {

    AnnualRevenueTrackingResponse getAnnualRevenueTracking(String currentUsername, Integer year);

    UpdateWarningThresholdResponse updateWarningThreshold(String currentUsername, UpdateWarningThresholdRequest request);

    PageResponse<AppNotificationResponse> getNotifications(String currentUsername, int page, int size);

    long getUnreadNotificationCount(String currentUsername);

    void markNotificationAsRead(String currentUsername, String notificationId);
}
