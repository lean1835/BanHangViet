package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.response.OnboardingStatusResponse;

public interface HouseholdOnboardingService {

    OnboardingStatusResponse getOnboardingStatus(String currentUsername);

    OnboardingStatusResponse skipOnboarding(String currentUsername);

    OnboardingStatusResponse completeOnboarding(String currentUsername);
}
