package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.ForgotPasswordRequest;
import com.sales.modules.auth.dto.request.ResetPasswordRequest;
import com.sales.modules.auth.dto.request.VerifyOtpRequest;
import com.sales.modules.auth.dto.response.ForgotPasswordResponse;
import com.sales.modules.auth.dto.response.VerifyOtpResponse;

public interface PasswordResetService {
    ForgotPasswordResponse sendResetOtp(ForgotPasswordRequest request);
    VerifyOtpResponse verifyOtp(VerifyOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
}
