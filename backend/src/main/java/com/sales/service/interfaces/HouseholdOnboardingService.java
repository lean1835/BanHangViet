package com.sales.service.interfaces;

import com.sales.dto.response.OnboardingStatusResponse;

public interface HouseholdOnboardingService {

    OnboardingStatusResponse getOnboardingStatus(String currentUsername);

    OnboardingStatusResponse skipOnboarding(String currentUsername);

    OnboardingStatusResponse completeOnboarding(String currentUsername);
}
