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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile Controller", description = "Quản lý thông tin hồ sơ cá nhân, đổi mật khẩu và cập nhật số điện thoại xác thực (NCL-01-CN-006)")
public class ProfileController {

    private final ProfileService profileService;

    @Operation(summary = "Xem thông tin hồ sơ cá nhân", description = "Lấy thông tin chi tiết của người dùng hiện đang đăng nhập")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy thông tin hồ sơ thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực hoặc token không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Tài khoản bị khóa hoặc không có quyền truy cập")
    })
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

    @Operation(summary = "Cập nhật thông tin hồ sơ cá nhân", description = "Cho phép người dùng chỉnh sửa họ tên của mình")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật hồ sơ thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu yêu cầu không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
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

    @Operation(summary = "Đổi mật khẩu cá nhân", description = "Người dùng đổi mật khẩu khi biết mật khẩu hiện tại, sau khi đổi sẽ cấp JWT mới và vô hiệu hóa các phiên cũ")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Mật khẩu xác nhận không khớp, sai mật khẩu cũ hoặc mật khẩu mới trùng mật khẩu cũ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
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

    @Operation(summary = "Gửi mã OTP cập nhật số điện thoại", description = "Gửi mã OTP xác thực tới số điện thoại mới của người dùng (áp dụng cooldown 60s)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Gửi mã OTP thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Số điện thoại không hợp lệ, bị trùng lặp hoặc đang trong thời gian cooldown"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
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

    @Operation(summary = "Xác thực OTP và cập nhật số điện thoại mới", description = "Kiểm tra mã OTP và cập nhật số điện thoại mới cho tài khoản người dùng")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xác thực OTP và cập nhật số điện thoại thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Mã OTP không đúng, hết hạn hoặc vượt quá số lần thử tối đa"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
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
