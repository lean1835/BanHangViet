package com.sales.service.interfaces;

import com.sales.dto.request.UpdateTaxReminderSettingsRequest;
import com.sales.dto.response.TaxPeriodReminderResponse;
import com.sales.dto.response.TaxReminderScanResultResponse;
import com.sales.dto.response.TaxReminderSettingsResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;

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
