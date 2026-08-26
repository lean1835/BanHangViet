package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeScanRequest {

    @NotBlank(message = "Mã vạch quét được không được để trống")
    private String barcode;

    private String orderId; // Optional: ID đơn hàng đang mở để thêm hoặc cộng dồn số lượng trực tiếp

    private BigDecimal quantity; // Optional: Số lượng quét (Mặc định 1.000 nếu để trống)
}
