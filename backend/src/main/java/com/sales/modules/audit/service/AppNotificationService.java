package com.sales.modules.audit.service;
import com.sales.modules.audit.dto.request.BatchUpdateNotificationSettingsRequest;
import com.sales.modules.audit.dto.request.CreateNotificationRequest;
import com.sales.modules.audit.dto.request.NotificationFilterRequest;
import com.sales.modules.audit.dto.request.UpdateNotificationSettingRequest;
import com.sales.modules.audit.dto.response.AppNotificationResponse;
import com.sales.modules.audit.dto.response.NotificationBadgeCountResponse;
import com.sales.modules.audit.dto.response.NotificationSettingItemResponse;
import com.sales.common.dto.PageResponse;

import java.util.Collection;
import java.util.List;

public interface AppNotificationService {

    PageResponse<AppNotificationResponse> getNotifications(
            String currentUsername, NotificationFilterRequest filter, int page, int size);

    NotificationBadgeCountResponse getBadgeCount(String currentUsername);

    long getUnreadNotificationCount(String currentUsername);

    void markNotificationAsRead(String currentUsername, String notificationId);

    int markAllAsRead(String currentUsername);

    List<NotificationSettingItemResponse> getNotificationSettings(String currentUsername);

    void updateNotificationSetting(String currentUsername, UpdateNotificationSettingRequest request);

    void updateNotificationSettingsBatch(String currentUsername, BatchUpdateNotificationSettingsRequest request);

    AppNotificationResponse createNotification(String householdId, CreateNotificationRequest request);

    void closeNotificationsByTarget(String targetType, String targetId);

    void closeNotificationsByTargetIds(String targetType, Collection<String> targetIds);

    int syncReminders(String currentUsername);

    void cleanupExpiredNotificationsJob();
}
