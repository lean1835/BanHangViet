package com.sales.service.interfaces;

import com.sales.dto.request.ForgotPasswordRequest;
import com.sales.dto.request.ResetPasswordRequest;
import com.sales.dto.request.VerifyOtpRequest;
import com.sales.dto.response.ForgotPasswordResponse;
import com.sales.dto.response.VerifyOtpResponse;

public interface PasswordResetService {
    ForgotPasswordResponse sendResetOtp(ForgotPasswordRequest request);
    VerifyOtpResponse verifyOtp(VerifyOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
}
