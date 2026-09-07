package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phoneNumber;

    @NotBlank(message = "Mã xác thực không được để trống")
    private String otpCode;
}
