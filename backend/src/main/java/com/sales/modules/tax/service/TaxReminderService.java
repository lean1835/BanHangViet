package com.sales.modules.tax.service;
import com.sales.modules.tax.dto.request.UpdateTaxReminderSettingsRequest;
import com.sales.modules.tax.dto.response.TaxPeriodReminderResponse;
import com.sales.modules.tax.dto.response.TaxReminderScanResultResponse;
import com.sales.modules.tax.dto.response.TaxReminderSettingsResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.BusinessHouseholdSettings;

import java.time.LocalDate;
import java.util.List;

public interface TaxReminderService {

    TaxReminderSettingsResponse getReminderSettings(String currentUsername);

    TaxReminderSettingsResponse updateReminderSettings(String currentUsername, UpdateTaxReminderSettingsRequest request);

    List<TaxPeriodReminderResponse> getActiveReminders(String currentUsername);

    TaxReminderScanResultResponse triggerScanReminders(String currentUsername);

    void scanAndGenerateTaxReminders();

    void scanAndGenerateTaxReminders(LocalDate today);

    int processRemindersForHousehold(BusinessHousehold household, LocalDate today, BusinessHouseholdSettings settings);

    void closeRemindersForPeriod(BusinessHousehold household, String periodId);

    void markDeclarationAsExported(String periodId);

    void markDeclarationAsExported(String currentUsername, String periodId);

    LocalDate calculateTaxFilingDeadline(String periodType, int year, int periodNumber);
}
