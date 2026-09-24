package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.ChangePasswordRequest;
import com.sales.modules.auth.dto.request.UpdatePhoneSendOtpRequest;
import com.sales.modules.auth.dto.request.UpdatePhoneVerifyOtpRequest;
import com.sales.modules.auth.dto.request.UpdateProfileRequest;
import com.sales.modules.auth.dto.response.ChangePasswordResponse;
import com.sales.modules.auth.dto.response.UpdatePhoneSendOtpResponse;
import com.sales.modules.auth.dto.response.UserProfileResponse;

public interface ProfileService {

    UserProfileResponse getProfile(String username);

    UserProfileResponse updateProfile(String username, UpdateProfileRequest request);

    ChangePasswordResponse changePassword(String username, ChangePasswordRequest request);

    UpdatePhoneSendOtpResponse sendUpdatePhoneOtp(String username, UpdatePhoneSendOtpRequest request);

    UserProfileResponse verifyAndUpdatePhone(String username, UpdatePhoneVerifyOtpRequest request);
}
