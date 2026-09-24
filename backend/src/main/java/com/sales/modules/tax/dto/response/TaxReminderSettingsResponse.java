package com.sales.modules.tax.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxReminderSettingsResponse {
    private String householdId;
    private String householdName;
    private String taxPeriodType;
    private Integer taxReminderDaysBefore;
    private Boolean taxReminderEnabled;
    private LocalDateTime updatedAt;
}
