package com.sales.service.interfaces;

import com.sales.dto.request.ChangePasswordRequest;
import com.sales.dto.request.UpdatePhoneSendOtpRequest;
import com.sales.dto.request.UpdatePhoneVerifyOtpRequest;
import com.sales.dto.request.UpdateProfileRequest;
import com.sales.dto.response.ChangePasswordResponse;
import com.sales.dto.response.UpdatePhoneSendOtpResponse;
import com.sales.dto.response.UserProfileResponse;

public interface ProfileService {

    UserProfileResponse getProfile(String username);

    UserProfileResponse updateProfile(String username, UpdateProfileRequest request);

    ChangePasswordResponse changePassword(String username, ChangePasswordRequest request);

    UpdatePhoneSendOtpResponse sendUpdatePhoneOtp(String username, UpdatePhoneSendOtpRequest request);

    UserProfileResponse verifyAndUpdatePhone(String username, UpdatePhoneVerifyOtpRequest request);
}
