package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelInvoiceRequest {

    @NotBlank(message = "Lý do hủy hóa đơn không được để trống")
    @Size(min = 10, max = 500, message = "Lý do hủy hóa đơn phải từ 10 đến 500 ký tự")
    private String cancelReason;
}
