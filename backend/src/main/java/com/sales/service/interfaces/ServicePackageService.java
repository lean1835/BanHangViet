package com.sales.service.interfaces;

import com.sales.dto.request.AssignSubscriptionRequest;
import com.sales.dto.request.CreateServicePackageRequest;
import com.sales.dto.request.UpdateServicePackageRequest;
import com.sales.dto.response.HouseholdSubscriptionResponse;
import com.sales.dto.response.HouseholdUsageStatsResponse;
import com.sales.dto.response.ServicePackageResponse;

import java.util.List;

public interface ServicePackageService {

    List<ServicePackageResponse> getAllPackages();

    ServicePackageResponse getPackageById(String id);

    ServicePackageResponse createPackage(String currentUsername, CreateServicePackageRequest request);

    ServicePackageResponse updatePackage(String currentUsername, String id, UpdateServicePackageRequest request);

    HouseholdSubscriptionResponse assignSubscription(String currentUsername, String householdId, AssignSubscriptionRequest request);

    HouseholdSubscriptionResponse getActiveSubscription(String householdId);

    HouseholdUsageStatsResponse getUsageStats(String householdId);

    HouseholdUsageStatsResponse getMySubscriptionUsage(String currentUsername);

    void validateUserQuota(String householdId);

    void validatePosQuota(String householdId);

    void recordInvoiceIssued(String householdId);
}
