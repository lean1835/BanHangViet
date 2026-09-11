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

    private String phoneNumber;

    private String email;

    @NotBlank(message = "Mã xác thực không được để trống")
    private String otpCode;
}
