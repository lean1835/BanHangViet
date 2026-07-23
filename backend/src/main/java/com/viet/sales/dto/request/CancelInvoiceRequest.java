package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelInvoiceRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    @Size(min = 10, message = "Lý do hủy phải từ 10 ký tự trở lên")
    private String cancelReason;
}
