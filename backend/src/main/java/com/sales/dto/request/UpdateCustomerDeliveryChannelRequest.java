package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerDeliveryChannelRequest {

    @NotBlank(message = "Kênh nhận mặc định không được để trống")
    @Pattern(regexp = "^(QR|EMAIL|ZALO|PRINT)$", message = "Kênh nhận mặc định không hợp lệ (QR, EMAIL, ZALO, PRINT)")
    private String defaultDeliveryChannel;

    @Size(max = 255, message = "Địa chỉ nhận mặc định không vượt quá 255 ký tự")
    private String defaultDeliveryAddress;
}
