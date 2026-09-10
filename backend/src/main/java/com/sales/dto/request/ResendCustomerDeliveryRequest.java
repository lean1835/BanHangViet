package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResendCustomerDeliveryRequest {

    @NotBlank(message = "Kênh gửi không được để trống")
    @Pattern(regexp = "^(QR|EMAIL|ZALO|PRINT)$", message = "Kênh gửi không hợp lệ (QR, EMAIL, ZALO, PRINT)")
    private String channel;

    @Size(max = 255, message = "Địa chỉ nhận không vượt quá 255 ký tự")
    private String recipientAddress;

    private Boolean updateCustomerDefaultChannel;
}
