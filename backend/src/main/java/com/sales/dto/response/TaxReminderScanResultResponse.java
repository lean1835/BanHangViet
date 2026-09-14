package com.sales.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxReminderScanResultResponse {
    private int householdsScanned;
    private int notificationsCreated;
    private int notificationsUpdated;
    private int notificationsClosed;
    private List<TaxPeriodReminderResponse> activeReminders;
}
