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
    @Size(max = 500, message = "Lý do hủy không vượt quá 500 ký tự")
    private String cancelReason;
}
