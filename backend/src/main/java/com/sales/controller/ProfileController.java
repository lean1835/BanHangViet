package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.ChangePasswordRequest;
import com.sales.dto.request.UpdatePhoneSendOtpRequest;
import com.sales.dto.request.UpdatePhoneVerifyOtpRequest;
import com.sales.dto.request.UpdateProfileRequest;
import com.sales.dto.response.ChangePasswordResponse;
import com.sales.dto.response.UpdatePhoneSendOtpResponse;
import com.sales.dto.response.UserProfileResponse;
import com.sales.service.interfaces.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Principal principal) {
        UserProfileResponse result = profileService.getProfile(principal.getName());
        ApiResponse<UserProfileResponse> response = ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Lấy thông tin hồ sơ cá nhân thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse result = profileService.updateProfile(principal.getName(), request);
        ApiResponse<UserProfileResponse> response = ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Cập nhật hồ sơ cá nhân thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<ChangePasswordResponse>> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        ChangePasswordResponse result = profileService.changePassword(principal.getName(), request);
        ApiResponse<ChangePasswordResponse> response = ApiResponse.<ChangePasswordResponse>builder()
                .code(1000)
                .message("Đổi mật khẩu thành công. Các phiên làm việc khác đã được đăng xuất.")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/phone/send-otp")
    public ResponseEntity<ApiResponse<UpdatePhoneSendOtpResponse>> sendUpdatePhoneOtp(
            Principal principal,
            @Valid @RequestBody UpdatePhoneSendOtpRequest request) {
        UpdatePhoneSendOtpResponse result = profileService.sendUpdatePhoneOtp(principal.getName(), request);
        ApiResponse<UpdatePhoneSendOtpResponse> response = ApiResponse.<UpdatePhoneSendOtpResponse>builder()
                .code(1000)
                .message(result.getMessage())
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/phone/verify-otp")
    public ResponseEntity<ApiResponse<UserProfileResponse>> verifyAndUpdatePhone(
            Principal principal,
            @Valid @RequestBody UpdatePhoneVerifyOtpRequest request) {
        UserProfileResponse result = profileService.verifyAndUpdatePhone(principal.getName(), request);
        ApiResponse<UserProfileResponse> response = ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .message("Xác thực mã OTP và cập nhật số điện thoại thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
