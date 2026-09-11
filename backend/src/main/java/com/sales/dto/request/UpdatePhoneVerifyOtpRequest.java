package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePhoneVerifyOtpRequest {

    @NotBlank(message = "Số điện thoại mới không được để trống")
    @Pattern(regexp = "^0[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)")
    private String newPhoneNumber;

    @NotBlank(message = "Mã xác thực không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã xác thực phải gồm 6 chữ số")
    private String otpCode;
}
